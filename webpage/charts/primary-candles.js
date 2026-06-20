window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.primaryCandles = {
  id: "primaryCandles",
  title: "Indexek szórása, mediánja és kvartilisei",
  type: "Vega-Lite candlestick-style chart",
  data: "Primer Likert-indexek.",
  algorithm: [
    "Minden dimenziónál minimum, Q1, medián, Q3 és maximum készül.",
    "A gyertya teste az interkvartilis tartományt mutatja.",
    "A medián külön jelölést kap, hogy ne csak az átlag legyen látható.",
  ],
  note: "Ez az ábra a válaszok belső szórását és bizonytalanságát teszi láthatóvá.",
};
