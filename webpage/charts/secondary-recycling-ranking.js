window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.secondaryRecyclingRanking = {
  id: "weeeRecyclingRanking",
  title: "Újrahasznosítási ráta rangsor",
  type: "Vega-Lite ranking bar chart",
  data: "Eurostat WEEE recycling rate adatok.",
  algorithm: [
    "A rangsor az utolsó olyan év alapján készül, ahol Romániának is van adata.",
    "Hiányzó romániai év esetén nem 2023-at erőltet, hanem visszalép az utolsó elérhető évre.",
    "Magyarország nincs külön kiemelve; a fókusz Románia, Hollandia és EU-27.",
  ],
  note: "A rangsor arányalapú összehasonlítás, nem nyers mennyiségi lista.",
};
