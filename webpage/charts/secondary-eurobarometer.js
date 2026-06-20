window.chartSpecifications = window.chartSpecifications || {};

window.chartSpecifications.secondaryEurobarometer = {
  id: "eurobarometerAttitudes",
  title: "Eurobarometer SP550 attitűdök",
  type: "Vega-Lite mixed chart set",
  data: "Eurobarometer 101.2 SP550, VOL A weighted, QB1, QB2T, QB6, QB7T és QB8.",
  algorithm: [
    "A tisztított CSV csak EU-27, Románia és Hollandia százalékos eredményeit tartalmazza.",
    "A QB1 beágyazott kördiagram kizárja az összesítő Total Agree és Total Disagree sorokat, és gyűrűfeliratokkal azonosítja az országokat.",
    "A QB6 többválaszos kérdés, ezért a halmozott sávok összege meghaladhatja a 100%-ot; a jelmagyarázat alsó, többoszlopos elrendezésű.",
    "A QB7T vonaldiagramként jelenik meg, hogy az országprofilok kategóriánkénti lefutása összevethető legyen.",
    "A hiányzó vagy kötőjellel jelölt százalékokat a renderelés nem rajzolja nullaként.",
  ],
  note: "Az ábrák célja az országprofilok és az EU-átlag gyors összevetése a primer kutatás értelmezési hátteréhez.",
};
