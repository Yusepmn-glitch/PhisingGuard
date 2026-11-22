import os
import sqlite3
import json
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "history.db")

class DatabaseService:
    def __init__(self):
        self._init_db()

    def _get_connection(self):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS scan_history (
                    id TEXT PRIMARY KEY,
                    url TEXT NOT NULL,
                    prediction TEXT NOT NULL,
                    label INTEGER NOT NULL,
                    prob_legitimate REAL NOT NULL,
                    prob_phishing REAL NOT NULL,
                    risk_level TEXT NOT NULL,
                    processing_time_ms REAL NOT NULL,
                    scanned_at TEXT NOT NULL,
                    features_json TEXT
                )
            """)
            conn.commit()

    def save_scan(self, record: Dict[str, Any]):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO scan_history (
                    id, url, prediction, label, prob_legitimate, prob_phishing,
                    risk_level, processing_time_ms, scanned_at, features_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record["id"],
                record["url"],
                record["prediction"],
                record["label"],
                record["prob_legitimate"],
                record["prob_phishing"],
                record["risk_level"],
                record["processing_time_ms"],
                record["scanned_at"],
                json.dumps(record.get("features", {}))
            ))
            conn.commit()

    def get_all_scans(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, url, prediction, label, prob_legitimate, prob_phishing,
                       risk_level, processing_time_ms, scanned_at, features_json
                FROM scan_history
                ORDER BY scanned_at DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            results = []
            for row in rows:
                item = dict(row)
                if item.get("features_json"):
                    item["features"] = json.loads(item["features_json"])
                    del item["features_json"]
                results.append(item)
            return results

    def get_scan_by_id(self, scan_id: str) -> Optional[Dict[str, Any]]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, url, prediction, label, prob_legitimate, prob_phishing,
                       risk_level, processing_time_ms, scanned_at, features_json
                FROM scan_history
                WHERE id = ?
            """, (scan_id,))
            row = cursor.fetchone()
            if not row:
                return None
            item = dict(row)
            if item.get("features_json"):
                item["features"] = json.loads(item["features_json"])
                del item["features_json"]
            return item

db_service = DatabaseService()
