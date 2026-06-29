"""K-Means klaszterezés a harmonizált primer kérdőíves adatokon.

A szkript a weboldallal azonos Likert-indexeket képezi, majd a teljes
indexprofillal rendelkező válaszadókat három klaszterbe sorolja a
Scikit-learn KMeans algoritmusával.
"""

from pathlib import Path

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans


ROOT = Path(__file__).resolve().parent
INPUT_PATH = ROOT / "data" / "cleaned" / "master_dataset_harmonized3.csv"
OUTPUT_PATH = ROOT / "data" / "cleaned" / "master_dataset_clustered.csv"

METRICS = {
    "attitude": [
        "q01_env_concern",
        "q02_nem_harm_decisions",
        "q03_follow_nemrms",
        "q04_sustainable_society",
    ],
    "rentShare": [
        "q14_open_to_rent_share_large_household",
        "q14_open_to_rent_share_personal_it",
        "q14_open_to_rent_share_small",
    ],
    "durability": [
        "q15_importance_durability_large_household",
        "q15_importance_durability_personal_it",
        "q15_importance_durability_small",
    ],
    "repair": [
        "q16_usually_repair_large_household",
        "q16_usually_repair_personal_it",
        "q16_usually_repair_small",
    ],
    "fullRepair": [
        "q22_willing_after_full_repair_large_household",
        "q22_willing_after_full_repair_personal_it",
        "q22_willing_after_full_repair_small",
    ],
    "imperfectRepair": [
        "q23_willing_after_imperfect_repair_large_household",
        "q23_willing_after_imperfect_repair_personal_it",
        "q23_willing_after_imperfect_repair_small",
    ],
    "futureDisposal": ["q30_willing_future_disposal"],
}

CLUSTER_LABELS = [
    "Óvatos lineáris",
    "Átmeneti pragmatikus",
    "Körforgásos nyitott",
]


def numeric_series(series: pd.Series) -> pd.Series:
    """A ponttal és vesszővel írt számokat egységesen numerikussá alakítja."""
    return pd.to_numeric(
        series.astype("string").str.strip().str.replace(",", ".", regex=False),
        errors="coerce",
    )


def build_indices(data: pd.DataFrame) -> pd.DataFrame:
    """A weboldalon használt indexeket a kérdésmezők soronkénti átlagából képzi."""
    indices = pd.DataFrame(index=data.index)

    for metric, fields in METRICS.items():
        numeric_fields = pd.concat(
            [numeric_series(data[field]).rename(field) for field in fields],
            axis=1,
        )
        indices[metric] = numeric_fields.mean(axis=1, skipna=True)

    return indices


def add_clusters(data: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """KMeans-klasztert rendel a teljes indexprofillal rendelkező sorokhoz."""
    indices = build_indices(data)
    complete = indices.dropna()

    if len(complete) < 3:
        raise ValueError("A K-Means futtatásához legalább három teljes adatsor szükséges.")

    # Az eredeti böngészős modell determinisztikus inicializálását őrizzük meg:
    # az első, a középső és az utolsó teljes válaszadói profil a három kezdő
    # klaszterközéppont. A klaszterezést ettől kezdve a Scikit-learn végzi.
    matrix = complete.to_numpy()
    initial_centers = np.vstack(
        [matrix[0], matrix[len(matrix) // 2], matrix[-1]]
    )
    model = KMeans(
        n_clusters=3,
        init=initial_centers,
        n_init=1,
        max_iter=35,
        algorithm="lloyd",
    )
    raw_labels = model.fit_predict(complete)

    centroid_scores = pd.Series(
        model.cluster_centers_.mean(axis=1),
        index=range(model.n_clusters),
    ).sort_values()
    label_map = {
        cluster_id: CLUSTER_LABELS[position]
        for position, cluster_id in enumerate(centroid_scores.index)
    }

    result = data.copy()
    result["cluster"] = "Hiányos adat"
    result.loc[complete.index, "cluster"] = [
        label_map[cluster_id] for cluster_id in raw_labels
    ]

    profile = (
        indices.loc[complete.index]
        .assign(cluster=result.loc[complete.index, "cluster"])
        .groupby("cluster", sort=False)
        .agg(["mean", "count"])
    )
    return result, profile


def main() -> None:
    data = pd.read_csv(INPUT_PATH)
    clustered, profile = add_clusters(data)
    clustered.to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")

    print(f"Klaszterezett adatfájl: {OUTPUT_PATH}")
    print("\nKlaszterlétszámok:")
    print(clustered["cluster"].value_counts())
    print("\nKlaszterprofilok:")
    print(profile)


if __name__ == "__main__":
    main()
