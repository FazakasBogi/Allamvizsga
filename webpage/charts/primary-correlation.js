window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.primaryCorrelation = {
  id: "primaryCorrelation",
  title: "Mely attitűdök járnak együtt a körforgásos döntésekkel?",
  type: "Vega-Lite correlation matrix",
  data: "Primer kérdőív attitűdállításai és viselkedési indexei.",
  algorithm: [
    "A Pearson r mutató lineáris együttjárást mér két skálaváltozó között.",
    "Az érték -1 és +1 közötti: a pozitív érték együtt növekedést, a negatív ellentétes mozgást jelez.",
    "A legerősebb kapcsolatok az ábra alatti magyarázatban automatikusan kiemelve jelennek meg.",
    "A cellák korrelációt mutatnak, nem oksági bizonyítékot.",
  ],
  note: "A mátrix azt segít látni, mely környezeti attitűdök mozognak együtt a javítással, tartóssággal, bérlés/megosztással vagy felelős leadással.",
};
