"""Test the /predict endpoint logic without starting the server"""
from fastapi.testclient import TestClient
import sys
sys.path.insert(0, ".")
from backend.main import app

client = TestClient(app)

# Test root
resp = client.get("/")
print(f"GET / : {resp.json()}")

# Test /features
resp = client.get("/features")
print(f"GET /features : {resp.json()}")

# Test /predict
payload = {
    "Secteur": "Industrie",
    "Taille_Entreprise": "PME",
    "Anciennete_Annees": 10,
    "Ratio_Liquidite_Generale": 1.5,
    "Ratio_Liquidite_Reduite": 1.0,
    "Ratio_Endettement": 1.3,
    "Ratio_Capacite_Remboursement": 5.0,
    "Taux_Endettement_Net": 0.8,
    "ROE": 0.05,
    "ROA": -0.02,
    "Marge_Nette": -0.05,
    "Marge_Brute": 0.3,
    "Chiffre_Affaires_Log": 14.0,
    "Croissance_CA": 0.1,
    "Ratio_Fonds_Propres": 0.3,
    "Ratio_Tresorerie_Nette": 0.1,
    "Delai_Paiement_Clients_Jours": 60,
    "Delai_Paiement_Fournisseurs_Jours": 45,
    "Ratio_Couverture_Interets": 3.0,
    "Score_Altman_Z": 1.5,
    "Nb_Incidents_Paiement_12M": 2,
    "Nb_Credits_En_Cours": 3
}

resp = client.post("/predict", json=payload)
result = resp.json()
print(f"\nPOST /predict :")
print(f"  Probabilite defaut : {result['probabilite_defaut']}")
print(f"  Prediction         : {result['prediction']}")
print(f"  Niveau de risque   : {result['niveau_risque']}")
print(f"  Couleur            : {result['couleur_risque']}")
print(f"  Base value (SHAP)  : {result['base_value']}")
print(f"  Top 5 SHAP values  :")
shap_sorted = sorted(result["shap_values"].items(), key=lambda x: abs(x[1]), reverse=True)[:5]
for feat, val in shap_sorted:
    print(f"    {feat}: {val:+.4f}")

print("\n--- Tous les tests passent ---")
