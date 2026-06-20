window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.primaryHeatmap = {
  id: "primaryHeatmap",
  title: "Életciklus-indexek átlaga mintánként",
  type: "Vega-Lite heatmap",
  data: "Primer kérdőíves adatokból képzett Likert-indexek.",
  algorithm: [
    "Pandas-logikának megfelelő aggregálás: minta x dimenzió szerinti átlag.",
    "A színskála az 1-6-os átlagértéket kódolja.",
    "A termékkategória-szűrőnél a három terméktípus mezői külön számolódnak.",
  ],
  note: "A heatmap gyors áttekintésre jó: hol erősebb vagy gyengébb egy dimenzió a két mintában.",
};
