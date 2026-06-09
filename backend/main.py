"""
Backend API - CreditRisk AI
Endpoints: /predict, /stats, /simulate, /report, /compare-models
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict
import numpy as np
import pandas as pd
import joblib
import shap
import io
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from sklearn.preprocessing import LabelEncoder

# --- Chargement des artefacts ---
model = joblib.load("models/xgboost_credit_model.joblib")
label_encoders = joblib.load("models/label_encoders.joblib")
feature_names = joblib.load("models/feature_names.joblib")
explainer = shap.TreeExplainer(model)
dataset = pd.read_csv("data/dataset_credit_entreprises.csv")

app = FastAPI(title="API Risque de Credit - Personnes Morales", version="2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# --- Schemas ---
class EntrepriseInput(BaseModel):
    Secteur: str
    Taille_Entreprise: str
    Anciennete_Annees: int
    Ratio_Liquidite_Generale: float
    Ratio_Liquidite_Reduite: float
    Ratio_Endettement: float
    Ratio_Capacite_Remboursement: float
    Taux_Endettement_Net: float
    ROE: float
    ROA: float
    Marge_Nette: float
    Marge_Brute: float
    Chiffre_Affaires_Log: float
    Croissance_CA: float
    Ratio_Fonds_Propres: float
    Ratio_Tresorerie_Nette: float
    Delai_Paiement_Clients_Jours: int
    Delai_Paiement_Fournisseurs_Jours: int
    Ratio_Couverture_Interets: float
    Score_Altman_Z: float
    Nb_Incidents_Paiement_12M: int
    Nb_Credits_En_Cours: int


class SimulateInput(BaseModel):
    base_data: EntrepriseInput
    modifications: Dict[str, float]


def get_risk_level(proba: float) -> dict:
    if proba < 0.3:
        return {"niveau": "Faible", "couleur": "#2ecc71"}
    elif proba < 0.6:
        return {"niveau": "Moyen", "couleur": "#f39c12"}
    return {"niveau": "Eleve", "couleur": "#e74c3c"}


def predict_single(input_dict: dict):
    encoded = input_dict.copy()
    for col, le in label_encoders.items():
        if col in encoded:
            encoded[col] = le.transform([encoded[col]])[0]
    df = pd.DataFrame([encoded])[feature_names]
    proba = float(model.predict_proba(df)[:, 1][0])
    shap_vals = explainer.shap_values(df)[0]
    shap_dict = {f: round(float(v), 4) for f, v in zip(feature_names, shap_vals)}
    risk = get_risk_level(proba)
    return {
        "probabilite_defaut": round(proba, 4),
        "prediction": int(proba >= 0.5),
        "niveau_risque": risk["niveau"],
        "couleur_risque": risk["couleur"],
        "shap_values": shap_dict,
        "base_value": round(float(explainer.expected_value), 4),
    }


# ==================== ENDPOINTS ====================

@app.get("/")
def root():
    return {"message": "API Risque de Credit - Personnes Morales", "status": "active"}


@app.get("/features")
def get_features():
    return {
        "features": feature_names,
        "secteurs": list(label_encoders["Secteur"].classes_),
        "tailles": list(label_encoders["Taille_Entreprise"].classes_),
    }


@app.post("/predict")
def predict(data: EntrepriseInput):
    return predict_single(data.model_dump())


# ==================== STATS / DASHBOARD ====================

@app.get("/stats")
def get_stats():
    df = dataset.copy()
    total = len(df)
    defauts = int(df["Defaut_Paiement"].sum())
    taux_defaut = round(defauts / total * 100, 1)

    # Par secteur
    par_secteur = df.groupby("Secteur")["Defaut_Paiement"].agg(["count", "sum", "mean"])
    secteur_stats = [
        {"secteur": s, "total": int(r["count"]), "defauts": int(r["sum"]), "taux": round(r["mean"] * 100, 1)}
        for s, r in par_secteur.iterrows()
    ]

    # Par taille
    par_taille = df.groupby("Taille_Entreprise")["Defaut_Paiement"].agg(["count", "sum", "mean"])
    taille_stats = [
        {"taille": t, "total": int(r["count"]), "defauts": int(r["sum"]), "taux": round(r["mean"] * 100, 1)}
        for t, r in par_taille.iterrows()
    ]

    # Distribution des variables cles
    key_vars = ["Ratio_Endettement", "ROA", "Ratio_Liquidite_Generale", "Score_Altman_Z", "Marge_Nette"]
    distributions = {}
    for var in key_vars:
        distributions[var] = {
            "defaut": df[df["Defaut_Paiement"] == 1][var].describe().round(3).to_dict(),
            "non_defaut": df[df["Defaut_Paiement"] == 0][var].describe().round(3).to_dict(),
        }

    # Correlation avec la cible
    numeric = df.select_dtypes(include=[np.number])
    correlations = numeric.corr()["Defaut_Paiement"].drop("Defaut_Paiement").sort_values(key=abs, ascending=False)
    top_corr = [{"variable": k, "correlation": round(v, 3)} for k, v in correlations.head(10).items()]

    return {
        "total_entreprises": total,
        "total_defauts": defauts,
        "taux_defaut_global": taux_defaut,
        "par_secteur": secteur_stats,
        "par_taille": taille_stats,
        "distributions": distributions,
        "top_correlations": top_corr,
    }


# ==================== SIMULATION WHAT-IF ====================

@app.post("/simulate")
def simulate(data: SimulateInput):
    base = data.base_data.model_dump()

    # Prediction de base
    result_base = predict_single(base)

    # Prediction avec modifications
    modified = base.copy()
    for key, val in data.modifications.items():
        if key in modified:
            modified[key] = val
    result_modified = predict_single(modified)

    # Delta
    delta = round(result_modified["probabilite_defaut"] - result_base["probabilite_defaut"], 4)

    return {
        "base": result_base,
        "modified": result_modified,
        "delta_probabilite": delta,
        "delta_pct": round(delta * 100, 2),
        "impact": "positif" if delta < 0 else "negatif" if delta > 0 else "neutre",
    }


# ==================== RAPPORT PDF ====================

@app.post("/report")
def generate_report(data: EntrepriseInput):
    result = predict_single(data.model_dump())

    # Generate PDF with reportlab
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('Title2', parent=styles['Title'], fontSize=18, spaceAfter=20)
    elements = []

    # Title
    elements.append(Paragraph("Rapport d'Analyse de Risque de Credit", title_style))
    elements.append(Paragraph("CreditRisk AI - Plateforme de Detection", styles['Normal']))
    elements.append(Spacer(1, 20))

    # Resultat principal
    color = colors.red if result["prediction"] == 1 else colors.green
    elements.append(Paragraph(f"<b>Probabilite de defaut :</b> {result['probabilite_defaut']*100:.1f}%", styles['Heading2']))
    elements.append(Paragraph(f"<b>Niveau de risque :</b> {result['niveau_risque']}", styles['Heading2']))
    elements.append(Paragraph(f"<b>Decision :</b> {'Defaut probable' if result['prediction']==1 else 'Entreprise solvable'}", styles['Heading2']))
    elements.append(Spacer(1, 20))

    # Donnees de l'entreprise
    elements.append(Paragraph("Donnees Financieres de l'Entreprise", styles['Heading3']))
    input_data = data.model_dump()
    table_data = [["Variable", "Valeur"]] + [[k.replace("_", " "), str(v)] for k, v in input_data.items()]
    t = Table(table_data, colWidths=[8*cm, 6*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f4f8')]),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    # Top SHAP factors
    elements.append(Paragraph("Facteurs d'Influence (SHAP)", styles['Heading3']))
    shap_sorted = sorted(result["shap_values"].items(), key=lambda x: abs(x[1]), reverse=True)[:8]
    shap_data = [["Variable", "Impact", "Direction"]] + [
        [k.replace("_", " "), f"{abs(v):.4f}", "Augmente risque" if v > 0 else "Diminue risque"]
        for k, v in shap_sorted
    ]
    t2 = Table(shap_data, colWidths=[6*cm, 4*cm, 4*cm])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f4f8')]),
    ]))
    elements.append(t2)

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=rapport_risque_credit.pdf"}
    )


# ==================== MODEL COMPARISON ====================

@app.get("/compare-models")
def compare_models():
    """Compare XGBoost vs RandomForest vs LogisticRegression vs GradientBoosting"""
    df = dataset.copy()

    # Encode categoricals
    le_dict = {}
    for col in ["Secteur", "Taille_Entreprise"]:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        le_dict[col] = le

    X = df[feature_names]
    y = df["Defaut_Paiement"]

    models_to_compare = {
        "XGBoost": model,
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, random_state=42),
    }

    results = []
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for name, mdl in models_to_compare.items():
        if name == "XGBoost":
            # Already trained, use directly
            y_pred = mdl.predict(X)
            y_proba = mdl.predict_proba(X)[:, 1]
            cv_scores = cross_val_score(mdl, X, y, cv=cv, scoring='roc_auc')
        else:
            mdl.fit(X, y)
            y_pred = mdl.predict(X)
            y_proba = mdl.predict_proba(X)[:, 1]
            cv_scores = cross_val_score(mdl, X, y, cv=cv, scoring='roc_auc')

        cm = confusion_matrix(y, y_pred)
        results.append({
            "model": name,
            "accuracy": round(accuracy_score(y, y_pred) * 100, 2),
            "precision": round(precision_score(y, y_pred) * 100, 2),
            "recall": round(recall_score(y, y_pred) * 100, 2),
            "f1_score": round(f1_score(y, y_pred) * 100, 2),
            "auc_roc": round(roc_auc_score(y, y_proba) * 100, 2),
            "cv_auc_mean": round(cv_scores.mean() * 100, 2),
            "cv_auc_std": round(cv_scores.std() * 100, 2),
            "confusion_matrix": {"TP": int(cm[1][1]), "TN": int(cm[0][0]), "FP": int(cm[0][1]), "FN": int(cm[1][0])},
        })

    # Feature importance from XGBoost
    importances = model.feature_importances_
    top_features = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)[:10]
    feature_imp = [{"feature": f, "importance": round(float(v), 4)} for f, v in top_features]

    return {
        "models": results,
        "best_model": max(results, key=lambda x: x["cv_auc_mean"])["model"],
        "feature_importance": feature_imp,
        "dataset_size": len(df),
        "positive_rate": round(y.mean() * 100, 1),
    }
