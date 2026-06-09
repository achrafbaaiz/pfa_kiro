"""
Phase 3 - API Backend FastAPI
Endpoint POST /predict : probabilite de defaut, niveau de risque, SHAP values
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pandas as pd
import joblib
import shap

# --- Chargement du modele et des artefacts ---
model = joblib.load("models/xgboost_credit_model.joblib")
label_encoders = joblib.load("models/label_encoders.joblib")
feature_names = joblib.load("models/feature_names.joblib")
explainer = shap.TreeExplainer(model)

app = FastAPI(title="API Risque de Credit - Personnes Morales", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Schema d'entree ---
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


def get_risk_level(proba: float) -> dict:
    if proba < 0.3:
        return {"niveau": "Faible", "couleur": "#2ecc71"}
    elif proba < 0.6:
        return {"niveau": "Moyen", "couleur": "#f39c12"}
    else:
        return {"niveau": "Eleve", "couleur": "#e74c3c"}


@app.post("/predict")
def predict(data: EntrepriseInput):
    # Construire le DataFrame
    input_dict = data.model_dump()

    # Encoder les variables categoriques
    for col, le in label_encoders.items():
        if col in input_dict:
            input_dict[col] = le.transform([input_dict[col]])[0]

    df = pd.DataFrame([input_dict])[feature_names]

    # Prediction
    proba = float(model.predict_proba(df)[:, 1][0])
    prediction = int(proba >= 0.5)
    risk = get_risk_level(proba)

    # SHAP values
    shap_values = explainer.shap_values(df)[0]
    shap_dict = {feat: round(float(val), 4) for feat, val in zip(feature_names, shap_values)}

    return {
        "probabilite_defaut": round(proba, 4),
        "prediction": prediction,
        "niveau_risque": risk["niveau"],
        "couleur_risque": risk["couleur"],
        "shap_values": shap_dict,
        "base_value": round(float(explainer.expected_value), 4),
    }


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
