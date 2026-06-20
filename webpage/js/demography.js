function renderSourceBars(rows) {
  // ÁBRA: "Kitöltések száma az eredeti forrás szerint".
  // Módszer: egyszerű JS kategória-aggregáció a tisztított primer CSV-ből.
  // Renderelés: külön demographyFigures modul, nem Vega-Lite specifikáció.
  const counts = countBy(rows, "country");
  const total = rows.length;
  const countries = ["Hungary", "Romania", "Netherlands"];
  const labels = countries.map((country) => sourceLabels[country]);
  const values = countries.map((country) => counts[country] || 0);
  const percentages = values.map((value) => percent(value, total));

  if (!window.demographyFigures) {
    sourceBars.innerHTML = `<p class="data-error">A demográfiai ábrák kódja nem tölthető be.</p>`;
    return;
  }

  window.demographyFigures.renderSourceBars(sourceBars, {
    labels,
    values,
    percentages,
    percentLabels: percentages.map(formatPercent),
    colors: ["#245c45", "#b66f45", "#2f7f7b"],
  });
}

function renderGroupCounts(rows) {
  const romania = getGroupRows(rows, "Romániai minta").length;
  const netherlands = getGroupRows(rows, "Holland minta").length;

  groupCounts.innerHTML = `
    <span><strong>${romania}</strong> romániai minta</span>
    <span><strong>${netherlands}</strong> holland minta</span>
  `;
}

function renderControls() {
  attributeControls.innerHTML = attributes
    .map(
      (attribute) => `
        <button class="${attribute.key === selectedAttribute ? "active" : ""}" type="button" data-attribute="${attribute.key}">
          ${attribute.label}
        </button>
      `
    )
    .join("");

  attributeControls.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      selectedAttribute = button.dataset.attribute;
      renderDemography();
    });
  });
}

function renderComparisonChart(rows) {
  // ÁBRA: "Demográfiai attribútumok dinamikus összevetése".
  // Módszer: JS-ben számolt mintán belüli kategóriaarányok.
  // Renderelés: külön demographyFigures modul; a statisztikai értelmezést a Cramér V blokk adja.
  const attribute = attributes.find((item) => item.key === selectedAttribute);
  const categories = orderedCategories(attribute, rows);
  const groupTotals = Object.fromEntries(GROUPS.map((group) => [group, getGroupRows(rows, group).length]));
  const groupedCounts = Object.fromEntries(
    GROUPS.map((group) => [group, countBy(getGroupRows(rows, group), attribute.key)])
  );

  if (!window.demographyFigures) {
    comparisonChart.innerHTML = `<p class="data-error">A demográfiai ábrák kódja nem tölthető be.</p>`;
    return;
  }

  const chartData = {
    attributeLabel: attribute.label,
    categories,
    groups: GROUPS,
    colors: GROUP_COLORS,
    counts: {},
    percentages: {},
    percentLabels: {},
  };

  GROUPS.forEach((group) => {
    chartData.counts[group] = categories.map((category) => groupedCounts[group][category] || 0);
    chartData.percentages[group] = chartData.counts[group].map((count) => percent(count, groupTotals[group]));
    chartData.percentLabels[group] = chartData.percentages[group].map(formatPercent);
  });

  window.demographyFigures.renderComparisonChart(comparisonChart, chartData);
}

function share(rows, key, acceptedValues) {
  const accepted = new Set(acceptedValues);
  const count = rows.filter((row) => accepted.has(normalize(row[key]))).length;
  return percent(count, rows.length);
}

function renderProfileCards(rows) {
  const metrics = GROUPS.map((group) => {
    const groupRows = getGroupRows(rows, group);
    return {
      group,
      total: groupRows.length,
      women: share(groupRows, "gender", ["Nő"]),
      young: share(groupRows, "age", ["18 - 24"]),
      urban: share(groupRows, "residence", ["Nagyváros (100 000 lakos fölött)", "Város (20 000 - 100 000 lakos)"]),
      higher: share(groupRows, "education", [
        "Főiskola / Egyetemi diploma (BA/BSc)",
        "Mesterképzés vagy magasabb (MA/MSc/PhD)",
      ]),
      higherIncome: share(groupRows, "household_income_eur", ["1 601–2 400 €", "2 400 € felett"]),
      students: share(groupRows, "occupation", ["Tanuló / Hallgató"]),
    };
  });

  profileCards.innerHTML = metrics
    .map(
      (metric) => `
        <article class="profile-card">
          <span>${metric.group}</span>
          <strong>${metric.total} válaszadó</strong>
          <dl>
            <div><dt>Nők aránya</dt><dd>${formatPercent(metric.women)}</dd></div>
            <div><dt>18-24 évesek</dt><dd>${formatPercent(metric.young)}</dd></div>
            <div><dt>Városi válaszadók</dt><dd>${formatPercent(metric.urban)}</dd></div>
            <div><dt>Felsőfokú végzettség</dt><dd>${formatPercent(metric.higher)}</dd></div>
            <div><dt>Magasabb jövedelem</dt><dd>${formatPercent(metric.higherIncome)}</dd></div>
            <div><dt>Tanuló / hallgató</dt><dd>${formatPercent(metric.students)}</dd></div>
          </dl>
        </article>
      `
    )
    .join("");
}

function logGamma(value) {
  const coefficients = [
    676.5203681218851,
    -1259.1392167224028,
    771.3234287776531,
    -176.6150291621406,
    12.507343278686905,
    -0.13857109526572012,
    9.984369578019572e-6,
    1.5056327351493116e-7,
  ];

  if (value < 0.5) {
    return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * value)) - logGamma(1 - value);
  }

  let x = 0.9999999999998099;
  const adjusted = value - 1;

  coefficients.forEach((coefficient, index) => {
    x += coefficient / (adjusted + index + 1);
  });

  const t = adjusted + coefficients.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (adjusted + 0.5) * Math.log(t) - t + Math.log(x);
}

function regularizedGammaP(a, x) {
  if (x <= 0) return 0;

  let sum = 1 / a;
  let term = sum;

  for (let n = 1; n < 100; n += 1) {
    term *= x / (a + n);
    sum += term;
    if (Math.abs(term) < Math.abs(sum) * 1e-12) break;
  }

  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

function regularizedGammaQ(a, x) {
  if (x <= 0) return 1;

  let b = x + 1 - a;
  let c = 1 / Number.MIN_VALUE;
  let d = 1 / b;
  let h = d;

  for (let i = 1; i < 100; i += 1) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < Number.MIN_VALUE) d = Number.MIN_VALUE;
    c = b + an / c;
    if (Math.abs(c) < Number.MIN_VALUE) c = Number.MIN_VALUE;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-12) break;
  }

  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

function chiSquarePValue(chiSquare, degreesOfFreedom) {
  if (degreesOfFreedom <= 0) return 1;
  const a = degreesOfFreedom / 2;
  const x = chiSquare / 2;
  return x < a + 1 ? 1 - regularizedGammaP(a, x) : regularizedGammaQ(a, x);
}

function analyzeDemographicAttribute(rows, attribute) {
  // ALGORITMUS: khi-négyzet próba + Cramér V.
  // Kapcsolódó rész: demográfiai összehasonlíthatóság és az alatta lévő következtetések.
  // Ez nem Vega-Lite specifikáció, hanem statisztikai háttérszámítás a kategóriás változókhoz.
  const categories = orderedCategories(attribute, rows);
  const observed = GROUPS.map((group) => {
    const groupRows = getGroupRows(rows, group);
    const counts = countBy(groupRows, attribute.key);
    return categories.map((category) => counts[category] || 0);
  });
  const rowTotals = observed.map((row) => row.reduce((sum, value) => sum + value, 0));
  const columnTotals = categories.map((_, columnIndex) =>
    observed.reduce((sum, row) => sum + row[columnIndex], 0)
  );
  const total = rowTotals.reduce((sum, value) => sum + value, 0);

  if (!total || categories.length < 2) {
    return {
      attribute: attribute.label,
      v: 0,
      chiSquare: 0,
      degreesOfFreedom: 0,
      pValue: 1,
      categories,
      observed,
    };
  }

  let chiSquare = 0;
  observed.forEach((row, rowIndex) => {
    row.forEach((value, columnIndex) => {
      const expected = (rowTotals[rowIndex] * columnTotals[columnIndex]) / total;
      if (expected > 0) {
        chiSquare += (value - expected) ** 2 / expected;
      }
    });
  });

  const rowCount = observed.length;
  const columnCount = categories.length;
  const degreesOfFreedom = (rowCount - 1) * (columnCount - 1);
  const cramerDenominator = Math.min(rowCount - 1, columnCount - 1);
  const phiSquared = chiSquare / total;
  const v = cramerDenominator > 0 ? Math.sqrt(phiSquared / cramerDenominator) : 0;
  const pValue = chiSquarePValue(chiSquare, degreesOfFreedom);

  return {
    attribute: attribute.label,
    v,
    chiSquare,
    degreesOfFreedom,
    pValue,
    categories,
    observed,
  };
}

function comparabilityMetrics(rows) {
  const effects = attributes.map((attribute) => analyzeDemographicAttribute(rows, attribute));
  const meanV = effects.reduce((sum, effect) => sum + effect.v, 0) / effects.length;
  const significantEffects = effects.filter((effect) => effect.pValue < 0.05);
  const strongestEffect = [...effects].sort((a, b) => b.v - a.v)[0];

  return {
    meanV,
    significantEffects,
    strongestEffect,
    effects,
  };
}

function cramerEffectLabel(value) {
  if (value < 0.1) return "elhanyagolható";
  if (value < 0.3) return "gyenge";
  if (value < 0.5) return "közepes";
  return "erős";
}

function formatPValue(value) {
  if (value < 0.001) return "< 0.001";
  return value.toFixed(3);
}

function renderCramerBreakdown(metrics) {
  const rows = metrics.effects
    .map(
      (effect) => `
        <tr>
          <td>${effect.attribute}</td>
          <td>${effect.chiSquare.toFixed(2)}</td>
          <td>${effect.degreesOfFreedom}</td>
          <td>${formatPValue(effect.pValue)}</td>
          <td>${effect.pValue < 0.05 ? "igen" : "nem"}</td>
          <td><strong>${effect.v.toFixed(3)}</strong></td>
          <td>${cramerEffectLabel(effect.v)}</td>
        </tr>
      `
    )
    .join("");

  const contingencyTables = metrics.effects
    .map(
      (effect) => `
        <article class="cramer-mini-table">
          <h4>${effect.attribute}</h4>
          <table>
            <thead>
              <tr>
                <th>Kategória</th>
                <th>Romániai minta</th>
                <th>Holland minta</th>
              </tr>
            </thead>
            <tbody>
              ${effect.categories
                .map(
                  (category, index) => `
                    <tr>
                      <td>${category}</td>
                      <td>${effect.observed[0][index]}</td>
                      <td>${effect.observed[1][index]}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </article>
      `
    )
    .join("");

  return `
    <details class="cramer-details">
      <summary>Khi-négyzet próba és Cramér-féle V teljes lebontása</summary>
      <div class="cramer-explanation">
        <p>
          Minden demográfiai változóra külön Khi-négyzet próbát végzünk. A próba azt vizsgálja,
          hogy a romániai és holland minta megoszlása statisztikailag eltér-e az adott változó
          kategóriái mentén.
        </p>
        <p>
          A szignifikancia után a Cramér-féle V mutatja meg a gyakorlati jelentőséget:
          V = sqrt(χ² / (n · min(r-1, c-1))). Ez 0 és 1 közötti hatásméret, ahol a nagyobb
          érték erősebb demográfiai különbséget jelez.
        </p>
        <p>
          Értelmezés: p < 0.05 esetén a különbség statisztikailag szignifikáns. A gyakorlati
          jelentőség a V alapján olvasható: 0.1 alatt elhanyagolható, 0.1-0.3 gyenge,
          0.3-0.5 közepes, 0.5 felett erős hatás.
        </p>
      </div>
      <div class="cramer-table-wrap">
        <table class="cramer-summary-table">
          <thead>
            <tr>
              <th>Attribútum</th>
              <th>χ²</th>
              <th>df</th>
              <th>p-érték</th>
              <th>Szignifikáns</th>
              <th>Cramér V</th>
              <th>Gyakorlati jelentőség</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="cramer-contingencies">${contingencyTables}</div>
    </details>
  `;
}

function renderConclusions(rows) {
  const metrics = comparabilityMetrics(rows);
  const sampleRatio = getGroupRows(rows, "Romániai minta").length / getGroupRows(rows, "Holland minta").length;
  const effectLabel = cramerEffectLabel(metrics.meanV);
  const significantCount = metrics.significantEffects.length;
  const practicalEffects = metrics.effects.filter((effect) => effect.v >= 0.3);
  const verdict =
    significantCount === 0
      ? "A Khi-négyzet próbák alapján nincs statisztikailag kimutatható demográfiai eltérés a két minta között."
      : practicalEffects.length === 0
        ? "Van statisztikailag szignifikáns demográfiai eltérés, de a Cramér-féle V alapján a gyakorlati jelentősége gyenge."
        : "A Khi-négyzet próba és a Cramér-féle V alapján van olyan demográfiai eltérés, amely gyakorlati szempontból is figyelmet igényel.";

  conclusions.innerHTML = `
    <article>
      <span class="conclusion-number">${significantCount}/${metrics.effects.length}</span>
      <h3>Khi-négyzet próba</h3>
      <p>${verdict}</p>
    </article>
    <article>
      <span class="conclusion-number">${metrics.strongestEffect.v.toFixed(2)}</span>
      <h3>Legnagyobb hatásméret</h3>
      <p>A legerősebb gyakorlati különbség a(z) ${metrics.strongestEffect.attribute.toLowerCase()} változónál látszik: ${cramerEffectLabel(metrics.strongestEffect.v)} hatás.</p>
    </article>
    <article>
      <span class="conclusion-number">${metrics.meanV.toFixed(2)}</span>
      <h3>Átlagos gyakorlati hatás</h3>
      <p>A ${metrics.effects.length} demográfiai változó átlagos Cramér V értéke ${effectLabel}. A mintanagyság aránya: ${sampleRatio.toFixed(1)}x.</p>
    </article>
    ${renderCramerBreakdown(metrics)}
  `;
}
