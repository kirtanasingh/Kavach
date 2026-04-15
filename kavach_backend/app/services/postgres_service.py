from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

import psycopg
from psycopg.rows import dict_row

from app.core.config import settings


class PostgresService:
    """Service wrapper for persisted detection pipeline data in PostgreSQL."""

    def _connect(self):
        return psycopg.connect(settings.POSTGRES_DSN, row_factory=dict_row)

    def _bootstrap_defaults(self, conn) -> tuple[int, int, int]:
        """Ensure default farmer, vet, and one animal exist for demo/local auth flows."""
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users (name, email, role)
                VALUES (%s, %s, 'farmer')
                ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
                RETURNING id
                """,
                ("Demo Farmer", "farmer@kavach.local"),
            )
            farmer_id = int(cur.fetchone()["id"])

            cur.execute(
                """
                INSERT INTO users (name, email, role)
                VALUES (%s, %s, 'vet')
                ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
                RETURNING id
                """,
                ("Demo Vet", "vet@kavach.local"),
            )
            vet_id = int(cur.fetchone()["id"])

            cur.execute(
                """
                SELECT id FROM animals WHERE farmer_id = %s ORDER BY created_at ASC LIMIT 1
                """,
                (farmer_id,),
            )
            animal_row = cur.fetchone()
            if animal_row:
                animal_id = int(animal_row["id"])
            else:
                cur.execute(
                    """
                    INSERT INTO animals (farmer_id, animal_name, species, tag_number)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                    """,
                    (farmer_id, "Default Animal", "pig", f"AN-{farmer_id}-001"),
                )
                animal_id = int(cur.fetchone()["id"])

        return farmer_id, vet_id, animal_id

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

                case_status = "closed" if status == "completed" else "open"
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
                        COALESCE(rv.review_status, 'pending') AS review_status,
                        rv.vet_note
                    FROM detection_records dr
                    LEFT JOIN LATERAL (
                        SELECT review_status, vet_note
                        FROM detection_reviews
                        WHERE detection_id = dr.id
                        ORDER BY reviewed_at DESC
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
                    "DELETE FROM detection_records WHERE id = %s AND farmer_id = %s",
                    (detection_id, resolved_farmer_id),
                )
                deleted = cur.rowcount > 0
        return deleted

    def clear_farmer_detection_history(self, *, farmer_id: Optional[int] = None) -> int:
        with self._connect() as conn:
            default_farmer_id, _, _ = self._bootstrap_defaults(conn)
            resolved_farmer_id = farmer_id or default_farmer_id

            with conn.cursor() as cur:
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
                        fu.name AS farmer_name,
                        COALESCE(a.animal_name, a.tag_number, 'Unknown Animal') AS animal_name,
                        COALESCE(rv.review_status, 'pending') AS review_status,
                        rv.vet_note
                    FROM detection_records dr
                    LEFT JOIN cases c ON c.detection_id = dr.id
                    LEFT JOIN users fu ON fu.id = dr.farmer_id
                    LEFT JOIN animals a ON a.id = dr.animal_id
                    LEFT JOIN LATERAL (
                        SELECT review_status, vet_note
                        FROM detection_reviews
                        WHERE detection_id = dr.id
                        ORDER BY reviewed_at DESC
                        LIMIT 1
                    ) rv ON TRUE
                """

                if status == "pending_review":
                    cur.execute(
                        base_query
                        + """
                        WHERE COALESCE(rv.review_status, 'pending') = 'pending'
                        ORDER BY dr.created_at DESC
                        LIMIT %s
                        """,
                        (limit,),
                    )
                else:
                    cur.execute(
                        base_query
                        + """
                        WHERE dr.status = %s OR COALESCE(rv.review_status, 'pending') = %s
                        ORDER BY dr.created_at DESC
                        LIMIT %s
                        """,
                        (status, status, limit),
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
                    "SELECT id FROM detection_reviews WHERE detection_id = %s AND vet_id = %s ORDER BY reviewed_at DESC LIMIT 1",
                    (detection_id, resolved_vet_id),
                )
                existing = cur.fetchone()

                if existing:
                    cur.execute(
                        """
                        UPDATE detection_reviews
                        SET review_status = %s,
                            vet_note = %s,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                        RETURNING *
                        """,
                        (review_status, vet_note, existing["id"]),
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

                detection_status = "completed"
                case_status = "closed"
                if review_status == "not_safe":
                    detection_status = "flagged"
                    case_status = "in_progress"
                elif review_status == "other":
                    detection_status = "manual_review"
                    case_status = "in_progress"

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
                        fu.name AS farmer_name,
                        COALESCE(a.animal_name, a.tag_number, 'Unknown Animal') AS animal_name,
                        vv.name AS vet_name,
                        COALESCE(rv.review_status, 'pending') AS review_status,
                        rv.vet_note
                    FROM cases c
                    JOIN detection_records dr ON dr.id = c.detection_id
                    LEFT JOIN users fu ON fu.id = c.farmer_id
                    LEFT JOIN users vv ON vv.id = c.assigned_vet_id
                    LEFT JOIN animals a ON a.id = c.animal_id
                    LEFT JOIN LATERAL (
                        SELECT review_status, vet_note
                        FROM detection_reviews
                        WHERE detection_id = dr.id
                        ORDER BY reviewed_at DESC
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
                                ORDER BY rv.reviewed_at DESC
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
