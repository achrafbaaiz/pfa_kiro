"""
Phase 2 - Preprocessing, EDA, XGBoost Training avec Hyperparameter Tuning + SHAP
Detection de risque de credit bancaire - Personnes morales
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    roc_curve, precision_recall_curve, f1_score, accuracy_score
)
from imblearn.over_sampling import SMOTE
import xgboost as xgb
import shap
import joblib
import os
import warnings
warnings.filterwarnings("ignore")

# --- Configuration ---
DATA_PATH = "data/dataset_credit_entreprises.csv"
MODEL_OUTPUT = "models/xgboost_credit_model.joblib"
ENCODERS_OUTPUT = "models/label_encoders.joblib"
FIGURES_DIR = "figures"
os.makedirs(FIGURES_DIR, exist_ok=True)
os.makedirs("models", exist_ok=True)

# =============================================================
# 1. CHARGEMENT ET EXPLORATION (EDA)
# =============================================================
print("=" * 60)
print("PHASE 2 - EDA, Preprocessing & XGBoost Training")
print("=" * 60)

df = pd.read_csv(DATA_PATH)
print(f"\nDataset shape: {df.shape}")
print(f"\nValeurs manquantes:\n{df.isnull().sum().sum()} valeurs manquantes au total")
print(f"\nDistribution cible:\n{df['Defaut_Paiement'].value_counts()}")
print(f"\nTypes de donnees:\n{df.dtypes.value_counts()}")

# --- EDA Visualisations ---
# Distribution de la cible
fig, axes = plt.subplots(1, 2, figsize=(12, 4))
df["Defaut_Paiement"].value_counts().plot(kind="bar", ax=axes[0], color=["#2ecc71", "#e74c3c"])
axes[0].set_title("Distribution Defaut_Paiement")
axes[0].set_xticklabels(["Non-Defaut (0)", "Defaut (1)"], rotation=0)

# Correlation heatmap (variables numeriques)
numeric_cols = df.select_dtypes(include=[np.number]).columns
corr = df[numeric_cols].corr()
sns.heatmap(corr, cmap="RdBu_r", center=0, ax=axes[1], fmt=".1f",
            xticklabels=False, yticklabels=False)
axes[1].set_title("Matrice de Correlation")
plt.tight_layout()
plt.savefig(f"{FIGURES_DIR}/eda_overview.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"\n[EDA] Figure sauvegardee: {FIGURES_DIR}/eda_overview.png")

# Distributions par classe
fig, axes = plt.subplots(2, 3, figsize=(15, 8))
key_vars = ["Ratio_Endettement", "Ratio_Liquidite_Generale", "ROA",
            "Score_Altman_Z", "Marge_Nette", "Nb_Incidents_Paiement_12M"]
for ax, var in zip(axes.flatten(), key_vars):
    for label, color in zip([0, 1], ["#2ecc71", "#e74c3c"]):
        df[df["Defaut_Paiement"] == label][var].hist(
            ax=ax, alpha=0.6, bins=30, color=color, label=f"{'Defaut' if label else 'Non-Defaut'}")
    ax.set_title(var)
    ax.legend()
plt.tight_layout()
plt.savefig(f"{FIGURES_DIR}/distributions_par_classe.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"[EDA] Figure sauvegardee: {FIGURES_DIR}/distributions_par_classe.png")

# =============================================================
# 2. PREPROCESSING
# =============================================================
print("\n" + "=" * 60)
print("PREPROCESSING")
print("=" * 60)

# Encodage des variables categoriques
label_encoders = {}
cat_cols = df.select_dtypes(include=["object"]).columns.tolist()
print(f"\nVariables categoriques a encoder: {cat_cols}")

for col in cat_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    label_encoders[col] = le

# Separation features / target
X = df.drop("Defaut_Paiement", axis=1)
y = df["Defaut_Paiement"]

# Train/Test split (stratifie)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"\nTrain: {X_train.shape[0]} | Test: {X_test.shape[0]}")
print(f"Taux defaut train: {y_train.mean()*100:.1f}% | test: {y_test.mean()*100:.1f}%")

# Gestion du desequilibre avec SMOTE
smote = SMOTE(random_state=42)
X_train_res, y_train_res = smote.fit_resample(X_train, y_train)
print(f"\nApres SMOTE - Train: {X_train_res.shape[0]} samples")
print(f"Distribution: {pd.Series(y_train_res).value_counts().to_dict()}")

# =============================================================
# 3. XGBOOST - HYPERPARAMETER TUNING (GridSearchCV)
# =============================================================
print("\n" + "=" * 60)
print("XGBOOST - HYPERPARAMETER TUNING")
print("=" * 60)

param_grid = {
    "n_estimators": [100, 200, 300],
    "max_depth": [3, 5, 7],
    "learning_rate": [0.01, 0.1, 0.2],
    "subsample": [0.8, 1.0],
    "colsample_bytree": [0.8, 1.0],
}

xgb_model = xgb.XGBClassifier(
    objective="binary:logistic",
    eval_metric="auc",
    use_label_encoder=False,
    random_state=42
)

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

grid_search = GridSearchCV(
    estimator=xgb_model,
    param_grid=param_grid,
    cv=cv,
    scoring="roc_auc",
    n_jobs=-1,
    verbose=1
)

print("\nRecherche des meilleurs hyperparametres (GridSearchCV 5-fold)...")
grid_search.fit(X_train_res, y_train_res)

print(f"\nMeilleurs hyperparametres:\n{grid_search.best_params_}")
print(f"Meilleur AUC (CV): {grid_search.best_score_:.4f}")

best_model = grid_search.best_estimator_

# =============================================================
# 4. EVALUATION DU MODELE
# =============================================================
print("\n" + "=" * 60)
print("EVALUATION SUR LE JEU DE TEST")
print("=" * 60)

y_pred = best_model.predict(X_test)
y_pred_proba = best_model.predict_proba(X_test)[:, 1]

print(f"\nAccuracy:  {accuracy_score(y_test, y_pred):.4f}")
print(f"F1-Score:  {f1_score(y_test, y_pred):.4f}")
print(f"ROC-AUC:   {roc_auc_score(y_test, y_pred_proba):.4f}")
print(f"\nClassification Report:\n{classification_report(y_test, y_pred, target_names=['Non-Defaut', 'Defaut'])}")

# --- Matrice de confusion ---
fig, axes = plt.subplots(1, 3, figsize=(18, 5))

cm = confusion_matrix(y_test, y_pred)
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues", ax=axes[0],
            xticklabels=["Non-Defaut", "Defaut"], yticklabels=["Non-Defaut", "Defaut"])
axes[0].set_title("Matrice de Confusion")
axes[0].set_ylabel("Vrai")
axes[0].set_xlabel("Predit")

# --- Courbe ROC ---
fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
axes[1].plot(fpr, tpr, color="#3498db", lw=2, label=f"AUC = {roc_auc_score(y_test, y_pred_proba):.3f}")
axes[1].plot([0, 1], [0, 1], "k--", lw=1)
axes[1].set_title("Courbe ROC")
axes[1].set_xlabel("Taux Faux Positifs")
axes[1].set_ylabel("Taux Vrais Positifs")
axes[1].legend()

# --- Courbe Precision-Recall ---
precision, recall, _ = precision_recall_curve(y_test, y_pred_proba)
axes[2].plot(recall, precision, color="#e74c3c", lw=2)
axes[2].set_title("Courbe Precision-Recall")
axes[2].set_xlabel("Recall")
axes[2].set_ylabel("Precision")

plt.tight_layout()
plt.savefig(f"{FIGURES_DIR}/model_evaluation.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"\n[EVAL] Figure sauvegardee: {FIGURES_DIR}/model_evaluation.png")

# =============================================================
# 5. EXPLICABILITE - SHAP VALUES
# =============================================================
print("\n" + "=" * 60)
print("EXPLICABILITE - SHAP VALUES")
print("=" * 60)

explainer = shap.TreeExplainer(best_model)
shap_values = explainer.shap_values(X_test)

# SHAP Summary Plot
plt.figure(figsize=(10, 8))
shap.summary_plot(shap_values, X_test, feature_names=X.columns.tolist(), show=False)
plt.tight_layout()
plt.savefig(f"{FIGURES_DIR}/shap_summary.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"[SHAP] Figure sauvegardee: {FIGURES_DIR}/shap_summary.png")

# SHAP Bar Plot (importance moyenne)
plt.figure(figsize=(10, 6))
shap.summary_plot(shap_values, X_test, feature_names=X.columns.tolist(),
                  plot_type="bar", show=False)
plt.tight_layout()
plt.savefig(f"{FIGURES_DIR}/shap_importance.png", dpi=150, bbox_inches="tight")
plt.close()
print(f"[SHAP] Figure sauvegardee: {FIGURES_DIR}/shap_importance.png")

# Feature importance XGBoost natif
importance = pd.DataFrame({
    "Feature": X.columns,
    "Importance": best_model.feature_importances_
}).sort_values("Importance", ascending=False)
print(f"\nTop 10 Features (XGBoost native):\n{importance.head(10).to_string(index=False)}")

# =============================================================
# 6. SAUVEGARDE DU MODELE
# =============================================================
joblib.dump(best_model, MODEL_OUTPUT)
joblib.dump(label_encoders, ENCODERS_OUTPUT)
joblib.dump(X.columns.tolist(), "models/feature_names.joblib")

print(f"\n[SAVE] Modele sauvegarde: {MODEL_OUTPUT}")
print(f"[SAVE] Encoders sauvegardes: {ENCODERS_OUTPUT}")
print(f"[SAVE] Feature names: models/feature_names.joblib")
print("\n--- Phase 2 terminee avec succes ---")
