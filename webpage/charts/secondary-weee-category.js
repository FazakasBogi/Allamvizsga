window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.secondaryWeeeCategory = {
  id: "weeeCategoryTrend",
  title: "WEEE begyűjtött mennyiségek országonként és termékkategóriánként",
  type: "Vega-Lite mennyiségi halmozott oszlopdiagram",
  data: "Eurostat WEEE mennyiségi adatok.",
  algorithm: [
    "Ország, év és termékkategória szerint szűri a begyűjtött WEEE mennyiségeket.",
    "Évenként külön romániai és holland oszlopot rajzol.",
    "Az oszlopokon belül a termékkategóriák mennyiségei halmozódnak.",
  ],
  note: "Az ábra abszolút begyűjtött mennyiségeket mutat, ezért az országméret és a gyűjtési rendszer különbségeit is figyelembe kell venni.",
};
