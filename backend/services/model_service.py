import os
import json
import joblib
from typing import Dict, Any, List

class ModelService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        # Path artefak models/final/
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.model_path = os.path.join(base_dir, "models", "final", "random_forest_model.joblib")
        self.schema_path = os.path.join(base_dir, "models", "final", "feature_schema.json")
        self.metrics_path = os.path.join(base_dir, "models", "final", "evaluation_metrics.json")
        self.metadata_path = os.path.join(base_dir, "models", "final", "training_metadata.json")

        self.model = None
        self.schema = {}
        self.metrics = {}
        self.metadata = {}
        self.is_loaded = False
        self.load_error = None

        self._load_artifacts()

    def _load_artifacts(self):
        try:
            if not os.path.exists(self.model_path):
                raise FileNotFoundError(f"Model file not found at: {self.model_path}")
            
            # Load Scikit-learn model once on startup
            self.model = joblib.load(self.model_path)
            
            with open(self.schema_path, 'r', encoding='utf-8') as f:
                self.schema = json.load(f)

            with open(self.metrics_path, 'r', encoding='utf-8') as f:
                self.metrics = json.load(f)

            if os.path.exists(self.metadata_path):
                with open(self.metadata_path, 'r', encoding='utf-8') as f:
                    self.metadata = json.load(f)

            self.is_loaded = True
            print(f"[ModelService] Random Forest Model v{self.schema.get('model_version', '3.0')} successfully loaded into memory.")
        except Exception as e:
            self.is_loaded = False
            self.load_error = str(e)
            print(f"[ModelService ERROR] Failed to load model: {e}")

    @property
    def feature_names(self) -> List[str]:
        return self.schema.get("features", [])

    def get_evaluation(self) -> Dict[str, Any]:
        return self.metrics

    def get_info(self) -> Dict[str, Any]:
        return {
            "algorithm": self.schema.get("model_type", "RandomForestClassifier"),
            "model_version": "3.0",
            "features_count": len(self.feature_names),
            "features_names": self.feature_names,
            "target_mapping": self.schema.get("target_classes", {"0": "Phishing", "1": "Legitimate"}),
            "dataset_name": self.metrics.get("dataset_name", "PhiUSIIL Phishing URL Dataset"),
            "hyperparameters": self.metadata.get("hyperparameters", {
                "n_estimators": 100,
                "max_depth": 25,
                "random_state": 42,
                "class_weight": "balanced"
            })
        }

model_service = ModelService()
