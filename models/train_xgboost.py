"""
Train XGBoost model on Taiwan Bankruptcy Prediction Dataset
- Feature selection (top 20 most important)
- Probability calibration for smooth, responsive risk scores
- Cross-validation
- Save model artifacts
"""
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.calibration import CalibratedClassifierCV
from xgboost import XGBClassifier
import joblib
import os

# Load data
df = pd.read_csv("data/data_1.csv")
df.columns = df.columns.str.strip()
print(f"Dataset: {df.shape[0]} rows, {df.shape[1]} columns")
print(f"Target distribution:\n{df['Bankrupt?'].value_counts()}")
print(f"Bankruptcy rate: {df['Bankrupt?'].mean()*100:.2f}%")

# Target and features
target = "Bankrupt?"
X = df.drop(columns=[target])
y = df[target]

# Replace infinite values and fill NaN
X = X.replace([np.inf, -np.inf], np.nan).fillna(X.median())

# Step 1: Feature selection via quick model
print("\n--- Feature Selection ---")
neg, pos = (y == 0).sum(), (y == 1).sum()
scale_ratio = neg / pos
print(f"Class imbalance ratio: {scale_ratio:.1f}:1")

quick_model = XGBClassifier(n_estimators=100, max_depth=5, scale_pos_weight=scale_ratio, random_state=42, eval_metric='logloss')
quick_model.fit(X, y)
importances = pd.Series(quick_model.feature_importances_, index=X.columns).sort_values(ascending=False)

TOP_N = 20
top_features = importances.head(TOP_N).index.tolist()
print(f"Top {TOP_N} features selected:")
for i, f in enumerate(top_features, 1):
    print(f"  {i}. {f} ({importances[f]:.4f})")

X_selected = X[top_features]

# Step 2: Train-test split
X_train, X_test, y_train, y_test = train_test_split(X_selected, y, test_size=0.2, random_state=42, stratify=y)

# Step 3: Train XGBoost with lower regularization for more sensitivity to input changes
print("\n--- Training XGBoost ---")
base_model = XGBClassifier(
    n_estimators=200,
    max_depth=4,
    learning_rate=0.08,
    subsample=0.85,
    colsample_bytree=0.85,
    scale_pos_weight=scale_ratio,
    reg_alpha=0.5,
    reg_lambda=1,
    min_child_weight=2,
    gamma=0.1,
    random_state=42,
    eval_metric='logloss'
)
base_model.fit(X_train, y_train)

# Step 4: Calibrate probabilities using isotonic regression for smoother outputs
print("\n--- Calibrating Probabilities ---")
calibrated_model = CalibratedClassifierCV(base_model, method='isotonic', cv=5)
calibrated_model.fit(X_selected, y)

# Step 5: Evaluate
y_pred = calibrated_model.predict(X_test)
y_proba = calibrated_model.predict_proba(X_test)[:, 1]
print("\n--- Classification Report ---")
print(classification_report(y_test, y_pred))
print(f"AUC-ROC: {roc_auc_score(y_test, y_proba):.4f}")

print(f"\n--- Probability Distribution (test set) ---")
print(f"  Min: {y_proba.min():.4f}")
print(f"  Max: {y_proba.max():.4f}")
print(f"  Mean (bankrupt): {y_proba[y_test==1].mean():.4f}")
print(f"  Mean (healthy): {y_proba[y_test==0].mean():.4f}")
print(f"  Std: {y_proba.std():.4f}")

# Cross-validation on base model
print("\n--- Cross-Validation (base model) ---")
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
cv_scores = cross_val_score(base_model, X_selected, y, cv=cv, scoring='roc_auc')
print(f"CV AUC-ROC: {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")

# Step 6: Save artifacts
os.makedirs("models", exist_ok=True)
joblib.dump(calibrated_model, "models/xgboost_credit_model.joblib")
joblib.dump(top_features, "models/feature_names.joblib")
# Save the base model for SHAP (CalibratedCV doesn't support SHAP directly)
joblib.dump(base_model, "models/xgboost_base_model.joblib")
print("\n--- Saved ---")
print("  models/xgboost_credit_model.joblib (calibrated)")
print("  models/xgboost_base_model.joblib (for SHAP)")
print("  models/feature_names.joblib")
print(f"\nFeatures used: {top_features}")
