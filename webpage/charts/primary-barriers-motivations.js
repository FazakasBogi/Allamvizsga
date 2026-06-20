window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.primaryBarriersMotivations = {
  id: "primaryBarrierChoice + primaryMotivationChoice",
  title: "Akadályok és motivációk együtt olvasva",
  type: "Two coordinated Vega-Lite bar charts",
  data: "Primer többválaszos kérdések.",
  algorithm: [
    "A válaszokat pontosvessző mentén bontja külön opciókra.",
    "Minden válasz arányként számolódik mintán belül.",
    "Az akadályok termékkategóriánként is elérhetők.",
    "A 'Minden' szűrő a három termékkategória arányát átlagolja.",
  ],
  note: "A két ábra egymás mellett olvasandó: ugyanaz a tényező lehet akadály és beavatkozási motiváció is.",
};
