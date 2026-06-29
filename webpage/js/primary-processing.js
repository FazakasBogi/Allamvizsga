function toNumber(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  const parsed = Number(normalized.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function mean(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  return clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : null;
}

function metricValue(row, metric) {
  // INDEXKÉPZÉS:
  // Kapcsolódó ábrák: pókháló, heatmap, hisztogram, buborékdiagram, gyertya diagram,
  // Pearson-kapcsolati háló, javítás utáni elfogadás és KMeans klaszterprofil.
  // A Python/Pandas előkészítés után itt történik a Likert-kérdések számtani átlagolása.
  // Egy index több kérdés átlagából áll; így egy dimenziót nem egyetlen válasz képvisel.
  return mean(metric.fields.map((field) => toNumber(row[field])));
}

function metricValueForProduct(row, metric, product) {
  // Ha van termékkategória-szűrő, a három termékspecifikus mezőből csak a kiválasztottat használjuk.
  if (product.index === null || metric.fields.length !== 3) {
    return metricValue(row, metric);
  }
  return toNumber(row[metric.fields[product.index]]);
}

function enrichedPrimaryRows(rows) {
  // PRIMER ADATGAZDAGÍTÁS:
  // A tisztított primer CSV soraihoz itt adjuk hozzá a csoportnevet, a képzett indexeket,
  // a körforgásossági összpontszámot és az algoritmusokhoz szükséges numerikus változókat.
  const enriched = rows.map((row, index) => {
    const values = Object.fromEntries(scaleMetrics.map((metric) => [metric.key, metricValue(row, metric)]));
    return {
      ...row,
      respondentId: index + 1,
      group: groupName(row),
      circularity: mean([values.attitude, values.rentShare, values.durability, values.repair, values.fullRepair, values.futureDisposal]),
      usedPurchaseCount: ["q10_bought_used_large_household", "q10_bought_used_personal_it", "q10_bought_used_small"].filter((field) => normalize(row[field]).toLowerCase() === "igen").length,
      knowsDropoff: normalize(row.q27_knews_dropoff).toLowerCase() === "igen" ? 1 : 0,
      educationScore: educationScores[normalize(row.education)] || null,
      incomeScore: incomeScores[normalize(row.household_income_eur)] || null,
      residenceScore: residenceScores[normalize(row.residence)] || null,
      ...values,
    };
  });

  const clustered = assignKMeansClusters(enriched);
  return clustered;
}

function euclideanDistance(a, b) {
  return Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]) ** 2, 0));
}

function assignKMeansClusters(rows) {
  // ALGORITMUS: KMeans klaszterezés.
  // Kapcsolódó ábra: "Válaszadói szegmensek átlagos mintázata".
  // Bemenet: a fenti indexképzésből származó többdimenziós válaszadói profil.
  // Fontos: ez feltáró modell; a klaszterek címkéi utólagos értelmezések.
  // KMeans: hasonló válaszadói profilokat keres a skálaindexek alapján.
  // A klasztercímkék utólagos értelmezések, nem előre megadott csoportok.
  const features = ["attitude", "rentShare", "durability", "repair", "fullRepair", "imperfectRepair", "futureDisposal"];
  const complete = rows
    .map((row, index) => ({ row, index, vector: features.map((field) => row[field]) }))
    .filter((item) => item.vector.every((value) => Number.isFinite(value)));

  if (complete.length < 3) {
    return rows.map((row) => ({ ...row, cluster: "Kevés adat" }));
  }

  const k = 3;
  let centroids = [
    complete[0].vector,
    complete[Math.floor(complete.length / 2)].vector,
    complete[complete.length - 1].vector,
  ].map((vector) => [...vector]);
  let assignments = new Array(complete.length).fill(0);

  for (let iteration = 0; iteration < 35; iteration += 1) {
    assignments = complete.map((item) => {
      const distances = centroids.map((centroid) => euclideanDistance(item.vector, centroid));
      return distances.indexOf(Math.min(...distances));
    });

    centroids = centroids.map((centroid, clusterIndex) => {
      const members = complete.filter((_, index) => assignments[index] === clusterIndex);
      if (!members.length) return centroid;
      return centroid.map((_, featureIndex) => mean(members.map((member) => member.vector[featureIndex])));
    });
  }

  const clusterScores = centroids.map((centroid, index) => ({ index, score: mean(centroid) || 0 })).sort((a, b) => a.score - b.score);
  const labels = ["Óvatos lineáris", "Átmeneti pragmatikus", "Körforgásos nyitott"];
  const labelByCluster = Object.fromEntries(clusterScores.map((cluster, index) => [cluster.index, labels[index]]));
  const clusterByOriginalIndex = Object.fromEntries(complete.map((item, index) => [item.index, labelByCluster[assignments[index]]]));

  return rows.map((row, index) => ({ ...row, cluster: clusterByOriginalIndex[index] || "Hiányos adat" }));
}

function primaryBaseSpec(values, height = 340) {
  // VEGA-LITE KÖZÖS ALAP:
  // Az összes Vega-Lite-tal rajzolt primer és másodlagos ábra ezt az alapbeállítást örökli.
  // Itt csak a közös vizuális konfiguráció van; az ábraspecifikus mark/encoding lentebb készül.
  return {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    background: "transparent",
    width: "container",
    height,
    data: { values },
    config: {
      view: { stroke: null },
      axis: {
        labelColor: "#52635d",
        titleColor: "#1d2522",
        gridColor: "rgba(36, 92, 69, 0.12)",
        domain: false,
        tickColor: "rgba(36, 92, 69, 0.16)",
      },
      legend: { labelColor: "#52635d", titleColor: "#1d2522", orient: "top" },
      range: { category: ["#245c45", "#2f7f7b", "#b66f45", "#d6a84f", "#7c9a4f"] },
    },
  };
}

function embedPrimary(element, spec) {
  // VEGA-EMBED:
  // A Vega-Lite specifikációt SVG-ként rendereli a böngészőben.
  // Export engedélyezett, a forrás/editor gombok rejtettek.
  if (!element) return;
  if (!window.vegaEmbed) {
    element.innerHTML = `<p class="data-error">A Vega-Embed könyvtár nem tölthető be.</p>`;
    return;
  }
  window.vegaEmbed(element, spec, {
    renderer: "svg",
    actions: false,
  });
}

function visibleChartIn(scope) {
  return [...scope.querySelectorAll(".radar-chart, .vega-chart")]
    .find((chart) => !chart.closest("[hidden]") && chart.querySelector("svg"));
}

function sanitizeFileName(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "abra";
}

function chartTitleFor(scope) {
  const chart = visibleChartIn(scope);
  const dynamicTitle = chart?.dataset.exportTitle;
  const panelTitleNode = scope.querySelector("h4")?.cloneNode(true);
  panelTitleNode?.querySelectorAll("button").forEach((item) => item.remove());
  const panelTitle = panelTitleNode?.textContent;
  const articleTitle = scope.closest(".primary-chart, .source-card, .comparison-panel")?.querySelector(".chart-heading h3, h3")?.textContent;
  return normalize(dynamicTitle || panelTitle || articleTitle || "Adatvizualizáció");
}

function chartMethodFor(scope) {
  return normalize(scope.closest(".primary-chart, .source-card, .comparison-panel")?.querySelector(".chart-heading span, .chart-method-label")?.textContent || "");
}

function downloadChartImage(scope) {
  const chart = visibleChartIn(scope);
  const sourceSvg = chart?.querySelector("svg");
  if (!sourceSvg) return;

  const title = chartTitleFor(scope);
  const method = chartMethodFor(scope);
  const cloned = sourceSvg.cloneNode(true);
  const viewBox = cloned.getAttribute("viewBox")?.split(/\s+/).map(Number);
  const rect = sourceSvg.getBoundingClientRect();
  const chartWidth = Math.max(320, Math.round(viewBox?.[2] || rect.width || 900));
  const chartHeight = Math.max(240, Math.round(viewBox?.[3] || rect.height || 520));
  const exportChartWidth = Math.max(1120, chartWidth);
  const scale = exportChartWidth / chartWidth;
  const exportChartHeight = Math.round(chartHeight * scale);
  cloned.setAttribute("width", String(chartWidth));
  cloned.setAttribute("height", String(chartHeight));
  if (!cloned.getAttribute("viewBox")) {
    cloned.setAttribute("viewBox", `0 0 ${chartWidth} ${chartHeight}`);
  }

  const style = `
    .radar-grid-shape{fill:none;stroke:rgba(36,92,69,.16);stroke-width:1}
    .radar-grid-label,.radar-axis-label,.radar-legend-label{fill:#52635d;font-size:13px;font-family:Segoe UI,Arial,sans-serif}
    .radar-axis{stroke:rgba(36,92,69,.2);stroke-width:1}
    .radar-series{fill-opacity:.16;stroke-width:3;stroke-linejoin:round}
    text{font-family:Segoe UI,Arial,sans-serif}
  `;
  const totalWidth = exportChartWidth + 80;
  const totalHeight = exportChartHeight + 136;
  const serializedChart = new XMLSerializer().serializeToString(cloned);
  const exportSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">
      <style>${style}</style>
      <rect width="100%" height="100%" fill="#ffffff"/>
      <text x="40" y="42" fill="#1d2522" font-size="24" font-weight="800">${escapeXml(title)}</text>
      ${method ? `<text x="40" y="68" fill="#52635d" font-size="13" font-weight="700">${escapeXml(method)}</text>` : ""}
      <g transform="translate(40 96) scale(${scale})">
        ${serializedChart}
      </g>
    </svg>
  `;

  const image = new Image();
  const blob = new Blob([exportSvg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  image.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalWidth, totalHeight);
    ctx.drawImage(image, 0, 0);
    URL.revokeObjectURL(url);
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${sanitizeFileName(title)}.png`;
    link.click();
  };
  image.src = url;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function addDownloadButton(scope, target) {
  if (!scope || scope.dataset.downloadReady === "true") return;
  const button = document.createElement("button");
  button.type = "button";
  button.className = "chart-download-button";
  button.textContent = "Ábra letöltése";
  button.addEventListener("click", () => downloadChartImage(scope));

  if (target.classList?.contains("chart-heading")) {
    const method = target.querySelector(":scope > span");
    const actions = document.createElement("div");
    actions.className = "chart-heading-actions";
    if (method) actions.appendChild(method);
    actions.appendChild(button);
    target.appendChild(actions);
    scope.dataset.downloadReady = "true";
    return;
  }

  target.appendChild(button);
  scope.dataset.downloadReady = "true";
}

function setupChartDownloadButtons() {
  document.querySelectorAll(".paired-chart-panel").forEach((panel) => {
    const title = panel.querySelector("h4");
    if (title) addDownloadButton(panel, title);
  });

  document.querySelectorAll(".primary-chart, .secondary-chart-grid .primary-chart, .source-card:not(.emphasis-card), .comparison-panel").forEach((article) => {
    if (article.querySelector(".paired-chart-panel")) return;
    const heading = article.querySelector(".chart-heading, .source-card-top, .comparison-title-block");
    if (heading) addDownloadButton(article, heading);
  });
}

function averageBy(items, key) {
  const groups = {};
  items.forEach((item) => {
    const group = item[key];
    if (!groups[group]) groups[group] = [];
    groups[group].push(item);
  });
  return groups;
}

const radarMetrics = scaleMetrics
  .filter((metric) => ["attitude", "rentShare", "durability", "repair", "fullRepair", "imperfectRepair", "futureDisposal"].includes(metric.key))
  .map((metric) => ({ ...metric, fullLabel: metric.label }));

window.radarMetrics = radarMetrics;

function polarPoint(cx, cy, radius, index, total) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / total;
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  };
}

function radarLabelAnchor(index, total) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / total;
  if (Math.cos(angle) > 0.25) return "start";
  if (Math.cos(angle) < -0.25) return "end";
  return "middle";
}

function radarLabelTspans(label, x, anchor) {
  const words = label.split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > 18 && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });
  if (current) lines.push(current);
  return lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : 15}" text-anchor="${anchor}">${line}</tspan>`)
    .join("");
}
