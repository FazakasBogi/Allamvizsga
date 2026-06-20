window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.primaryBubble = {
  id: "primaryBubble",
  title: "Javítási és felelős leadási hajlandóság társadalmi háttér szerint",
  type: "Vega-Lite bubble chart",
  data: "Primer adatok, végzettség-jövedelem csoportokra aggregálva.",
  algorithm: [
    "A javítási hajlandóság a q16 termékkategória szerinti mezőinek átlaga.",
    "A felelős leadási hajlandóság a q30 skálaátlaga.",
    "Egy buborék egy mintán belüli végzettség-jövedelem csoportot jelöl.",
    "A buborékméret a kiválasztott társadalmi háttérpontszámot mutatja.",
  ],
  note: "Itt nem elemszám szerinti rangsor történik, hanem átlagos hajlandóságok összevetése.",
};
