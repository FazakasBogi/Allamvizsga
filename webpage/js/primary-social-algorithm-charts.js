function renderPrimaryBubble(rows) {
  // ÁBRA: "Javítási és felelős leadási hajlandóság társadalmi háttér szerint".
  // Módszer: JS csoportosítás végzettség, jövedelem, minta és termékkategória szerint.
  // Renderelés: Vega-Lite bubble/scatter specifikáció.
  const groups = {};
  productCategories.forEach((product) => {
    rows.forEach((row) => {
      const education = normalize(row.education);
      const income = normalize(row.household_income_eur);
      const residence = normalize(row.residence);
      const repairMetric = scaleMetrics.find((metric) => metric.key === "repair");
      const repairValue = metricValueForProduct(row, repairMetric, product);
      if (!educationScores[education] || !incomeScores[income] || !residenceScores[residence] || !Number.isFinite(repairValue)) return;
      const key = `${product.label}|||${row.group}|||${education}|||${income}|||${residence}`;
      if (!groups[key]) {
        groups[key] = {
          termek: product.label,
          minta: row.group,
          vegzettseg: education,
          kereset: income,
          lakhely: residence,
          darab: 0,
          javitasok: [],
          leadasok: [],
          vegzettsegek: [],
          keresetek: [],
          lakhelyek: [],
        };
      }
      groups[key].darab += 1;
      groups[key].javitasok.push(repairValue);
      groups[key].leadasok.push(row.futureDisposal);
      groups[key].vegzettsegek.push(row.educationScore);
      groups[key].keresetek.push(row.incomeScore);
      groups[key].lakhelyek.push(row.residenceScore);
    });
  });
  const values = Object.values(groups).flatMap((item) => {
    const base = {
      termek: item.termek,
      minta: item.minta,
      vegzettseg: item.vegzettseg,
      kereset: item.kereset,
      lakhely: item.lakhely,
      darab: item.darab,
      javitas: mean(item.javitasok),
      leadas: mean(item.leadasok),
      vegzettsegiSzint: mean(item.vegzettsegek),
      keresetiSzint: mean(item.keresetek),
      lakhelySzint: mean(item.lakhelyek),
    };
    return [
      { ...base, meretTipus: "Végzettség", meretErtek: base.vegzettsegiSzint },
      { ...base, meretTipus: "Kereset", meretErtek: base.keresetiSzint },
      { ...base, meretTipus: "Lakhely", meretErtek: base.lakhelySzint },
    ];
  }).filter((item) => Number.isFinite(item.javitas) && Number.isFinite(item.leadas) && Number.isFinite(item.meretErtek));

  embedPrimary(primaryCharts.bubble, {
    ...primaryBaseSpec(values, 380),
    params: [
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
      { name: "meretSzuro", value: "Végzettség", bind: { input: "select", options: ["Végzettség", "Kereset", "Lakhely"], name: "Buborékméret: " } },
      { name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" },
    ],
    transform: [
      { filter: "datum.termek == termekSzuro" },
      { filter: "datum.meretTipus == meretSzuro" },
    ],
    mark: { type: "circle", opacity: 0.78, stroke: "#ffffff", strokeWidth: 1.5 },
    encoding: {
      x: { field: "javitas", type: "quantitative", title: "Átlagos javítási hajlandóság", scale: { domain: [1, 6] } },
      y: { field: "leadas", type: "quantitative", title: "Átlagos felelős leadási hajlandóság", scale: { domain: [1, 6] } },
      size: { field: "meretErtek", type: "quantitative", title: "Választott társadalmi háttérszint", scale: { domain: [1, 5], range: [90, 820] } },
      color: { field: "minta", type: "nominal", title: "Ország/minta", scale: { domain: GROUPS, range: GROUPS.map((group) => BUBBLE_GROUP_COLORS[group]) } },
      opacity: { condition: { param: "mintaSzuro", value: 0.84 }, value: 0.16 },
      tooltip: [
        { field: "termek", title: "Termékkategória" },
        { field: "minta", title: "Minta" },
        { field: "vegzettseg", title: "Végzettség" },
        { field: "kereset", title: "Kereset" },
        { field: "lakhely", title: "Lakhely" },
        { field: "javitas", title: "Átlagos javítási hajlandóság", format: ".2f" },
        { field: "leadas", title: "Átlagos felelős leadási hajlandóság", format: ".2f" },
        { field: "meretTipus", title: "Méret típusa" },
        { field: "meretErtek", title: "Méret pontszám", format: ".1f" },
        { field: "darab", title: "Elemszám (háttéradat)" },
      ],
    },
  });

  const countryAverages = GROUPS.map((group) => {
    const groupRows = rows.filter((row) => row.group === group);
    return {
      group,
      repair: mean(groupRows.map((row) => row.repair)),
      disposal: mean(groupRows.map((row) => row.futureDisposal)),
    };
  });
  if (primaryNotes.bubble) {
    primaryNotes.bubble.textContent = "A javítási és felelős leadási hajlandóság különböző társadalmi háttércsoportok között nem mutat egyértelmű mintázatot. A pontok jelentős átfedése arra utal, hogy sem a lakóhely, sem a jövedelmi helyzet, sem más vizsgált háttérváltozó nem áll erős kapcsolatban ezekkel a körforgásos viselkedési formákkal.";
  }
}

function quantile(sortedValues, q) {
  // STATISZTIKAI ÖSSZEGZÉS:
  // Kapcsolódó ábra: "Indexek szórása, mediánja és kvartilisei".
  // A gyertya diagramhoz szükséges minimum, Q1, medián, Q3 és maximum értékeket számolja.
  const values = sortedValues.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!values.length) return null;
  const position = (values.length - 1) * q;
  const base = Math.floor(position);
  const rest = position - base;
  return values[base + 1] !== undefined ? values[base] + rest * (values[base + 1] - values[base]) : values[base];
}

function renderPrimaryCandles(rows) {
  // ÁBRA: "Indexek szórása, mediánja és kvartilisei".
  // Módszer: JS-ben számolt kvantilisek a képzett Likert-indexekből.
  // Renderelés: Vega-Lite rétegzett rule/bar/tick specifikáció.
  const values = productCategories.flatMap((product) =>
    GROUPS.flatMap((group) =>
      scaleMetrics.map((metric) => {
        const scores = rows.filter((row) => row.group === group).map((row) => metricValueForProduct(row, metric, product));
        return {
          termek: product.label,
          minta: group,
          dimenzio: metric.label,
          min: quantile(scores, 0),
          q1: quantile(scores, 0.25),
          median: quantile(scores, 0.5),
          q3: quantile(scores, 0.75),
          max: quantile(scores, 1),
        };
      })
    )
  );

  embedPrimary(primaryCharts.candles, {
    ...primaryBaseSpec(values, 360),
    params: [
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
    ],
    transform: [{ filter: "datum.termek == termekSzuro" }],
    layer: [
      {
        mark: { type: "rule", strokeWidth: 2 },
        encoding: {
          x: { field: "dimenzio", type: "nominal", title: null, sort: scaleMetrics.map((metric) => metric.label), axis: { labelAngle: -28 } },
          y: { field: "min", type: "quantitative", title: "Skálaérték", scale: { domain: [1, 6] } },
          y2: { field: "max" },
          color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
          xOffset: { field: "minta", type: "nominal" },
        },
      },
      {
        mark: { type: "bar", size: 18, cornerRadius: 3 },
        encoding: {
          x: { field: "dimenzio", type: "nominal", sort: scaleMetrics.map((metric) => metric.label) },
          y: { field: "q1", type: "quantitative" },
          y2: { field: "q3" },
          color: { field: "minta", type: "nominal", scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
          xOffset: { field: "minta", type: "nominal" },
          tooltip: [
            { field: "minta", title: "Minta" },
            { field: "dimenzio", title: "Dimenzió" },
            { field: "min", title: "Minimum", format: ".2f" },
            { field: "q1", title: "Q1", format: ".2f" },
            { field: "median", title: "Medián", format: ".2f" },
            { field: "q3", title: "Q3", format: ".2f" },
            { field: "max", title: "Maximum", format: ".2f" },
          ],
        },
      },
      {
        mark: { type: "tick", color: "#1d2522", thickness: 2, size: 24 },
        encoding: {
          x: { field: "dimenzio", type: "nominal", sort: scaleMetrics.map((metric) => metric.label) },
          y: { field: "median", type: "quantitative" },
          xOffset: { field: "minta", type: "nominal" },
        },
      },
    ],
  });

  if (primaryNotes.candles) {
    primaryNotes.candles.textContent = "A legtöbb dimenzióban a válaszok a skála felső részében koncentrálódnak, ami erős körforgásos attitűdökre utal. A legnagyobb megosztottság a bérlési és megosztási modellek elfogadottságában figyelhető meg, míg a környezeti attitűdök és a felelős leadási szándék mindkét országban viszonylag egységesek.";
  }
}

function pearsonCorrelation(aValues, bValues) {
  // ALGORITMUS: Pearson-féle korrelációs együttható.
  // Kapcsolódó ábra: "Mely attitűdök járnak együtt a körforgásos döntésekkel?"
  // Cél: két skálaváltozó lineáris együttjárásának mérése -1 és +1 között.
  // Pearson r: két skálaváltozó lineáris együttjárását méri -1 és +1 között.
  const pairs = aValues.map((value, index) => [value, bValues[index]]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  if (pairs.length < 3) return null;
  const aMean = mean(pairs.map(([a]) => a));
  const bMean = mean(pairs.map(([, b]) => b));
  const numerator = pairs.reduce((sum, [a, b]) => sum + (a - aMean) * (b - bMean), 0);
  const aDenominator = Math.sqrt(pairs.reduce((sum, [a]) => sum + (a - aMean) ** 2, 0));
  const bDenominator = Math.sqrt(pairs.reduce((sum, [, b]) => sum + (b - bMean) ** 2, 0));
  return aDenominator && bDenominator ? numerator / (aDenominator * bDenominator) : null;
}

function renderPrimaryCorrelation(rows) {
  // ÁBRA: "Mely attitűdök járnak együtt a körforgásos döntésekkel?"
  // Módszer: Pearson r számítás attitűdállítások és viselkedési indexek között.
  // Renderelés: Vega-Lite korrelációs heatmap, szöveges r-értékekkel rétegezve.
  const values = productCategories.flatMap((product) =>
    attitudeItems.flatMap((attitude) =>
      behaviorMetrics.map((behavior) => ({
        termek: product.label,
        x: behavior.label,
        y: attitude.label,
        r: pearsonCorrelation(
          rows.map((row) => toNumber(row[attitude.key])),
          rows.map((row) => metricValueForProduct(row, behavior, product))
        ),
      }))
    )
  );

  embedPrimary(primaryCharts.correlation, {
    ...primaryBaseSpec(values, 360),
    params: [
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
    ],
    transform: [{ filter: "datum.termek == termekSzuro" }],
    layer: [
      {
        mark: { type: "rect", cornerRadius: 3 },
        encoding: {
          x: { field: "x", type: "nominal", title: "Viselkedési dimenzió", sort: behaviorMetrics.map((metric) => metric.label), axis: { labelAngle: -28 } },
          y: { field: "y", type: "nominal", title: "Környezeti attitűd", sort: attitudeItems.map((item) => item.label) },
          color: {
            field: "r",
            type: "quantitative",
            title: "Pearson r",
            scale: { scheme: "redblue", domain: [-1, 1] },
            legend: { orient: "right", gradientLength: 280, gradientThickness: 14 },
          },
          tooltip: [
            { field: "x", title: "Mutató 1" },
            { field: "y", title: "Mutató 2" },
            { field: "r", title: "Pearson r", format: ".3f" },
          ],
        },
      },
      {
        mark: { type: "text", fontSize: 11, fontWeight: 700 },
        encoding: {
          x: { field: "x", type: "nominal", sort: behaviorMetrics.map((metric) => metric.label) },
          y: { field: "y", type: "nominal", sort: attitudeItems.map((item) => item.label) },
          text: { field: "r", type: "quantitative", format: ".2f" },
          color: {
            condition: { test: "abs(datum.r) > 0.55", value: "#ffffff" },
            value: "#1d2522",
          },
        },
      },
    ],
    resolve: { scale: { color: "shared" } },
  });

  const strongest = [...values]
    .filter((item) => Number.isFinite(item.r) && item.termek === "Minden")
    .sort((a, b) => Math.abs(b.r) - Math.abs(a.r))
    .slice(0, 3);
  if (primaryNotes.correlation && strongest.length) {
    const strongestText = strongest
      .map((item) => `${item.y} + ${item.x} (r=${item.r.toFixed(2)})`)
      .join("; ");
    primaryNotes.correlation.innerHTML = `
      <p>Az ábra azt mutatja, hogy a környezeti attitűdállítások mely körforgásos döntési dimenziókkal járnak együtt. A legerősebb kapcsolatok a teljes mintán, a "Minden" termékkategória nézetben: ${strongestText}.</p>
      <p><strong>Értelmezés.</strong> A pozitív r azt jelzi, hogy a magasabb attitűdpontszámhoz általában magasabb viselkedési hajlandóság társul. Ezek együttjárások, nem oksági bizonyítékok: azt mutatják, hol mozognak együtt a válaszok, nem azt, hogy az egyik változó okozza a másikat.</p>
    `;
  }
}

function renderPrimaryClusterProfile(rows) {
  // ÁBRA: "Válaszadói szegmensek átlagos mintázata".
  // Módszer: a korábban futtatott KMeans-klaszterek átlagprofiljainak összesítése.
  // Renderelés: Vega-Lite vonaldiagram, ahol minden vonal egy feltáró klasztert jelöl.
  const clusters = averageBy(rows.filter((row) => row.cluster !== "Hiányos adat"), "cluster");
  const values = Object.entries(clusters).flatMap(([cluster, clusterRows]) =>
    scaleMetrics.map((metric) => ({
      klaszter: cluster,
      dimenzio: metric.label,
      atlag: mean(clusterRows.map((row) => row[metric.key])),
      elemszam: clusterRows.length,
    }))
  );

  embedPrimary(primaryCharts.clusterProfile, {
    ...primaryBaseSpec(values, 360),
    mark: { type: "line", point: { filled: true, size: 70 }, strokeWidth: 3 },
    encoding: {
      x: { field: "dimenzio", type: "nominal", title: null, sort: scaleMetrics.map((metric) => metric.label), axis: { labelAngle: -28 } },
      y: { field: "atlag", type: "quantitative", title: "Klaszterátlag", scale: { domain: [1, 6] } },
      color: { field: "klaszter", type: "nominal", title: "KMeans klaszter" },
      tooltip: [
        { field: "klaszter", title: "Klaszter" },
        { field: "dimenzio", title: "Dimenzió" },
        { field: "atlag", title: "Átlag", format: ".2f" },
        { field: "elemszam", title: "Elemszám" },
      ],
    },
  });

  if (primaryNotes.clusterProfile) {
    primaryNotes.clusterProfile.innerHTML = `
      <p>A válaszadók csoportosítása K-means klaszterezéssel történt, amely egy gépi tanulási módszer az egymáshoz hasonló válaszminták azonosítására. Az elemzés három elkülönülő fogyasztói szegmenst rajzolt ki: egy körforgásos megoldásokra nyitott, egy átmeneti-pragmatikus és egy óvatosabb, inkább lineáris szemléletű csoportot.</p>
      <p>A <strong>„Körforgásos nyitott”</strong> klaszter magas értékeket mutat a legtöbb körforgásos viselkedési mutató esetében, míg az <strong>„Óvatos lineáris”</strong> csoport jellemzően visszafogottabb ezekben a dimenziókban. Az <strong>„Átmeneti pragmatikus”</strong> klaszter a két véglet között helyezkedik el, ami arra utal, hogy a fogyasztói magatartás inkább egy folytonos skálán, mintsem élesen elkülönülő kategóriákban értelmezhető.</p>
      <p>A klaszterek kialakulása azt jelzi, hogy a körforgásos viselkedés mögött nem egyetlen tényező áll. A pozitív környezeti attitűd fontos alapot jelent, azonban a gyakorlati döntéseket valószínűleg a gazdasági, kényelmi és infrastrukturális feltételek is jelentősen befolyásolják.</p>
    `;
  }
}
