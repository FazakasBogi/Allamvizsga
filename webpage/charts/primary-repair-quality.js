window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.primaryRepairQuality = {
  id: "primaryRepairQuality",
  title: "Hibátlan és apró hibás eszközök elfogadása",
  type: "Vega-Lite grouped vertical bar chart",
  data: "Primer q22 és q23 skálakérdések.",
  algorithm: [
    "A q22 a hibátlan javítás utáni elfogadást méri.",
    "A q23 az apró hibákkal megmaradó eszköz elfogadását méri.",
    "A két skálaátlag mintánként és termékkategóriánként hasonlítható össze.",
    "Az y tengely 0-tól indul, hogy az oszlopmagasságok közvetlenül összevethetők legyenek.",
  ],
  note: "A két oszlopcsoport közötti távolság azt mutatja, mennyire sérül az elfogadás, ha a javítás nem tökéletes.",
};
