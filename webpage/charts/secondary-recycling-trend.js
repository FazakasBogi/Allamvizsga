window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.secondaryRecyclingTrend = {
  id: "weeeRecyclingTrend",
  title: "WEEE újrahasznosítási ráta alakulása",
  type: "Vega-Lite line chart",
  data: "Eurostat WEEE recycling rate adatok.",
  algorithm: [
    "Csak valós, nem üres ráták kerülnek a vonalra.",
    "Románia 2022-2023 hiányzó adata nem nulla, ezért a vonal megszakad.",
    "Az y tengely 50%-ról indul, hogy a különbségek olvashatóbbak legyenek.",
  ],
  note: "A trend a teljesítményarányt mutatja, nem a begyűjtött mennyiséget.",
};
