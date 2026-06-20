window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.primaryKmeans = {
  id: "primaryClusterProfile",
  title: "KMeans válaszadói szegmensek",
  type: "Vega-Lite line profile chart",
  data: "Primer Likert-indexekből képzett válaszadói vektorok.",
  algorithm: [
    "Minden válaszadó egy többdimenziós pont a skálaindexek alapján.",
    "A KMeans három belsőleg hasonló klasztert keres.",
    "A klaszterek nevei utólagos értelmező címkék, nem előre megadott kategóriák.",
    "Az ábra alatti magyarázat klaszterenként kiemeli a legerősebb és gyengébb dimenziókat.",
  ],
  note: "Ez feltáró modell: profilokat javasol, de nem bizonyít oksági kapcsolatot.",
};
