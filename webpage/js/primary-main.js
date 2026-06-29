function renderPrimaryVisualizations(rows) {
  // PRIMER VIZUALIZÁCIÓS PIPELINE:
  // 1. tisztított CSV sorok gazdagítása és indexképzés,
  // 2. a Scikit-learnnel előállított KMeans-klasztercímkék betöltése,
  // 3. minden primer ábra renderelése a fenti aggregációkból.
  const primaryRows = enrichedPrimaryRows(rows);
  renderMetricGroupingTable();
  renderPrimaryOverviewCharts(primaryRows);
  setupPrimaryProfileToggle(primaryRows);
  if (primaryRadarProduct) {
    primaryRadarProduct.onchange = () => renderPrimaryRadar(primaryRows);
  }
  renderPrimaryRadar(primaryRows);
  renderPrimaryHeatmap(primaryRows);
  renderPrimaryCandles(primaryRows);
  renderPrimaryCorrelation(primaryRows);
  renderPrimaryHistogram(primaryRows);
  renderPrimaryBubble(primaryRows);
  renderPrimaryUsedPurchase(primaryRows);
  renderPrimaryAlternativeConsumption(primaryRows);
  renderPrimaryRepairWillingness(primaryRows);
  renderPrimaryBarrierMotivation(primaryRows);
  renderPrimaryDropoffKnowledge(primaryRows);
  renderPrimaryDisposalPath(primaryRows);
  renderPrimaryFutureDisposal(primaryRows);
  renderPrimaryRepairQuality(primaryRows);
  renderPrimarySelfRepair(primaryRows);
  renderPrimaryClusterProfile(primaryRows);
  setupChartDownloadButtons();
}

function setupPrimaryProfileToggle(primaryRows) {
  if (!primaryProfileViewToggle) return;
  const productToolbar = document.querySelector(".profile-switch-chart .radar-toolbar");
  const panels = {
    radar: document.querySelector("#primaryRadarPanel"),
    heatmap: document.querySelector("#primaryHeatmapPanel"),
  };

  primaryProfileViewToggle.querySelectorAll("button").forEach((button) => {
    button.onclick = () => {
      const selected = button.dataset.view;
      primaryProfileViewToggle.querySelectorAll("button").forEach((item) => {
        const active = item.dataset.view === selected;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      Object.entries(panels).forEach(([key, panel]) => {
        if (!panel) return;
        const active = key === selected;
        panel.hidden = !active;
        panel.classList.toggle("active", active);
      });
      if (productToolbar) {
        productToolbar.hidden = false;
      }
      if (primaryRadarProduct) {
        primaryRadarProduct.disabled = selected === "heatmap";
        if (selected === "heatmap") {
          primaryRadarProduct.value = "Minden";
        }
      }
      if (selected === "heatmap") {
        renderPrimaryHeatmap(primaryRows);
      } else {
        renderPrimaryRadar(primaryRows);
      }
    };
  });
}
