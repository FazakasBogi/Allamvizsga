/*
  Main inicializalo fajl.
  A hosszu kod kulon fajlokban van:
  - js/config.js: DOM-hivatkozasok, adatforrasok, kerdes- es kategoriakonfiguraciok.
  - js/data-utils.js: CSV-parsing, normalizalas, kozos szamitasok.
  - js/demography.js: demografiai abrak es Cramer V hatteralgoritmus.
  - js/primary-processing.js: primer indexkepzes es kozos Vega-Lite alapok.
  - js/primary-profile-charts.js: radar, index tabla, heatmap, hisztogram.
  - js/primary-social-algorithm-charts.js: buborek, gyertya, Pearson, KMeans profil.
  - js/primary-choice-charts.js: akadalyok, motivaciok, leadasi utak, javitas utani elfogadas.
  - js/secondary-visualizations.js: WEEE es Eurobarometer Vega-Lite specifikaciok.
  - js/app-data.js: adatbetoltes es a fenti renderelok osszekotese.
  - js/canvas-nav.js: nyito canvas animacio es navigacios aktiv allapot.
*/

if (typeof window.drawCycle === "function") {
  requestAnimationFrame(window.drawCycle);
}

if (typeof window.loadSurveyData === "function") {
  window.loadSurveyData();
}

if (typeof window.loadSecondaryData === "function") {
  window.loadSecondaryData();
}

document.querySelectorAll(".literature-grid details").forEach((details) => {
  details.addEventListener("toggle", () => {
    if (!details.open) return;
    document.querySelectorAll(".literature-grid details").forEach((item) => {
      if (item !== details) item.open = false;
    });
  });
});

if (typeof window.updateActiveNav === "function") {
  window.addEventListener("scroll", window.updateActiveNav, { passive: true });
  window.addEventListener("resize", window.updateActiveNav);
  window.updateActiveNav();
}
