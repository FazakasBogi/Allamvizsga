window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.primaryDisposalPath = {
  id: "primaryDisposalPath",
  title: "Leadási utak",
  type: "Vega-Lite bar chart",
  data: "Primer többválaszos életciklus-végi kérdések.",
  algorithm: [
    "Termékkategóriánként külön kérdésből számolja a leadási utakat.",
    "A válaszok mintán belüli aránya jelenik meg.",
    "A 'Minden' nézet kategóriaátlagot használ.",
  ],
  note: "A diagram azt mutatja, hogy a felelős leadási szándék ténylegesen milyen útvonalakon jelenhet meg.",
};
