function renderPrimaryRadar(rows) {
  // ÁBRA: "Körforgásos fogyasztói profil mintánként".
  // Módszer: JS indexátlagok mintánként és termékkategóriánként.
  // Renderelés: saját SVG/polárkoordináta-számítás, nem Vega-Lite.
  if (!primaryCharts.radar) return;

  if (primaryRadarProduct && !primaryRadarProduct.options.length) {
    primaryRadarProduct.innerHTML = productCategories
      .map((product) => `<option value="${product.label}">${product.label}</option>`)
      .join("");
  }

  const selectedProductLabel = primaryRadarProduct?.value || "Minden";
  const selectedProduct = productCategories.find((product) => product.label === selectedProductLabel) || productCategories[0];
  const cx = 360;
  const cy = 280;
  const maxRadius = 190;
  const axisCount = radarMetrics.length;
  const gridLevels = [1, 2, 3, 4, 5, 6];
  const values = GROUPS.map((group) => {
    const groupRows = rows.filter((row) => row.group === group);
    return {
      group,
      metrics: radarMetrics.map((metric) => ({
        label: metric.label,
        fullLabel: metric.fullLabel,
        value: mean(groupRows.map((row) => metricValueForProduct(row, metric, selectedProduct))),
      })),
    };
  });

  const grid = gridLevels
    .map((level) => {
      const radius = (level / 6) * maxRadius;
      const points = radarMetrics.map((_, index) => polarPoint(cx, cy, radius, index, axisCount));
      return `<polygon points="${points.map((point) => `${point.x},${point.y}`).join(" ")}" class="radar-grid-shape"></polygon>
        <text x="${cx + 6}" y="${cy - radius + 4}" class="radar-grid-label">${level}</text>`;
    })
    .join("");

  const axes = radarMetrics
    .map((metric, index) => {
      const axisEnd = polarPoint(cx, cy, maxRadius, index, axisCount);
      const labelPoint = polarPoint(cx, cy, maxRadius + 46, index, axisCount);
      const anchor = radarLabelAnchor(index, axisCount);
      return `<line x1="${cx}" y1="${cy}" x2="${axisEnd.x}" y2="${axisEnd.y}" class="radar-axis"></line>
        <text x="${labelPoint.x}" y="${labelPoint.y}" text-anchor="${anchor}" class="radar-axis-label">${radarLabelTspans(metric.label, labelPoint.x, anchor)}</text>`;
    })
    .join("");

  const shapes = values
    .map((series) => {
      const points = series.metrics.map((metric, index) => {
        const radius = ((metric.value || 0) / 6) * maxRadius;
        return polarPoint(cx, cy, radius, index, axisCount);
      });
      const color = GROUP_COLORS[series.group];
      const pointMarks = points
        .map((point, index) => {
          const metric = series.metrics[index];
          return `<circle cx="${point.x}" cy="${point.y}" r="4.5" fill="${color}">
            <title>${series.group} - ${metric.fullLabel || metric.label}: ${metric.value?.toFixed(2) || "nincs adat"}</title>
          </circle>`;
        })
        .join("");
      return `<polygon points="${points.map((point) => `${point.x},${point.y}`).join(" ")}" fill="${color}" stroke="${color}" class="radar-series"></polygon>${pointMarks}`;
    })
    .join("");

  const legend = values
    .map((series, index) => {
      const x = 520;
      const y = 38 + index * 26;
      return `<g class="radar-legend-item">
        <rect x="${x}" y="${y - 12}" width="14" height="14" rx="3" fill="${GROUP_COLORS[series.group]}"></rect>
        <text x="${x + 22}" y="${y}" class="radar-legend-label">${series.group}</text>
      </g>`;
    })
    .join("");

  primaryCharts.radar.innerHTML = `<svg viewBox="0 0 720 560" role="img" aria-label="Körforgásos fogyasztói profil mintánként">
    ${grid}
    ${axes}
    ${shapes}
    ${legend}
  </svg>`;

  if (primaryNotes.radar) {
    primaryNotes.radar.textContent = "A két ország fogyasztói profilja összességében hasonló, azonban a romániai válaszadók a legtöbb dimenzióban valamivel magasabb értékeket mutatnak. A legnagyobb eltérés a megosztási modellek iránti nyitottságban figyelhető meg, míg több területen csak minimális különbség látható. A kisebb eltérések részben a kérdőíves válaszadási szokások országspecifikus különbségeiből is adódhatnak.";
  }
}

function renderMetricGroupingTable() {
  // MÓDSZERTANI TÁBLA: "Indexképzés".
  // Cél: dokumentálja, hogy mely kérdőívmezőkből készülnek a primer ábrák közös indexei.
  // Ez magyarázó HTML, nem statisztikai modell és nem Vega-Lite specifikáció.
  if (!metricGroupingTable) return;

  const rows = scaleMetrics
    .map(
      (metric) => `
        <tr>
          <td><strong>${metric.label}</strong></td>
          <td>
            <ul class="metric-question-list">
              ${metric.fields
                .map(
                  (field) => `
                    <li>
                      <span>${metricQuestionTexts[field] || "Kérdésszöveg pontosítása szükséges."}</span>
                      <code>${field}</code>
                    </li>
                  `
                )
                .join("")}
            </ul>
          </td>
          <td>${metric.fields.length === 1 ? "Egy kérdés skálaértéke." : "A felsorolt skálakérdések számtani átlaga."}</td>
        </tr>
      `
    )
    .join("");

  metricGroupingTable.innerHTML = `
    <div class="metric-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Dimenzió / index neve</th>
            <th>Hozzátartozó kérdések</th>
            <th>Számítás módja</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderPrimaryHeatmap(rows) {
  // ÁBRA: "Életciklus-indexek átlaga mintánként".
  // Módszer: JS-ben számolt csoportátlagok a képzett Likert-indexekből.
  // Renderelés: Vega-Lite rect/heatmap specifikáció.
  const product = productCategories[0];
  const values = GROUPS.flatMap((group) =>
    scaleMetrics.map((metric) => {
      const groupRows = rows.filter((row) => row.group === group);
      const scores = groupRows.map((row) => metricValueForProduct(row, metric, product)).filter((value) => Number.isFinite(value));
      return {
        termek: product.label,
        minta: group,
        dimenzio: metric.label,
        atlag: mean(scores),
        elemszam: scores.length,
      };
    })
  );

  embedPrimary(primaryCharts.heatmap, {
    ...primaryBaseSpec(values, 330),
    params: [
      { name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" },
    ],
    mark: { type: "rect", cornerRadius: 4 },
    encoding: {
      x: { field: "dimenzio", type: "nominal", title: null, sort: scaleMetrics.map((metric) => metric.label), axis: { labelAngle: -28 } },
      y: { field: "minta", type: "nominal", title: null, sort: GROUPS },
      color: { field: "atlag", type: "quantitative", title: "Átlag", scale: { scheme: "yellowgreenblue", domain: [1, 6] } },
      opacity: { condition: { param: "mintaSzuro", value: 1 }, value: 0.25 },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "dimenzio", title: "Dimenzió" },
        { field: "atlag", title: "Átlag", format: ".2f" },
        { field: "elemszam", title: "Elemszám" },
      ],
    },
  });

  const strongest = [...values].filter((item) => Number.isFinite(item.atlag)).sort((a, b) => b.atlag - a.atlag)[0];
  if (primaryNotes.heatmap && strongest) {
    primaryNotes.heatmap.textContent = "Az attitűdök és a körforgásos viselkedések között többnyire gyenge vagy mérsékelt kapcsolat figyelhető meg. A legerősebb összefüggés a jövőbeni felelős leadási hajlandóság és a környezeti értékek között jelenik meg, ami arra utal, hogy a pozitív attitűdök elsősorban a hosszabb távú szándékokat befolyásolják. A tényleges fogyasztói döntéseket ugyanakkor más tényezők is jelentősen alakíthatják.";
  }
}

function renderPrimaryHistogram(rows) {
  // ÁBRA: "Skálaválaszok eloszlása".
  // Módszer: JS-ben képzett 0,5-ös Likert-sávok és mintán belüli százalékos arányok.
  // Renderelés: Vega-Lite grouped bar/hisztogram jellegű specifikáció.
  const rawValues = rows.flatMap((row) =>
    productCategories.flatMap((product) =>
      scaleMetrics.map((metric) => ({
        termek: product.label,
        minta: row.group,
        metrika: metric.label,
        ertek: metricValueForProduct(row, metric, product),
      }))
    )
  ).filter((item) => Number.isFinite(item.ertek));
  const histogramCounts = {};
  rawValues.forEach((item) => {
    const sav = Math.floor(item.ertek * 2) / 2;
    const key = `${item.termek}|||${item.metrika}|||${item.minta}|||${sav}`;
    histogramCounts[key] = (histogramCounts[key] || 0) + 1;
  });
  const histogramTotals = {};
  rawValues.forEach((item) => {
    const key = `${item.termek}|||${item.metrika}|||${item.minta}`;
    histogramTotals[key] = (histogramTotals[key] || 0) + 1;
  });
  const values = Object.entries(histogramCounts).map(([key, count]) => {
    const [termek, metrika, minta, savText] = key.split("|||");
    const sav = Number(savText);
    return {
      termek,
      metrika,
      minta,
      sav,
      darab: count,
      arany: percent(count, histogramTotals[`${termek}|||${metrika}|||${minta}`]),
    };
  });
  const attitudeLabel = scaleMetrics.find((metric) => metric.key === "attitude")?.label || scaleMetrics[0].label;

  embedPrimary(primaryCharts.histogram, {
    ...primaryBaseSpec(values, 340),
    params: [
      { name: "valasztottMetrika", value: scaleMetrics[0].label, bind: { input: "select", options: scaleMetrics.map((metric) => metric.label), name: "Mutató: " } },
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
    ],
    transform: [
      { filter: "datum.termek == termekSzuro" },
    ],
    layer: [
      {
        transform: [{ filter: "datum.metrika == valasztottMetrika" }],
        mark: { type: "bar", opacity: 0.72 },
        encoding: {
          x: { field: "sav", type: "ordinal", title: "Skálaérték-sáv" },
          y: { field: "arany", type: "quantitative", title: "Arány a mintán belül (%)" },
          color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
          xOffset: { field: "minta", type: "nominal" },
          tooltip: [
            { field: "minta", title: "Minta" },
            { field: "metrika", title: "Mutató" },
            { field: "sav", title: "Értéksáv" },
            { field: "arany", title: "Arány", format: ".1f" },
            { field: "darab", title: "Elemszám (háttéradat)" },
          ],
        },
      },
      {
        transform: [{ filter: `datum.metrika == "${attitudeLabel}"` }],
        mark: { type: "line", point: { filled: true, size: 55 }, strokeWidth: 3, strokeDash: [7, 4] },
        encoding: {
          x: { field: "sav", type: "ordinal" },
          y: { field: "arany", type: "quantitative" },
          color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
          tooltip: [
            { field: "minta", title: "Minta" },
            { field: "metrika", title: "Referenciavonal" },
            { field: "sav", title: "Értéksáv" },
            { field: "arany", title: "Attitűd arány", format: ".1f" },
          ],
        },
      },
    ],
  });

  if (primaryNotes.histogram) {
    primaryNotes.histogram.textContent = "Az interaktív szűrők segítségével összehasonlíthatók az egyes országok és termékkategóriák válaszmintázatai. Az ábra nemcsak az átlagokat mutatja meg, hanem azt is, hogy a válaszadók mennyire egységesen vagy megosztottan viszonyulnak az adott körforgásos viselkedéshez. A szaggatott vonalak a környezeti attitűdök eloszlását jelenítik meg referenciaként, így látható, hogy az egyes viselkedési dimenziók mennyiben követik vagy térnek el az általános értékrendtől.";
  }
}
