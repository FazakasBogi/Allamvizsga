window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.primaryHistogram = {
  id: "primaryHistogram",
  title: "Skálaválaszok eloszlása",
  type: "Vega-Lite histogram",
  data: "Primer kérdőíves skálaértékek.",
  algorithm: [
    "A kiválasztott mutató 1-6-os értékeit gyakorisági sávokba rendezi.",
    "A két minta külön színnel jelenik meg.",
    "Arányokat használ, hogy az eltérő mintaméret ne torzítsa az olvasást.",
  ],
  note: "A hisztogram azt mutatja, hogy az átlag mögött koncentrált vagy szórt válaszok vannak-e.",
};
