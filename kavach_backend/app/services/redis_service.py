import redis
import json
from typing import Optional, Any, List
from app.core.config import settings

class RedisService:
    def __init__(self):
        self.client = redis.from_url(settings.REDIS_URL)

    def set_image_bytes(self, scan_id: str, image_bytes: bytes, expire: int = 3600):
        self.client.setex(f"image:{scan_id}", expire, image_bytes)

    def get_image_bytes(self, scan_id: str) -> Optional[bytes]:
        return self.client.get(f"image:{scan_id}")

    def set_scan_result(self, scan_id: str, result_dict: dict, expire: int = 86400):
        self.client.setex(f"scan:{scan_id}", expire, json.dumps(result_dict))

    def get_scan_result(self, scan_id: str) -> Optional[dict]:
        data = self.client.get(f"scan:{scan_id}")
        if data:
            return json.loads(data)
        return None

    def set_scan_status(self, scan_id: str, status: str, expire: int = 86400):
        self.client.setex(f"status:{scan_id}", expire, status)

    def get_scan_status(self, scan_id: str) -> Optional[str]:
        data = self.client.get(f"status:{scan_id}")
        return data.decode("utf-8") if data else None

    # Alert methods
    def set_alert(self, alert_id: str, alert_data: dict, expire: int = 2592000):
        self.client.setex(f"alert:{alert_id}", expire, json.dumps(alert_data))
        # Add to alerts set for quick lookup
        self.client.sadd("alerts:all", alert_id)

    def get_alert(self, alert_id: str) -> Optional[dict]:
        data = self.client.get(f"alert:{alert_id}")
        if data:
            return json.loads(data)
        return None

    def get_all_alerts(self, limit: int = 100) -> List[dict]:
        alert_ids = self.client.smembers("alerts:all")
        alerts = []
        for alert_id in list(alert_ids)[:limit]:
            alert = self.get_alert(alert_id.decode() if isinstance(alert_id, bytes) else alert_id)
            if alert:
                alerts.append(alert)
        return alerts

    # Detection/VLM methods
    def set_detection(self, case_id: str, detection_data: dict, expire: int = 86400):
        self.client.setex(f"detection:{case_id}", expire, json.dumps(detection_data))
        status = detection_data.get("status", "queued")
        if status == "pending_review":
            self.client.sadd("detections:pending_review", case_id)

    def get_detection(self, case_id: str) -> Optional[dict]:
        data = self.client.get(f"detection:{case_id}")
        if data:
            return json.loads(data)
        return None

    def get_detections_by_status(self, status: str, limit: int = 100) -> List[dict]:
        if status == "pending_review":
            case_ids = self.client.smembers("detections:pending_review")
            detections = []
            for case_id in list(case_ids)[:limit]:
                detection = self.get_detection(case_id.decode() if isinstance(case_id, bytes) else case_id)
                if detection:
                    detections.append(detection)
            return detections
        return []

    # Annotation methods
    def set_annotation(self, case_id: str, annotation_data: dict, expire: int = 86400):
        self.client.setex(f"annotation:{case_id}", expire, json.dumps(annotation_data))
        # Remove from pending_review once annotated
        self.client.srem("detections:pending_review", case_id)

    def get_annotation(self, case_id: str) -> Optional[dict]:
        data = self.client.get(f"annotation:{case_id}")
        if data:
            return json.loads(data)
        return None

redis_service = RedisService()
