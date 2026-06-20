window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.primaryRadar = {
  id: "primaryRadar",
  title: "Körforgásos fogyasztói profil mintánként",
  type: "SVG radar chart",
  data: "Primer kérdőíves adatok, 1-6-os Likert-indexek.",
  algorithm: [
    "A válaszadók több kérdéséből átlagindexek készülnek.",
    "A radar ugyanazokat az indexneveket használja, mint a heatmap, a hisztogram, a gyertya diagram és a klaszterprofil.",
    "A romániai és holland minta külön átlagprofilt kap.",
    "A termékkategória-szűrő a termékspecifikus mezőket cseréli ki.",
  ],
  note: "A radar nem elemszámot mutat, hanem profilformát: minél kijjebb fut egy vonal, annál magasabb az adott dimenzió átlaga. Az indexek összetétele a primer chartok előtti módszertani táblázatban szerepel.",
};
