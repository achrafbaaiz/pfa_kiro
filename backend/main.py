"""
Backend API - CreditRisk AI
Taiwan Bankruptcy Prediction Dataset
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

# --- Load artifacts ---
model = joblib.load("models/xgboost_credit_model.joblib")
feature_names = joblib.load("models/feature_names.joblib")
# Load base model for SHAP explanations (calibrated model doesn't support TreeExplainer)
try:
    base_model = joblib.load("models/xgboost_base_model.joblib")
except FileNotFoundError:
    base_model = model
explainer = shap.TreeExplainer(base_model)
dataset = pd.read_csv("data/data_1.csv")
dataset.columns = dataset.columns.str.strip()

app = FastAPI(title="API Risque de Credit - Bankruptcy Prediction", version="3.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# --- Schema (dynamic based on feature_names) ---
class PredictionInput(BaseModel):
    features: Dict[str, float]


class SimulateInput(BaseModel):
    base_data: Dict[str, float]
    modifications: Dict[str, float]


def get_risk_level(proba: float) -> dict:
    if proba < 0.15:
        return {"niveau": "Faible", "couleur": "#2ecc71"}
    elif proba < 0.4:
        return {"niveau": "Moyen", "couleur": "#f39c12"}
    return {"niveau": "Eleve", "couleur": "#e74c3c"}


def get_credit_rating(proba: float) -> dict:
    """Map probability to S&P/Moody's-style rating"""
    if proba < 0.03: return {"rating": "AAA", "description": "Prime", "color": "#00d26a"}
    if proba < 0.06: return {"rating": "AA", "description": "High Grade", "color": "#2ecc71"}
    if proba < 0.10: return {"rating": "A", "description": "Upper Medium", "color": "#6bcf7f"}
    if proba < 0.18: return {"rating": "BBB", "description": "Investment Grade", "color": "#a3d977"}
    if proba < 0.30: return {"rating": "BB", "description": "Speculative", "color": "#f1c40f"}
    if proba < 0.45: return {"rating": "B", "description": "Highly Speculative", "color": "#f39c12"}
    if proba < 0.65: return {"rating": "CCC", "description": "Substantial Risk", "color": "#e67e22"}
    if proba < 0.80: return {"rating": "CC", "description": "Extremely Speculative", "color": "#e74c3c"}
    if proba < 0.92: return {"rating": "C", "description": "Default Imminent", "color": "#c0392b"}
    return {"rating": "D", "description": "In Default", "color": "#8b0000"}


def predict_single(input_dict: dict):
    df = pd.DataFrame([input_dict])[feature_names]
    proba = float(model.predict_proba(df)[:, 1][0])
    shap_vals = explainer.shap_values(df)[0]
    shap_dict = {f: round(float(v), 4) for f, v in zip(feature_names, shap_vals)}
    risk = get_risk_level(proba)
    rating = get_credit_rating(proba)
    return {
        "probabilite_defaut": round(proba, 4),
        "raw_probability": round(proba, 4),
        "prediction": int(proba >= 0.5),
        "niveau_risque": risk["niveau"],
        "couleur_risque": risk["couleur"],
        "credit_rating": rating,
        "shap_values": shap_dict,
        "base_value": round(float(explainer.expected_value), 4),
    }


# ==================== ENDPOINTS ====================

@app.get("/")
def root():
    return {"message": "API Risque de Credit - Bankruptcy Prediction", "status": "active"}


@app.get("/features")
def get_features():
    # Return feature names with their stats for the form
    df = dataset[feature_names].replace([np.inf, -np.inf], np.nan)
    bankrupt = dataset[dataset["Bankrupt?"] == 1][feature_names].replace([np.inf, -np.inf], np.nan)
    stats = {}
    for f in feature_names:
        col = df[f].dropna()
        col_min = float(col.min())
        stats[f] = {
            "min": round(col_min, 6),
            "max": round(float(col.max()), 6),
            "mean": round(float(col.mean()), 6),
            "median": round(float(col.median()), 6),
            "non_negative": col_min >= 0,
        }
    # Provide example of a bankrupt company for testing
    bankrupt_example = {}
    if len(bankrupt) > 0:
        sample = bankrupt.iloc[0]
        bankrupt_example = {f: round(float(sample[f]), 6) if pd.notna(sample[f]) else stats[f]["median"] for f in feature_names}
    return {"features": feature_names, "stats": stats, "bankrupt_example": bankrupt_example}


@app.post("/predict")
def predict(data: PredictionInput):
    return predict_single(data.features)


# ==================== STATS / DASHBOARD ====================

@app.get("/stats")
def get_stats():
    df = dataset.copy()
    df.columns = df.columns.str.strip()
    target = "Bankrupt?"
    total = len(df)
    defauts = int(df[target].sum())
    taux_defaut = round(defauts / total * 100, 2)

    # Distribution of key features by class
    key_features = feature_names[:5]
    distributions = {}
    for var in key_features:
        col = df[var].replace([np.inf, -np.inf], np.nan).dropna()
        distributions[var] = {
            "bankrupt": df[df[target] == 1][var].replace([np.inf, -np.inf], np.nan).dropna().describe().round(4).to_dict(),
            "healthy": df[df[target] == 0][var].replace([np.inf, -np.inf], np.nan).dropna().describe().round(4).to_dict(),
        }

    # Top correlations with target
    numeric = df[feature_names + [target]].replace([np.inf, -np.inf], np.nan).dropna()
    correlations = numeric.corr()[target].drop(target).sort_values(key=abs, ascending=False)
    top_corr = [{"variable": k, "correlation": round(v, 4)} for k, v in correlations.head(10).items()]

    # Feature importance from model
    importances = base_model.feature_importances_
    feature_imp = [{"feature": f, "importance": round(float(v), 4)} for f, v in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)]

    return {
        "total_entreprises": total,
        "total_defauts": defauts,
        "taux_defaut_global": taux_defaut,
        "distributions": distributions,
        "top_correlations": top_corr,
        "feature_importance": feature_imp,
    }


# ==================== SIMULATION WHAT-IF ====================

@app.post("/simulate")
def simulate(data: SimulateInput):
    base = data.base_data.copy()
    result_base = predict_single(base)

    modified = base.copy()
    for key, val in data.modifications.items():
        if key in modified:
            modified[key] = val
    result_modified = predict_single(modified)

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
def generate_report(data: PredictionInput):
    result = predict_single(data.features)

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

    elements.append(Paragraph("Rapport d'Analyse de Risque de Credit", title_style))
    elements.append(Paragraph("CreditRisk AI - Bankruptcy Prediction", styles['Normal']))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph(f"<b>Probabilite de defaut :</b> {result['probabilite_defaut']*100:.1f}%", styles['Heading2']))
    elements.append(Paragraph(f"<b>Niveau de risque :</b> {result['niveau_risque']}", styles['Heading2']))
    elements.append(Paragraph(f"<b>Decision :</b> {'Defaut probable' if result['prediction']==1 else 'Entreprise solvable'}", styles['Heading2']))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("Donnees Financieres", styles['Heading3']))
    table_data = [["Variable", "Valeur"]] + [[k, f"{v:.6f}"] for k, v in data.features.items()]
    t = Table(table_data, colWidths=[10*cm, 4*cm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f4f8')]),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("Facteurs d'Influence (SHAP)", styles['Heading3']))
    shap_sorted = sorted(result["shap_values"].items(), key=lambda x: abs(x[1]), reverse=True)[:10]
    shap_data = [["Variable", "Impact", "Direction"]] + [
        [k[:40], f"{abs(v):.4f}", "Augmente risque" if v > 0 else "Diminue risque"]
        for k, v in shap_sorted
    ]
    t2 = Table(shap_data, colWidths=[7*cm, 3.5*cm, 3.5*cm])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f4f8')]),
    ]))
    elements.append(t2)

    doc.build(elements)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=rapport_risque_credit.pdf"})


# ==================== MODEL COMPARISON ====================

@app.get("/compare-models")
def compare_models():
    df = dataset.copy()
    df.columns = df.columns.str.strip()
    X = df[feature_names].replace([np.inf, -np.inf], np.nan).fillna(df[feature_names].median())
    y = df["Bankrupt?"]

    models_to_compare = {
        "XGBoost": base_model,
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=100, random_state=42),
    }

    results = []
    roc_curves = {}
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    from sklearn.metrics import roc_curve

    for name, mdl in models_to_compare.items():
        if name != "XGBoost":
            mdl.fit(X, y)
        y_pred = mdl.predict(X)
        y_proba = mdl.predict_proba(X)[:, 1]
        cv_scores = cross_val_score(mdl, X, y, cv=cv, scoring='roc_auc')
        cm = confusion_matrix(y, y_pred)

        # ROC curve points (sampled to 50 points for frontend)
        fpr, tpr, _ = roc_curve(y, y_proba)
        step = max(1, len(fpr) // 50)
        roc_curves[name] = [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in range(0, len(fpr), step)]

        results.append({
            "model": name,
            "accuracy": round(accuracy_score(y, y_pred) * 100, 2),
            "precision": round(precision_score(y, y_pred, zero_division=0) * 100, 2),
            "recall": round(recall_score(y, y_pred, zero_division=0) * 100, 2),
            "f1_score": round(f1_score(y, y_pred, zero_division=0) * 100, 2),
            "auc_roc": round(roc_auc_score(y, y_proba) * 100, 2),
            "cv_auc_mean": round(cv_scores.mean() * 100, 2),
            "cv_auc_std": round(cv_scores.std() * 100, 2),
            "confusion_matrix": {"TP": int(cm[1][1]), "TN": int(cm[0][0]), "FP": int(cm[0][1]), "FN": int(cm[1][0])},
        })

    importances = base_model.feature_importances_
    feature_imp = [{"feature": f, "importance": round(float(v), 4)} for f, v in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)[:10]]

    return {
        "models": results,
        "best_model": max(results, key=lambda x: x["cv_auc_mean"])["model"],
        "feature_importance": feature_imp,
        "roc_curves": roc_curves,
        "dataset_size": len(df),
        "positive_rate": round(y.mean() * 100, 2),
    }



# ==================== STRESS TEST ====================

class StressTestInput(BaseModel):
    base_data: Dict[str, float]


@app.post("/stress-test")
def stress_test(data: StressTestInput):
    """Run multiple adverse scenarios and compare results"""
    base = data.base_data.copy()
    base_result = predict_single(base)

    # Define stress scenarios with multipliers on relevant features
    scenarios = {
        "Recession": {
            "description": "Contraction economique severe (-30% CA, +50% endettement)",
            "icon": "📉",
            "adjustments": {}
        },
        "Hausse Taux": {
            "description": "Hausse brutale des taux d'interet (+200bps)",
            "icon": "📈",
            "adjustments": {}
        },
        "Chute Revenus": {
            "description": "Perte majeure de chiffre d'affaires (-50%)",
            "icon": "💸",
            "adjustments": {}
        },
        "Crise Liquidite": {
            "description": "Assechement de la tresorerie et delais allonges",
            "icon": "🏦",
            "adjustments": {}
        },
    }

    # Apply scenario-specific shocks based on feature names
    for f in feature_names:
        fl = f.lower()
        # Recession: profitability down, debt up
        if any(k in fl for k in ['roa', 'roe', 'profit', 'margin', 'marge', 'net income']):
            scenarios["Recession"]["adjustments"][f] = base.get(f, 0) * 0.5
            scenarios["Chute Revenus"]["adjustments"][f] = base.get(f, 0) * 0.3
        if any(k in fl for k in ['debt', 'liability', 'borrowing', 'endettement']):
            scenarios["Recession"]["adjustments"][f] = base.get(f, 0) * 1.5
            scenarios["Hausse Taux"]["adjustments"][f] = base.get(f, 0) * 1.4
        # Rate hike: coverage down, debt service cost up
        if any(k in fl for k in ['interest', 'coverage', 'couverture']):
            scenarios["Hausse Taux"]["adjustments"][f] = base.get(f, 0) * 0.4
        # Revenue drop
        if any(k in fl for k in ['revenue', 'sales', 'turnover', 'ca', 'chiffre']):
            scenarios["Chute Revenus"]["adjustments"][f] = base.get(f, 0) * 0.5
            scenarios["Recession"]["adjustments"][f] = base.get(f, 0) * 0.7
        # Liquidity crisis
        if any(k in fl for k in ['liquid', 'cash', 'tresorerie', 'current']):
            scenarios["Crise Liquidite"]["adjustments"][f] = base.get(f, 0) * 0.3
        if any(k in fl for k in ['payable', 'delai', 'payment']):
            scenarios["Crise Liquidite"]["adjustments"][f] = base.get(f, 0) * 1.8

    results = []
    for name, scenario in scenarios.items():
        modified = base.copy()
        modified.update(scenario["adjustments"])
        res = predict_single(modified)
        delta = res["probabilite_defaut"] - base_result["probabilite_defaut"]
        results.append({
            "scenario": name,
            "description": scenario["description"],
            "icon": scenario["icon"],
            "probabilite_defaut": res["probabilite_defaut"],
            "credit_rating": res["credit_rating"],
            "niveau_risque": res["niveau_risque"],
            "couleur_risque": res["couleur_risque"],
            "delta": round(delta, 4),
            "delta_pct": round(delta * 100, 2),
            "survives": res["probabilite_defaut"] < 0.5,
        })

    return {
        "base": base_result,
        "scenarios": sorted(results, key=lambda x: x["probabilite_defaut"], reverse=True),
        "worst_case": max(results, key=lambda x: x["probabilite_defaut"])["scenario"],
        "resilience_score": round((1 - np.mean([r["probabilite_defaut"] for r in results])) * 100, 1),
    }
