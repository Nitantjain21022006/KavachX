import os
import joblib

def load_bundle(model_path):
    """
    Loads the unified machine learning bundle from disk.
    Contains model, scaler, feature names, and metadata.
    """
    try:
        bundle = joblib.load(model_path)
        print(f"  ✅ Unified bundle loaded successfully from {os.path.basename(model_path)}!")
        return bundle
    except Exception as e:
        print(f"  ❌ Error loading bundle at {model_path}: {e}")
        return None
