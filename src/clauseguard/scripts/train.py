import logging
from pathlib import Path
from clauseguard.services.classifier import ClauseRiskClassifier
from clauseguard.models.ml import ClauseCategory

logging.basicConfig(level=logging.INFO, format="%(message)s")

def main():
    # Synthetic dataset demonstrating distinctive lexical features
    dataset = [
        ("The Contractor shall indemnify, defend and hold harmless the Agency from any claims...", ClauseCategory.INDEMNITY),
        ("Neither party shall be liable for indirect, special, or consequential damages...", ClauseCategory.LIABILITY_LIMITATION),
        ("This Agreement may be terminated by either party upon thirty (30) days written notice.", ClauseCategory.TERMINATION),
        ("In no event shall delays caused by acts of God, war, or natural disaster be penalized.", ClauseCategory.FORCE_MAJEURE),
        ("The software is provided 'as is' without warranty of any kind, express or implied.", ClauseCategory.WARRANTY),
        ("This Agreement constitutes the entire understanding between the parties.", ClauseCategory.GENERAL),
    ] * 50  # Artificially expand to simulate a larger dataset for the RandomForest

    X = [text for text, label in dataset]
    y = [label.value for text, label in dataset]

    # Simple 80/20 train/test split calculation
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    model_dir = Path(__file__).resolve().parent.parent.parent.parent / "models"
    classifier = ClauseRiskClassifier(model_dir=model_dir)
    
    print("\n--- Starting Phase 2 Model Training ---")
    classifier.train_and_evaluate(X_train, y_train, X_test, y_test)

if __name__ == "__main__":
    main()