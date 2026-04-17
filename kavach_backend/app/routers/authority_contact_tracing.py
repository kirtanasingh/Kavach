from __future__ import annotations

from datetime import datetime, timezone
import zlib
from typing import Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import AuthorityOnly, CurrentUser

router = APIRouter(prefix="/authority", tags=["Authority"], dependencies=[AuthorityOnly])


class NetworkFarm(BaseModel):
    id: int
    name: str
    state: str
    species: str
    movements: int
    connections: int
    animals: int
    lastDetection: str
    district: str


class NetworkEdge(BaseModel):
    a: int
    b: int
    strength: float
    type: str


class ContactTracingResponse(BaseModel):
    farms: List[NetworkFarm]
    edges: List[NetworkEdge]


class AuthoritySummaryResponse(BaseModel):
    total_farms: int
    active_alerts: int
    compliance_rate: int
    critical_outbreaks: int
    last_updated: str


def _scope_id(owner_user_id: UUID | str | None) -> int:
    if not owner_user_id:
        return 1
    hashed = zlib.crc32(str(owner_user_id).encode("utf-8")) & 0x7FFFFFFF
    return -max(1, int(hashed))


def _species_label(raw: str) -> str:
    raw_l = (raw or "").lower()
    if any(k in raw_l for k in ("poultry", "chicken", "bird")):
        return "Poultry"
    if any(k in raw_l for k in ("pig", "swine", "pork")):
        return "Pig"
    if any(k in raw_l for k in ("goat", "sheep", "ovine")):
        return "Goat"
    return "Cattle"


def _movement_type(raw: str) -> str:
    raw_l = (raw or "").lower()
    if "water" in raw_l:
        return "shared_water"
    if "equip" in raw_l or "tool" in raw_l:
        return "equipment_share"
    if "poultry" in raw_l or "bird" in raw_l:
        return "poultry_trade"
    return "cattle_trade"


def _days_ago_text(days: int | None) -> str:
    if days is None:
        return "None"
    if days <= 0:
        return "today"
    if days == 1:
        return "1 day ago"
    return f"{days} days ago"


async def _safe_scalar(db: AsyncSession, query: str, params: dict | None = None, default: int = 0) -> int:
    try:
        result = await db.execute(text(query), params or {})
        value = result.scalar()
        return int(value or 0)
    except ProgrammingError:
        await db.rollback()
        return default


@router.get("/contact-tracing", response_model=ContactTracingResponse)
async def get_contact_tracing(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> ContactTracingResponse:
    _ = current_user

    farms_result = await db.execute(
        text(
            """
            SELECT
                f.id,
                f.owner_user_id,
                f.farm_name,
                COALESCE(f.farm_type, 'mixed') AS farm_type,
                COALESCE(f.total_animals, 0) AS total_animals,
                COALESCE(f.city, f.state, 'Unknown') AS district,
                f.created_at
            FROM farms f
            ORDER BY f.created_at ASC
            LIMIT 200
            """
        )
    )
    farm_rows = farms_result.mappings().all()

    if not farm_rows:
        return ContactTracingResponse(farms=[], edges=[])

    farm_meta: List[Dict] = []
    scope_ids: List[int] = []
    for row in farm_rows:
        scope = _scope_id(row.get("owner_user_id"))
        farm_meta.append(
            {
                "farm_uuid": row.get("id"),
                "farm_name": str(row.get("farm_name") or "Unnamed Farm"),
                "species": _species_label(str(row.get("farm_type") or "mixed")),
                "animals": int(row.get("total_animals") or 0),
                "district": str(row.get("district") or "Unknown"),
                "scope_id": scope,
            }
        )
        scope_ids.append(scope)

    detection_map: Dict[int, Dict[str, int | None]] = {}
    if scope_ids:
        dr_result = await db.execute(
            text(
                """
                SELECT
                    dr.farmer_id,
                    MIN(CASE WHEN dr.status = 'not_safe'
                             AND dr.created_at >= NOW() - INTERVAL '14 days'
                             THEN EXTRACT(day FROM NOW() - dr.created_at)::int END) AS infected_days,
                    MIN(CASE WHEN dr.status = 'pending_review'
                             AND dr.created_at >= NOW() - INTERVAL '30 days'
                             THEN EXTRACT(day FROM NOW() - dr.created_at)::int END) AS atrisk_days,
                    MIN(CASE WHEN dr.status IN ('not_safe', 'pending_review')
                             THEN EXTRACT(day FROM NOW() - dr.created_at)::int END) AS last_detection_days
                FROM detection_records dr
                WHERE dr.farmer_id = ANY(:scope_ids)
                GROUP BY dr.farmer_id
                """
            ),
            {"scope_ids": scope_ids},
        )
        for row in dr_result.mappings().all():
            detection_map[int(row["farmer_id"])] = {
                "infected_days": row.get("infected_days"),
                "atrisk_days": row.get("atrisk_days"),
                "last_detection_days": row.get("last_detection_days"),
            }

    farms_out: List[NetworkFarm] = []
    farm_uuid_to_index: Dict[str, int] = {}

    for idx, meta in enumerate(farm_meta):
        risk = detection_map.get(meta["scope_id"], {})
        infected_days = risk.get("infected_days") if risk else None
        atrisk_days = risk.get("atrisk_days") if risk else None

        if infected_days is not None:
            state = "Infected"
        elif atrisk_days is not None:
            state = "At risk"
        else:
            state = "Safe"

        farm_uuid = str(meta["farm_uuid"])
        farm_uuid_to_index[farm_uuid] = idx

        farms_out.append(
            NetworkFarm(
                id=idx,
                name=meta["farm_name"],
                state=state,
                species=meta["species"],
                movements=0,
                connections=0,
                animals=meta["animals"],
                lastDetection=_days_ago_text(risk.get("last_detection_days") if risk else None),
                district=meta["district"],
            )
        )

    edges_out: List[NetworkEdge] = []
    movement_count_by_index: Dict[int, int] = {i: 0 for i in range(len(farms_out))}
    connection_sets: Dict[int, set[int]] = {i: set() for i in range(len(farms_out))}

    try:
        edges_result = await db.execute(
            text(
                """
                SELECT
                    fm.source_farm_id::text AS src,
                    fm.target_farm_id::text AS tgt,
                    COALESCE(fm.movement_type, '') AS movement_type,
                    COUNT(*) AS move_count
                FROM farm_movements fm
                WHERE fm.movement_date >= NOW() - INTERVAL '60 days'
                GROUP BY fm.source_farm_id, fm.target_farm_id, fm.movement_type
                ORDER BY move_count DESC
                LIMIT 300
                """
            )
        )
        for row in edges_result.mappings().all():
            src = str(row.get("src") or "")
            tgt = str(row.get("tgt") or "")
            if src not in farm_uuid_to_index or tgt not in farm_uuid_to_index:
                continue

            a = farm_uuid_to_index[src]
            b = farm_uuid_to_index[tgt]
            moves = int(row.get("move_count") or 0)
            strength = round(min(moves / 12.0, 1.0), 2)
            edge_type = _movement_type(str(row.get("movement_type") or ""))

            edges_out.append(NetworkEdge(a=a, b=b, strength=strength, type=edge_type))
            movement_count_by_index[a] += moves
            movement_count_by_index[b] += moves
            connection_sets[a].add(b)
            connection_sets[b].add(a)

        moves_30_result = await db.execute(
            text(
                """
                SELECT farm_id::text AS farm_id, SUM(movement_total)::int AS total_moves
                FROM (
                    SELECT fm.source_farm_id AS farm_id, COUNT(*) AS movement_total
                    FROM farm_movements fm
                    WHERE fm.movement_date >= NOW() - INTERVAL '30 days'
                    GROUP BY fm.source_farm_id
                    UNION ALL
                    SELECT fm.target_farm_id AS farm_id, COUNT(*) AS movement_total
                    FROM farm_movements fm
                    WHERE fm.movement_date >= NOW() - INTERVAL '30 days'
                    GROUP BY fm.target_farm_id
                ) t
                GROUP BY farm_id
                """
            )
        )
        moves_30_map = {str(r["farm_id"]): int(r.get("total_moves") or 0) for r in moves_30_result.mappings().all()}

        for i, farm in enumerate(farms_out):
            farm_uuid = str(farm_meta[i]["farm_uuid"])
            farms_out[i] = farm.model_copy(
                update={
                    "movements": moves_30_map.get(farm_uuid, movement_count_by_index.get(i, 0)),
                    "connections": len(connection_sets.get(i, set())),
                }
            )
    except ProgrammingError:
        # farm_movements table may not be present yet in all environments.
        pass

    return ContactTracingResponse(farms=farms_out, edges=edges_out)


@router.get("/summary", response_model=AuthoritySummaryResponse)
async def get_authority_summary(
    current_user: CurrentUser,
    db: AsyncSession = Depends(get_db),
) -> AuthoritySummaryResponse:
    _ = current_user

    total_farms = await _safe_scalar(
        db,
        """
        SELECT COUNT(*)
        FROM farms
        """,
    )

    active_alerts = await _safe_scalar(
        db,
        """
        SELECT COUNT(*)
        FROM farm_alerts
        WHERE COALESCE(is_read, FALSE) = FALSE
        """,
    )

    critical_outbreaks = await _safe_scalar(
        db,
        """
        SELECT COUNT(*)
        FROM detection_records
        WHERE status = 'not_safe'
          AND created_at >= NOW() - INTERVAL '14 days'
        """,
    )

    profiles_total = await _safe_scalar(
        db,
        """
        SELECT COUNT(*)
        FROM farm_risk_profiles
        """,
    )
    profiles_high = await _safe_scalar(
        db,
        """
        SELECT COUNT(*)
        FROM farm_risk_profiles
        WHERE LOWER(COALESCE(risk_level, '')) = 'high'
        """,
    )

    if profiles_total > 0:
        compliance_rate = round(((profiles_total - profiles_high) / profiles_total) * 100)
    elif total_farms > 0:
        compliance_rate = 100
    else:
        compliance_rate = 0

    return AuthoritySummaryResponse(
        total_farms=total_farms,
        active_alerts=active_alerts,
        compliance_rate=max(0, min(100, int(compliance_rate))),
        critical_outbreaks=critical_outbreaks,
        last_updated=datetime.now(timezone.utc).isoformat(),
    )
