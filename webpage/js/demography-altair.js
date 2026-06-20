(function () {
  const embedOptions = {
    actions: {
      export: true,
      source: false,
      compiled: false,
      editor: false,
    },
    renderer: "svg",
  };

  const baseSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    background: "transparent",
    config: {
      view: { stroke: null },
      axis: {
        labelColor: "#52635d",
        titleColor: "#1d2522",
        gridColor: "rgba(36, 92, 69, 0.12)",
        domain: false,
        tickColor: "rgba(36, 92, 69, 0.16)",
      },
      legend: {
        labelColor: "#52635d",
        titleColor: "#1d2522",
        orient: "top",
      },
      text: {
        font: "Segoe UI, Arial, sans-serif",
      },
    },
  };

  function renderMissingVega(element) {
    element.innerHTML = `<p class="data-error">A Vega-Embed könyvtár nem tölthető be.</p>`;
  }

  function embedSpec(element, spec) {
    if (!window.vegaEmbed) {
      renderMissingVega(element);
      return;
    }

    window.vegaEmbed(element, spec, embedOptions);
  }

  function renderSourceBars(element, chartData) {
    const values = chartData.labels.map((label, index) => ({
      forras: label,
      kitoltes: chartData.values[index],
      arany: chartData.percentages[index],
      cimke: `${chartData.values[index]} fő · ${chartData.percentLabels[index]}`,
      szin: chartData.colors[index],
    }));

    const maxValue = Math.max(...chartData.values);

    embedSpec(element, {
      ...baseSpec,
      width: "container",
      height: 210,
      data: { values },
      layer: [
        {
          mark: { type: "bar", cornerRadiusEnd: 6 },
          encoding: {
            y: {
              field: "forras",
              type: "nominal",
              sort: chartData.labels,
              title: null,
            },
            x: {
              field: "kitoltes",
              type: "quantitative",
              title: "Kitöltések száma",
              scale: { domain: [0, Math.ceil(maxValue * 1.16)] },
            },
            color: {
              field: "szin",
              type: "nominal",
              scale: null,
              legend: null,
            },
            tooltip: [
              { field: "forras", title: "Forrás" },
              { field: "kitoltes", title: "Kitöltés" },
              { field: "arany", title: "Arány", format: ".1f" },
            ],
          },
        },
        {
          mark: {
            type: "text",
            align: "left",
            baseline: "middle",
            dx: 8,
            color: "#1d2522",
            fontWeight: 700,
          },
          encoding: {
            y: { field: "forras", type: "nominal", sort: chartData.labels },
            x: { field: "kitoltes", type: "quantitative" },
            text: { field: "cimke" },
          },
        },
      ],
    });
  }

  function renderComparisonChart(element, chartData) {
    const values = chartData.categories.flatMap((category, categoryIndex) =>
      chartData.groups.map((group) => ({
        kategoria: category,
        minta: group,
        arany: chartData.percentages[group][categoryIndex],
        valasz: chartData.counts[group][categoryIndex],
        cimke: `${chartData.percentLabels[group][categoryIndex]} (${chartData.counts[group][categoryIndex]})`,
      }))
    );

    embedSpec(element, {
      ...baseSpec,
      width: "container",
      height: Math.max(310, chartData.categories.length * 70),
      data: { values },
      layer: [
        {
          mark: { type: "bar", cornerRadiusEnd: 6 },
          encoding: {
            y: {
              field: "kategoria",
              type: "nominal",
              sort: chartData.categories,
              title: chartData.attributeLabel,
            },
            yOffset: {
              field: "minta",
              sort: chartData.groups,
            },
            x: {
              field: "arany",
              type: "quantitative",
              title: "Arány a mintán belül",
              scale: { domain: [0, 100] },
              axis: { format: ".0f" },
            },
            color: {
              field: "minta",
              type: "nominal",
              title: null,
              scale: {
                domain: chartData.groups,
                range: chartData.groups.map((group) => chartData.colors[group]),
              },
            },
            tooltip: [
              { field: "minta", title: "Minta" },
              { field: "kategoria", title: "Kategória" },
              { field: "arany", title: "Arány", format: ".1f" },
              { field: "valasz", title: "Válasz" },
            ],
          },
        },
        {
          mark: {
            type: "text",
            align: "left",
            baseline: "middle",
            dx: 6,
            color: "#1d2522",
            fontSize: 12,
            fontWeight: 700,
          },
          encoding: {
            y: { field: "kategoria", type: "nominal", sort: chartData.categories },
            yOffset: { field: "minta", sort: chartData.groups },
            x: { field: "arany", type: "quantitative" },
            text: { field: "cimke" },
          },
        },
      ],
      resolve: { scale: { y: "shared" } },
    });
  }

  window.demographyFigures = {
    renderSourceBars,
    renderComparisonChart,
  };
})();
