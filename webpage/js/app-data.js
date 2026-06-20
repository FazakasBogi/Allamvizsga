function renderDemography() {
  renderControls();
  renderComparisonChart(surveyRows);
  renderProfileCards(surveyRows);
  renderConclusions(surveyRows);
}

async function loadSurveyData() {
  try {
    surveyRows = parseCsv(await fetchTextFromCandidates(DATA_PATHS));
    renderSourceBars(surveyRows);
    renderGroupCounts(surveyRows);
    renderDemography();
    renderPrimaryVisualizations(surveyRows);
    setupChartDownloadButtons();
    if (totalResponses) totalResponses.textContent = surveyRows.length;
  } catch (error) {
    console.error("Primer adatbetöltési hiba:", error);
    const message = window.location.protocol === "file:"
      ? "Az adatfájl nem tölthető be fájlból megnyitva. Nyisd meg GitHub Pages-en vagy indíts helyi webszervert."
      : "Az adatfájl nem tölthető be. Ellenőrizd, hogy a data/cleaned mappa és a CSV fájlok is fel vannak-e töltve GitHubra.";
    [sourceBars, groupCounts, comparisonChart, profileCards, conclusions, ...Object.values(primaryCharts)].forEach((element) => {
      if (element) element.innerHTML = `<p class="data-error">${message}</p>`;
    });
  }
}
