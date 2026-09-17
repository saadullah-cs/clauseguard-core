import logging
from pathlib import Path
from typing import List, Tuple
import joblib
import numpy as np

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

from clauseguard.models.document import ClauseSegment
from clauseguard.models.ml import ClausePredictionResult, ClauseCategory

logger = logging.getLogger(__name__)


class ClauseRiskClassifier:
    r"""
    Supervised Machine Learning engine for legal clause categorization.
    
    Architecture:
    - Feature Extraction: TF-IDF vectorization utilizing uni/bi/tri-grams. 
      Term Frequency-Inverse Document Frequency is calculated as: 
      $w_{i,j} = tf_{i,j} \times \log\left(\frac{N}{df_i}\right)$
      This penalizes common legal boilerplate while surfacing rare, high-risk operational terms.
    - Estimator: Random Forest Classifier (100 estimators) yielding class probabilities 
      to synthesize the 0-100 continuous risk score.
    """

    def __init__(self, model_dir: Path):
        self.model_dir = model_dir
        self.model_path = self.model_dir / "risk_classifier.joblib"
        self.pipeline: Pipeline | None = None
        
        if not self.model_dir.exists():
            self.model_dir.mkdir(parents=True, exist_ok=True)

    def build_pipeline(self) -> None:
        """Constructs the untrained Scikit-Learn ML pipeline."""
        self.pipeline = Pipeline([
            (
                'tfidf', 
                TfidfVectorizer(
                    lowercase=True, 
                    stop_words='english',
                    ngram_range=(1, 3), 
                    max_features=5000
                )
            ),
            (
                'clf', 
                RandomForestClassifier(
                    n_estimators=100, 
                    random_state=42, 
                    class_weight='balanced',
                    n_jobs=-1
                )
            )
        ])
        logger.info("Initialized TF-IDF -> Random Forest pipeline.")

    def train_and_evaluate(self, X_train: List[str], y_train: List[str], X_test: List[str], y_test: List[str]) -> str:
        """
        Fits the pipeline and computes evaluation metrics.
        
        Args:
            X_train: Training text corpora.
            y_train: Target ClauseCategory string labels.
            X_test: Validation text corpora.
            y_test: Validation target labels.
            
        Returns:
            str: The formatted classification report (Precision, Recall, F1).
        """
        if self.pipeline is None:
            self.build_pipeline()

        logger.info(f"Initiating training over {len(X_train)} samples...")
        self.pipeline.fit(X_train, y_train)
        
        logger.info(f"Executing validation over {len(X_test)} samples...")
        predictions = self.pipeline.predict(X_test)
        
        report = classification_report(y_test, predictions, zero_division=0)
        logger.info("\n" + report)
        
        self._persist_model()
        return report

    def _persist_model(self) -> None:
        """Serializes the trained pipeline to disk via joblib."""
        joblib.dump(self.pipeline, self.model_path)
        logger.info(f"Model serialized successfully to {self.model_path}")

    def load_model(self) -> None:
        """Loads a pre-trained pipeline into memory."""
        if not self.model_path.exists():
            raise FileNotFoundError(f"Trained model not found at {self.model_path}. Execute training first.")
        self.pipeline = joblib.load(self.model_path)
        logger.info(f"Loaded active model from {self.model_path}")

    def predict(self, segment: ClauseSegment) -> ClausePredictionResult:
        """
        Executes inference on a single ClauseSegment domain object.
        Computes the target class and derives the risk score from the predicted probability.
        """
        if self.pipeline is None:
            raise RuntimeError("Pipeline is uninitialized. Call load_model() or train_and_evaluate() prior to inference.")

        # Extract features and predict
        predicted_label = self.pipeline.predict([segment.content])[0]
        probabilities = self.pipeline.predict_proba([segment.content])[0]
        
        # Risk score is defined as the confidence of the predicted class mapped to a 100-point scale.
        max_prob = float(np.max(probabilities))
        risk_score = round(max_prob * 100, 2)
        
        # Override baseline risk based on clause category severity
        if predicted_label in [ClauseCategory.INDEMNITY.value, ClauseCategory.LIABILITY_LIMITATION.value]:
            # Indemnity and Liability naturally demand a higher baseline risk floor
            risk_score = max(risk_score, 65.0)

        return ClausePredictionResult(
            segment_id=segment.segment_id,
            predicted_category=ClauseCategory(predicted_label),
            risk_score=risk_score,
            risk_level=ClausePredictionResult.compute_risk_level(risk_score)
        )