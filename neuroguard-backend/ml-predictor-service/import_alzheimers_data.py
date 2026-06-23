"""
Import external Alzheimer's dataset into canonical medical_history_db.csv format.
"""
import os
from datetime import datetime

import pandas as pd


SOURCE_DEFAULT = r"c:\Users\saife\Downloads\Compressed\alzheimers_disease_data.csv"
TARGET_DEFAULT = "data/medical_history_db.csv"
RAW_COPY_DEFAULT = "data/alzheimers_disease_data.csv"


def infer_progression_stage(mmse, diagnosed):
    if int(diagnosed) != 1:
        return "MILD"
    try:
        score = float(mmse)
    except Exception:
        return "MODERATE"

    if score <= 10:
        return "SEVERE"
    if score <= 20:
        return "MODERATE"
    return "MILD"


def infer_caregiver_count(adl, mmse, diagnosed):
    if int(diagnosed) != 1:
        return 0

    adl_val = float(adl) if pd.notna(adl) else 10.0
    mmse_val = float(mmse) if pd.notna(mmse) else 30.0

    if mmse_val < 12 or adl_val < 3:
        return 2
    if mmse_val < 21 or adl_val < 6:
        return 1
    return 0


def build_comorbidities(row):
    items = []
    if int(row.get("CardiovascularDisease", 0)) == 1:
        items.append("Cardiovascular disease")
    if int(row.get("Diabetes", 0)) == 1:
        items.append("Diabetes")
    if int(row.get("Depression", 0)) == 1:
        items.append("Depression")
    if int(row.get("HeadInjury", 0)) == 1:
        items.append("Head injury history")
    if int(row.get("Hypertension", 0)) == 1:
        items.append("Hypertension")
    return ", ".join(items) if items else "None"


def build_environmental_factors(row):
    parts = []
    if int(row.get("Smoking", 0)) == 1:
        parts.append("Smoking")

    alcohol = float(row.get("AlcoholConsumption", 0)) if pd.notna(row.get("AlcoholConsumption")) else 0
    if alcohol >= 12:
        parts.append("High alcohol consumption")

    physical = float(row.get("PhysicalActivity", 0)) if pd.notna(row.get("PhysicalActivity")) else 10
    if physical <= 3:
        parts.append("Low physical activity")

    diet = float(row.get("DietQuality", 0)) if pd.notna(row.get("DietQuality")) else 10
    if diet <= 3:
        parts.append("Low diet quality")

    sleep = float(row.get("SleepQuality", 0)) if pd.notna(row.get("SleepQuality")) else 10
    if sleep <= 3:
        parts.append("Poor sleep quality")

    return ", ".join(parts) if parts else "None"


def to_canonical(raw_df):
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S.000000")

    records = []
    for _, row in raw_df.iterrows():
        diagnosed = int(row.get("Diagnosis", 0))
        mmse = row.get("MMSE")
        adl = row.get("ADL")

        diagnosis_text = "Alzheimer's disease" if diagnosed == 1 else "No Alzheimer's diagnosis"

        rec = {
            "patient_id": int(row["PatientID"]),
            "diagnosis": diagnosis_text,
            "diagnosis_date": "",
            "progression_stage": infer_progression_stage(mmse, diagnosed),
            "genetic_risk": "Family-history-associated risk" if int(row.get("FamilyHistoryAlzheimers", 0)) == 1 else "None",
            "family_history": "Positive Alzheimer's family history" if int(row.get("FamilyHistoryAlzheimers", 0)) == 1 else "None",
            "environmental_factors": build_environmental_factors(row),
            "comorbidities": build_comorbidities(row),
            "medication_allergies": "None",
            "environmental_allergies": "None",
            "food_allergies": "None",
            "surgical_procedures": "",
            "provider_count": 1,
            "caregiver_count": infer_caregiver_count(adl, mmse, diagnosed),
            "created_at": now_str,
            "updated_at": now_str,
        }
        records.append(rec)

    return pd.DataFrame(records)


def import_data(source_csv=SOURCE_DEFAULT, target_csv=TARGET_DEFAULT, raw_copy_path=RAW_COPY_DEFAULT):
    if not os.path.exists(source_csv):
        raise FileNotFoundError(f"Source file not found: {source_csv}")
    if not os.path.exists(target_csv):
        raise FileNotFoundError(f"Target medical history file not found: {target_csv}")

    raw_df = pd.read_csv(source_csv)

    os.makedirs(os.path.dirname(raw_copy_path), exist_ok=True)
    raw_df.to_csv(raw_copy_path, index=False)

    canonical_df = to_canonical(raw_df)

    existing = pd.read_csv(target_csv)
    if "patient_id" in existing.columns:
        existing["patient_id"] = pd.to_numeric(existing["patient_id"], errors="coerce")

    canonical_df = canonical_df[~canonical_df["patient_id"].isin(existing["patient_id"].dropna().astype(int))].copy()

    if len(canonical_df) == 0:
        print("No new patients to import (all already present).")
        return

    next_id = int(pd.to_numeric(existing["id"], errors="coerce").max()) + 1
    canonical_df.insert(0, "id", range(next_id, next_id + len(canonical_df)))

    ordered_columns = [
        "id", "patient_id", "diagnosis", "diagnosis_date", "progression_stage", "genetic_risk", "family_history",
        "environmental_factors", "comorbidities", "medication_allergies", "environmental_allergies", "food_allergies",
        "surgical_procedures", "provider_count", "caregiver_count", "created_at", "updated_at"
    ]

    merged = pd.concat([existing[ordered_columns], canonical_df[ordered_columns]], ignore_index=True)
    merged.to_csv(target_csv, index=False)

    print(f"Imported {len(canonical_df)} new rows from external Alzheimer's dataset.")
    print(f"Total medical history rows: {len(merged)}")
    print(f"Raw source copy saved to: {raw_copy_path}")


if __name__ == "__main__":
    import_data()
