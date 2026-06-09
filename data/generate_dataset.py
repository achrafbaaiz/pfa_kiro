"""
Phase 1 - Génération de données synthétiques
Dataset de détection de risque de crédit bancaire pour personnes morales (entreprises)
"""

import numpy as np
import pandas as pd

np.random.seed(42)

N = 1200  # nombre d'entreprises

# --- Variables d'identification ---
secteurs = ["Industrie", "Commerce", "Services", "BTP", "Agriculture", "Tech", "Transport"]
tailles = ["TPE", "PME", "ETI", "Grande Entreprise"]

# --- Génération des variables financières ---
data = pd.DataFrame({
    # Identification
    "Secteur": np.random.choice(secteurs, N),
    "Taille_Entreprise": np.random.choice(tailles, N, p=[0.3, 0.4, 0.2, 0.1]),
    "Anciennete_Annees": np.random.randint(1, 50, N),
    
    # Ratios de liquidité
    "Ratio_Liquidite_Generale": np.round(np.random.uniform(0.3, 3.5, N), 2),
    "Ratio_Liquidite_Reduite": np.round(np.random.uniform(0.2, 2.5, N), 2),
    
    # Ratios d'endettement
    "Ratio_Endettement": np.round(np.random.uniform(0.1, 2.0, N), 2),
    "Ratio_Capacite_Remboursement": np.round(np.random.uniform(0.5, 15.0, N), 2),
    "Taux_Endettement_Net": np.round(np.random.uniform(0.0, 1.5, N), 2),
    
    # Ratios de rentabilité
    "ROE": np.round(np.random.uniform(-0.3, 0.5, N), 3),
    "ROA": np.round(np.random.uniform(-0.15, 0.3, N), 3),
    "Marge_Nette": np.round(np.random.uniform(-0.2, 0.4, N), 3),
    "Marge_Brute": np.round(np.random.uniform(0.05, 0.8, N), 3),
    
    # Structure financière
    "Chiffre_Affaires_Log": np.round(np.random.uniform(10, 20, N), 2),  # log du CA
    "Croissance_CA": np.round(np.random.uniform(-0.4, 0.6, N), 3),
    "Ratio_Fonds_Propres": np.round(np.random.uniform(0.05, 0.8, N), 2),
    
    # Trésorerie et BFR
    "Ratio_Tresorerie_Nette": np.round(np.random.uniform(-0.5, 1.0, N), 2),
    "Delai_Paiement_Clients_Jours": np.random.randint(15, 120, N),
    "Delai_Paiement_Fournisseurs_Jours": np.random.randint(15, 90, N),
    
    # Couverture et solvabilité
    "Ratio_Couverture_Interets": np.round(np.random.uniform(0.5, 20.0, N), 2),
    "Score_Altman_Z": np.round(np.random.uniform(0.5, 5.0, N), 2),
    
    # Historique bancaire
    "Nb_Incidents_Paiement_12M": np.random.choice([0,0,0,0,0,1,1,2,3,5], N),
    "Nb_Credits_En_Cours": np.random.randint(0, 8, N),
})

# --- Variable cible : Defaut_Paiement (logique réaliste) ---
# Probabilité de défaut basée sur les indicateurs financiers
score_risque = (
    -1.5
    + 1.2 * (data["Ratio_Endettement"] > 1.2).astype(float)
    + 1.0 * (data["Ratio_Liquidite_Generale"] < 0.8).astype(float)
    + 0.8 * (data["ROA"] < 0).astype(float)
    + 0.7 * (data["Marge_Nette"] < 0).astype(float)
    + 0.6 * (data["Score_Altman_Z"] < 1.8).astype(float)
    + 0.5 * (data["Nb_Incidents_Paiement_12M"] >= 2).astype(float)
    + 0.4 * (data["Ratio_Couverture_Interets"] < 2).astype(float)
    + 0.3 * (data["Anciennete_Annees"] < 3).astype(float)
    - 0.3 * (data["Ratio_Fonds_Propres"] > 0.5).astype(float)
    + np.random.normal(0, 0.5, N)  # bruit
)

prob_defaut = 1 / (1 + np.exp(-score_risque))
data["Defaut_Paiement"] = (prob_defaut > 0.5).astype(int)

# --- Statistiques ---
print("=" * 60)
print("PHASE 1 - Dataset Synthétique Risque de Crédit (Personnes Morales)")
print("=" * 60)
print(f"\nNombre d'entreprises : {N}")
print(f"Nombre de variables  : {data.shape[1] - 1} + cible")
print(f"\nDistribution de la cible (Defaut_Paiement) :")
print(data["Defaut_Paiement"].value_counts())
print(f"\nTaux de défaut : {data['Defaut_Paiement'].mean()*100:.1f}%")
print(f"\n--- Aperçu du dataset ---")
print(data.head(10).to_string())
print(f"\n--- Statistiques descriptives ---")
print(data.describe().round(3).to_string())

# --- Sauvegarde ---
output_path = "data/dataset_credit_entreprises.csv"
data.to_csv(output_path, index=False)
print(f"\nDataset sauvegarde avec succes : {output_path}")
