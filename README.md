# CreditRisk AI - Plateforme de Detection de Risque de Credit

## Pre-requis

- **Python 3.10+** : https://www.python.org/downloads/
- **Node.js 18+** : https://nodejs.org/

## Installation

### 1. Backend (Python)

```bash
cd pfa_kiro
pip install -r requirements.txt
```

### 2. Generer le dataset et entrainer le modele

```bash
python data/generate_dataset.py
python models/train_xgboost.py
```

### 3. Frontend (React)

```bash
cd frontend
npm install
```

## Lancement

### Terminal 1 - API Backend

```bash
cd pfa_kiro
uvicorn backend.main:app --reload --port 8001
```

### Terminal 2 - Frontend

```bash
cd pfa_kiro/frontend
npm run dev
```

### Ouvrir dans le navigateur

http://localhost:3000

## Structure du projet

```
pfa_kiro/
├── data/
│   ├── generate_dataset.py
│   └── dataset_credit_entreprises.csv
├── models/
│   ├── train_xgboost.py
│   ├── xgboost_credit_model.joblib
│   ├── label_encoders.joblib
│   └── feature_names.joblib
├── backend/
│   └── main.py
├── frontend/
│   ├── package.json
│   ├── src/
│   └── ...
├── figures/
├── requirements.txt
└── README.md
```
