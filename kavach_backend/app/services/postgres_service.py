from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
import zlib

import psycopg
from psycopg.rows import dict_row

from app.core.config import settings


class PostgresService:
    """Service wrapper for persisted detection pipeline data in PostgreSQL."""

    DEFAULT_FARMER_ID = 1
    DEFAULT_VET_ID = 2

    def _connect(self):
        return psycopg.connect(settings.POSTGRES_DSN, row_factory=dict_row)

    def _bootstrap_defaults(self, conn) -> tuple[int, int, int]:
        """Return default IDs for legacy detection tables.

        Animal linkage is optional for scan persistence; avoid creating animals
        because newer schema uses UUID farm-linked animals.
        """
        return self.DEFAULT_FARMER_ID, self.DEFAULT_VET_ID, None

    def resolve_or_create_farmer_scope_id(self, scope_key: str) -> int:
        normalized_scope = (scope_key or "").strip()
        if not normalized_scope:
            return self.DEFAULT_FARMER_ID

        # Use a deterministic negative int ID to avoid collisions with existing
        # legacy positive farmer IDs already present in detection tables.
        hashed = zlib.crc32(normalized_scope.encode("utf-8")) & 0x7FFFFFFF
        return -max(1, int(hashed))

    def _as_iso(self, value: Any) -> Optional[str]:
        if isinstance(value, datetime):
            return value.isoformat()
        return None if value is None else str(value)

    def save_detection_record(
        self,
        *,
        species: str,
        predicted_label: str,
        confidence: float,
        severity: str,
        recommendation: str,
        status: str,
        image_url: Optional[str] = None,
        farmer_id: Optional[int] = None,
        animal_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        with self._connect() as conn:
            default_farmer_id, _, default_animal_id = self._bootstrap_defaults(conn)
            resolved_farmer_id = farmer_id or default_farmer_id
            resolved_animal_id = animal_id or default_animal_id

            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO detection_records (
                        farmer_id,
                        animal_id,
                        species,
                        predicted_label,
                        confidence,
                        severity,
                        status,
                        recommendation,
                        image_url
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        resolved_farmer_id,
                        resolved_animal_id,
                        species,
                        predicted_label,
                        confidence,
                        severity,
                        status,
                        recommendation,
                        image_url,
                    ),
                )
                detection = dict(cur.fetchone())

                case_status = "closed" if status == "safe" else "open"
                cur.execute(
                    """
                    INSERT INTO cases (
                        detection_id,
                        farmer_id,
                        animal_id,
                        status,
                        notes
                    )
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, status, created_at, updated_at
                    """,
                    (
                        detection["id"],
                        resolved_farmer_id,
                        resolved_animal_id,
                        case_status,
                        recommendation,
                    ),
                )
                case_row = dict(cur.fetchone())

        detection["created_at"] = self._as_iso(detection.get("created_at"))
        detection["updated_at"] = self._as_iso(detection.get("updated_at"))
        case_row["created_at"] = self._as_iso(case_row.get("created_at"))
        case_row["updated_at"] = self._as_iso(case_row.get("updated_at"))
        detection["case"] = case_row
        return detection

    def list_farmer_detection_history(self, *, limit: int = 100, farmer_id: Optional[int] = None) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            default_farmer_id, _, _ = self._bootstrap_defaults(conn)
            resolved_farmer_id = farmer_id or default_farmer_id

            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        dr.id,
                        dr.species,
                        dr.predicted_label,
                        dr.confidence,
                        dr.severity,
                        dr.status,
                        dr.recommendation,
                        dr.created_at,
                        dr.updated_at,
                        CASE
                            WHEN dr.status = 'pending_review' THEN 'pending'
                            ELSE COALESCE(rv.review_status, dr.status, 'pending')
                        END AS review_status,
                        CASE
                            WHEN dr.status = 'pending_review' THEN NULL
                            ELSE rv.vet_note
                        END AS vet_note
                    FROM detection_records dr
                    LEFT JOIN LATERAL (
                        SELECT review_status, vet_note
                        FROM detection_reviews
                        WHERE detection_id = dr.id
                        ORDER BY reviewed_at DESC, updated_at DESC, id DESC
                        LIMIT 1
                    ) rv ON TRUE
                    WHERE dr.farmer_id = %s
                    ORDER BY dr.created_at DESC
                    LIMIT %s
                    """,
                    (resolved_farmer_id, limit),
                )
                rows = [dict(r) for r in cur.fetchall()]

        for row in rows:
            row["created_at"] = self._as_iso(row.get("created_at"))
            row["updated_at"] = self._as_iso(row.get("updated_at"))
        return rows

    def delete_detection(self, detection_id: int, *, farmer_id: Optional[int] = None) -> bool:
        with self._connect() as conn:
            default_farmer_id, _, _ = self._bootstrap_defaults(conn)
            resolved_farmer_id = farmer_id or default_farmer_id

            with conn.cursor() as cur:
                cur.execute(
                    "SELECT 1 FROM detection_records WHERE id = %s AND farmer_id = %s",
                    (detection_id, resolved_farmer_id),
                )
                if not cur.fetchone():
                    return False

                cur.execute(
                    "DELETE FROM detection_reviews WHERE detection_id = %s",
                    (detection_id,),
                )
                cur.execute(
                    "DELETE FROM cases WHERE detection_id = %s",
                    (detection_id,),
                )
                cur.execute(
                    "DELETE FROM detection_records WHERE id = %s",
                    (detection_id,),
                )
                deleted = cur.rowcount > 0
        return deleted

    def clear_farmer_detection_history(self, *, farmer_id: Optional[int] = None) -> int:
        with self._connect() as conn:
            default_farmer_id, _, _ = self._bootstrap_defaults(conn)
            resolved_farmer_id = farmer_id or default_farmer_id

            with conn.cursor() as cur:
                cur.execute(
                    """
                    DELETE FROM detection_reviews
                    WHERE detection_id IN (
                        SELECT id FROM detection_records WHERE farmer_id = %s
                    )
                    """,
                    (resolved_farmer_id,),
                )
                cur.execute(
                    """
                    DELETE FROM cases
                    WHERE detection_id IN (
                        SELECT id FROM detection_records WHERE farmer_id = %s
                    )
                    """,
                    (resolved_farmer_id,),
                )
                cur.execute("DELETE FROM detection_records WHERE farmer_id = %s", (resolved_farmer_id,))
                count = cur.rowcount
        return count

    def list_vlm_review_items(self, *, status: str = "pending_review", limit: int = 200) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            self._bootstrap_defaults(conn)
            with conn.cursor() as cur:
                base_query = """
                    SELECT
                        dr.id AS detection_id,
                        dr.species,
                        dr.predicted_label,
                        dr.confidence,
                        dr.severity,
                        dr.status,
                        dr.recommendation,
                        dr.created_at,
                        c.id AS case_id,
                        c.status AS case_status,
                        ('Farmer #' || dr.farmer_id::text) AS farmer_name,
                        COALESCE('Animal #' || dr.animal_id::text, 'Unknown Animal') AS animal_name,
                        COALESCE(rv.review_status, 'pending') AS review_status,
                        rv.vet_note
                    FROM detection_records dr
                    LEFT JOIN cases c ON c.detection_id = dr.id
                    LEFT JOIN LATERAL (
                        SELECT review_status, vet_note
                        FROM detection_reviews
                        WHERE detection_id = dr.id
                        ORDER BY reviewed_at DESC, updated_at DESC, id DESC
                        LIMIT 1
                    ) rv ON TRUE
                """

                if status == "all":
                    cur.execute(
                        base_query
                        + """
                        ORDER BY dr.created_at DESC
                        LIMIT %s
                        """,
                        (limit,),
                    )
                elif status == "pending_review":
                    cur.execute(
                        base_query
                        + """
                        WHERE dr.status = 'pending_review'
                        ORDER BY dr.created_at DESC
                        LIMIT %s
                        """,
                        (limit,),
                    )
                else:
                    cur.execute(
                        base_query
                        + """
                        WHERE dr.status = %s
                        ORDER BY dr.created_at DESC
                        LIMIT %s
                        """,
                        (status, limit),
                    )

                rows = [dict(r) for r in cur.fetchall()]

        for row in rows:
            row["created_at"] = self._as_iso(row.get("created_at"))
        return rows

    def upsert_detection_review(
        self,
        *,
        detection_id: int,
        review_status: str,
        vet_note: Optional[str],
        vet_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        with self._connect() as conn:
            _, default_vet_id, _ = self._bootstrap_defaults(conn)
            resolved_vet_id = vet_id or default_vet_id

            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM detection_reviews WHERE detection_id = %s ORDER BY reviewed_at DESC, updated_at DESC, id DESC LIMIT 1",
                    (detection_id,),
                )
                existing = cur.fetchone()

                if existing:
                    cur.execute(
                        """
                        UPDATE detection_reviews
                        SET review_status = %s,
                            vet_note = %s,
                            vet_id = %s,
                            reviewed_at = CURRENT_TIMESTAMP,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                        RETURNING *
                        """,
                        (review_status, vet_note, resolved_vet_id, existing["id"]),
                    )
                else:
                    cur.execute(
                        """
                        INSERT INTO detection_reviews (detection_id, vet_id, review_status, vet_note)
                        VALUES (%s, %s, %s, %s)
                        RETURNING *
                        """,
                        (detection_id, resolved_vet_id, review_status, vet_note),
                    )

                review = dict(cur.fetchone())

                # Mirror reviewed verdict to detection status for a consistent lifecycle.
                detection_status = review_status
                case_status = "closed" if review_status == "safe" else "in_progress"

                cur.execute(
                    """
                    UPDATE detection_records
                    SET status = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    """,
                    (detection_status, detection_id),
                )

                cur.execute(
                    """
                    UPDATE cases
                    SET status = %s,
                        assigned_vet_id = %s,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE detection_id = %s
                    """,
                    (case_status, resolved_vet_id, detection_id),
                )

        review["reviewed_at"] = self._as_iso(review.get("reviewed_at"))
        review["updated_at"] = self._as_iso(review.get("updated_at"))
        return review

    def list_cases(self, *, limit: int = 200, status: Optional[str] = None) -> List[Dict[str, Any]]:
        with self._connect() as conn:
            self._bootstrap_defaults(conn)
            with conn.cursor() as cur:
                query = """
                    SELECT
                        c.id,
                        c.status,
                        c.notes,
                        c.created_at,
                        c.updated_at,
                        dr.id AS detection_id,
                        dr.species,
                        dr.predicted_label,
                        dr.confidence,
                        dr.severity,
                        dr.status AS detection_status,
                        ('Farmer #' || c.farmer_id::text) AS farmer_name,
                        COALESCE('Animal #' || c.animal_id::text, 'Unknown Animal') AS animal_name,
                        CASE
                            WHEN c.assigned_vet_id IS NULL THEN NULL
                            ELSE ('Vet #' || c.assigned_vet_id::text)
                        END AS vet_name,
                        COALESCE(rv.review_status, 'pending') AS review_status,
                        rv.vet_note
                    FROM cases c
                    JOIN detection_records dr ON dr.id = c.detection_id
                    LEFT JOIN LATERAL (
                        SELECT review_status, vet_note
                        FROM detection_reviews
                        WHERE detection_id = dr.id
                        ORDER BY reviewed_at DESC, updated_at DESC, id DESC
                        LIMIT 1
                    ) rv ON TRUE
                """
                params: tuple[Any, ...] = (limit,)
                if status:
                    query += " WHERE c.status = %s"
                    params = (status, limit)
                query += " ORDER BY c.updated_at DESC LIMIT %s"

                cur.execute(query, params)
                rows = [dict(r) for r in cur.fetchall()]

        for row in rows:
            row["created_at"] = self._as_iso(row.get("created_at"))
            row["updated_at"] = self._as_iso(row.get("updated_at"))
        return rows

    def get_analytics(self) -> Dict[str, Any]:
        with self._connect() as conn:
            self._bootstrap_defaults(conn)
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT species, COUNT(*) AS total, AVG(confidence) AS avg_confidence
                    FROM detection_records
                    GROUP BY species
                    ORDER BY species
                    """
                )
                by_species = [dict(r) for r in cur.fetchall()]

                cur.execute(
                    """
                    SELECT COALESCE(review_status, 'pending') AS review_status, COUNT(*) AS total
                    FROM (
                        SELECT dr.id,
                               (SELECT review_status
                                FROM detection_reviews rv
                                WHERE rv.detection_id = dr.id
                                ORDER BY rv.reviewed_at DESC, rv.updated_at DESC, rv.id DESC
                                LIMIT 1) AS review_status
                        FROM detection_records dr
                    ) q
                    GROUP BY COALESCE(review_status, 'pending')
                    ORDER BY review_status
                    """
                )
                overall_reviews = [dict(r) for r in cur.fetchall()]

                cur.execute(
                    """
                    SELECT
                        TO_CHAR(created_at::date, 'YYYY-MM-DD') AS day,
                        species,
                        COUNT(*) AS total
                    FROM detection_records
                    GROUP BY created_at::date, species
                    ORDER BY created_at::date
                    """
                )
                trend_rows = [dict(r) for r in cur.fetchall()]

        for row in by_species:
            row["avg_confidence"] = float(row.get("avg_confidence") or 0.0)
            row["total"] = int(row.get("total") or 0)

        for row in overall_reviews:
            row["total"] = int(row.get("total") or 0)

        trend_map: Dict[str, Dict[str, Any]] = {}
        for row in trend_rows:
            day = str(row["day"])
            if day not in trend_map:
                trend_map[day] = {
                    "day": day,
                    "overall": 0,
                    "pig": 0,
                    "cattle": 0,
                    "poultry": 0,
                }
            species = str(row["species"])
            total = int(row.get("total") or 0)
            trend_map[day]["overall"] += total
            if species in {"pig", "cattle", "poultry"}:
                trend_map[day][species] += total

        trend = [trend_map[k] for k in sorted(trend_map.keys())]

        return {
            "overall_reviews": overall_reviews,
            "by_species": by_species,
            "trend": trend,
        }


postgres_service = PostgresService()
