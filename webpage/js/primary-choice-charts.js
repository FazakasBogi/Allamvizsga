function splitChoices(value) {
  // A többválaszos mezők pontosvesszővel elválasztott válaszokat tartalmaznak.
  return normalize(value)
    .split(";")
    .map((choice) => normalize(choice))
    .filter(Boolean);
}

function renderPrimaryMultiChoice(rows) {
  // ÁBRA: korábbi többválaszos primer nézet.
  // Módszer: többválaszos mezők splitelése, elemszámolás és mintán belüli arányképzés.
  // Renderelés: Vega-Lite oszlopdiagram. A jelenlegi oldal fő többválaszos nézete lentebb külön blokkokban fut.
  const values = multiChoiceQuestions.flatMap((question) => {
    const groupTotals = Object.fromEntries(GROUPS.map((group) => [group, rows.filter((row) => row.group === group && normalize(row[question.key])).length]));
    const counts = {};
    rows.forEach((row) => {
      splitChoices(row[question.key]).forEach((choice) => {
        const key = `${question.label}|||${row.group}|||${choice}`;
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    const applicableProducts =
      question.product === "Minden"
        ? productCategories.map((product) => product.label)
        : ["Minden", question.product];
    return Object.entries(counts).flatMap(([key, count]) => {
      const [kerdes, minta, valasz] = key.split("|||");
      return applicableProducts.map((termek) => ({
        termek,
        kerdes,
        minta,
        valasz,
        darab: count,
        arany: percent(count, groupTotals[minta]),
      }));
    });
  });

  embedPrimary(primaryCharts.multiChoice, {
    ...primaryBaseSpec(values, 360),
    params: [
      { name: "kerdesSzuro", value: multiChoiceQuestions[0].label, bind: { input: "select", options: multiChoiceQuestions.map((question) => question.label), name: "Kérdés: " } },
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
      { name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" },
    ],
    transform: [
      { filter: "datum.kerdes == kerdesSzuro" },
      { filter: "datum.termek == termekSzuro" },
      { window: [{ op: "rank", as: "rank" }], sort: [{ field: "arany", order: "descending" }], groupby: ["minta"] },
      { filter: "datum.rank <= 8" },
    ],
    mark: { type: "bar", cornerRadiusEnd: 5 },
    encoding: {
      y: { field: "valasz", type: "nominal", title: null, sort: "-x" },
      x: { field: "arany", type: "quantitative", title: "Arány a válaszadók között", axis: { format: ".0f" } },
      color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
      opacity: { condition: { param: "mintaSzuro", value: 0.86 }, value: 0.18 },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "valasz", title: "Válasz" },
        { field: "darab", title: "Elemszám (háttéradat)" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  });

  if (primaryNotes.multiChoice) {
    primaryNotes.multiChoice.textContent = "A többválaszos diagramnál a kérdés és a termékkategória is szűrhető. A sávok az adott válasz előfordulási arányát mutatják mintánként, nem nyers elemszámot. Következtetésem: a legnagyobb arányú akadályok és motivációk mutatják meg, hol lenne a legcélszerűbb beavatkozni: ár, kényelem, információ, szervizhálózat vagy leadási infrastruktúra oldalán.";
  }
}

const repairBarrierQuestions = [
  { key: "q19_large_nemt_repair_reason", label: "Nagy eszközök" },
  { key: "q18_it_nemt_repair_reason", label: "Személyes IT" },
  { key: "q17_small_nemt_repair_reason", label: "Kis eszközök" },
];

const disposalPathQuestions = [
  { key: "q11", label: "Nagy eszközök" },
  { key: "q25_it_end_of_life", label: "Személyes IT" },
  { key: "q24_small_end_of_life", label: "Kis eszközök" },
];

const motivationQuestions = [
  { key: "q20_repair_motivation", label: "Javítási motivációk" },
];

const lifecycleProductFields = [
  {
    label: "Nagy eszközök",
    usedField: "q10_bought_used_large_household",
    rentShareField: "q14_open_to_rent_share_large_household",
  },
  {
    label: "Személyes IT",
    usedField: "q10_bought_used_personal_it",
    rentShareField: "q14_open_to_rent_share_personal_it",
  },
  {
    label: "Kis eszközök",
    usedField: "q10_bought_used_small",
    rentShareField: "q14_open_to_rent_share_small",
  },
];

function renderPrimaryUsedPurchase(rows) {
  const values = GROUPS.flatMap((group) => {
    const groupRows = rows.filter((row) => row.group === group);
    return lifecycleProductFields.map((product) => {
      const validRows = groupRows.filter((row) => normalize(row[product.usedField]));
      const yesCount = validRows.filter((row) => normalize(row[product.usedField]).toLowerCase() === "igen").length;
      return {
        minta: group,
        termek: product.label,
        arany: percent(yesCount, validRows.length),
        darab: yesCount,
        elemszam: validRows.length,
      };
    });
  });

  embedPrimary(primaryCharts.usedPurchase, {
    ...primaryBaseSpec(values, 330),
    mark: { type: "bar", cornerRadiusEnd: 4 },
    encoding: {
      x: { field: "minta", type: "nominal", title: null, sort: GROUPS, axis: { labelAngle: 0 } },
      y: {
        field: "arany",
        type: "quantitative",
        title: "Igen válaszok aránya termékkategóriánként (%)",
        stack: "zero",
        axis: { format: ".0f" },
      },
      color: {
        field: "termek",
        type: "nominal",
        title: "Termékkategória",
        scale: { domain: lifecycleProductFields.map((product) => product.label), range: ["#245c45", "#2f7f7b", "#d6a84f"] },
      },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "termek", title: "Termékkategória" },
        { field: "arany", title: "Igen válasz aránya", format: ".1f" },
        { field: "darab", title: "Igen válaszok száma" },
        { field: "elemszam", title: "Válaszadók száma" },
      ],
    },
  });

  if (primaryNotes.usedPurchase) {
    primaryNotes.usedPurchase.textContent = "A használt elektronikai termékek vásárlása minden vizsgált termékkategóriában gyakoribb a holland mintában, mint a romániaiban. A különbség különösen a személyes IT eszközök esetében figyelhető meg, ami arra utal, hogy Hollandiában a másodlagos piac elfogadottsága és használata magasabb szintű.";
  }
}

function renderPrimaryAlternativeConsumption(rows) {
  const values = GROUPS.flatMap((group) => {
    const groupRows = rows.filter((row) => row.group === group);
    const categoryValues = lifecycleProductFields.map((product) => ({
      minta: group,
      termek: product.label,
      atlag: mean(groupRows.map((row) => toNumber(row[product.rentShareField]))),
    }));
    return [
      {
        minta: group,
        termek: "Minden",
        atlag: mean(categoryValues.map((row) => row.atlag)),
      },
      ...categoryValues,
    ];
  }).filter((row) => Number.isFinite(row.atlag));
  const productOptions = ["Minden", ...lifecycleProductFields.map((product) => product.label)];

  embedPrimary(primaryCharts.alternativeConsumption, {
    ...primaryBaseSpec(values, 330),
    params: [
      {
        name: "termekSzuro",
        value: "Minden",
        bind: {
          input: "select",
          options: productOptions,
          name: "Termékkategória: ",
        },
      },
    ],
    transform: [{ filter: "datum.termek == termekSzuro" }],
    mark: { type: "bar", cornerRadiusEnd: 4 },
    encoding: {
      x: { field: "minta", type: "nominal", title: null, sort: GROUPS, axis: { labelAngle: 0 } },
      y: {
        field: "atlag",
        type: "quantitative",
        title: "Átlagos nyitottság (1-6)",
        scale: { domain: [0, 6] },
      },
      color: {
        field: "minta",
        type: "nominal",
        title: null,
        scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) },
      },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "termek", title: "Termékkategória" },
        { field: "atlag", title: "Átlagos nyitottság", format: ".2f" },
      ],
    },
  });

  if (primaryNotes.alternativeConsumption) {
    primaryNotes.alternativeConsumption.textContent = "Az alternatív fogyasztási modellek, például a bérlés vagy megosztás iránti nyitottság mindkét országban viszonylag alacsony, ugyanakkor a holland válaszadók minden termékkategóriában nyitottabbnak bizonyulnak. A termékkategóriák közötti eltérések mérsékeltek, így a különbségeket elsősorban az országonként eltérő fogyasztói környezet magyarázhatja.";
  }
}

function renderPrimaryRepairWillingness(rows) {
  const repairMetric = scaleMetrics.find((metric) => metric.key === "repair");
  const values = GROUPS.flatMap((group) => {
    const groupRows = rows.filter((row) => row.group === group);
    return productCategories.map((product) => ({
      minta: group,
      termek: product.label,
      atlag: mean(groupRows.map((row) => metricValueForProduct(row, repairMetric, product))),
    }));
  }).filter((row) => Number.isFinite(row.atlag));

  embedPrimary(primaryCharts.repairWillingness, {
    ...primaryBaseSpec(values, 330),
    mark: { type: "bar", cornerRadiusEnd: 4 },
    encoding: {
      x: { field: "termek", type: "nominal", title: null, sort: productCategories.map((product) => product.label), axis: { labelAngle: 0 } },
      y: { field: "atlag", type: "quantitative", title: "Átlagos javítási hajlandóság (1-6)", scale: { domain: [0, 6] } },
      xOffset: { field: "minta" },
      color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "termek", title: "Termékkategória" },
        { field: "atlag", title: "Átlag", format: ".2f" },
      ],
    },
  });

  if (primaryNotes.repairWillingness) {
    primaryNotes.repairWillingness.textContent = "A javítási hajlandóság mindkét országban a nagy háztartási eszközök esetében a legerősebb, míg a kis elektronikai eszközöknél a legalacsonyabb. Ez arra utal, hogy a fogyasztók nagyobb értékű termékek esetében gyakrabban választják a javítást a csere helyett. A romániai minta minden kategóriában valamivel magasabb értékeket mutat, ugyanakkor az országok közötti különbségek összességében mérsékeltek.";
  }
}

function renderPrimaryFutureDisposal(rows) {
  const values = GROUPS.flatMap((group) => {
    const groupRows = rows.filter((row) => row.group === group && Number.isFinite(toNumber(row.q30_willing_future_disposal)));
    const total = groupRows.length;
    const counts = {};
    groupRows.forEach((row) => {
      const answer = String(toNumber(row.q30_willing_future_disposal));
      counts[answer] = (counts[answer] || 0) + 1;
    });
    return Object.entries(counts).map(([valasz, darab]) => ({
      minta: group,
      valasz,
      darab,
      arany: percent(darab, total),
      sorrend: Number(valasz),
    }));
  });

  embedPrimary(primaryCharts.futureDisposal, {
    ...primaryBaseSpec(values, 300),
    mark: { type: "bar", cornerRadiusEnd: 3 },
    encoding: {
      y: { field: "minta", type: "nominal", title: null, sort: GROUPS },
      x: { field: "arany", type: "quantitative", title: "Válaszmegoszlás", stack: "normalize", axis: { format: "%" } },
      color: {
        field: "valasz",
        type: "nominal",
        title: "Skálaérték",
        sort: { field: "sorrend" },
        scale: { range: ["#d9b26f", "#c89458", "#b66f45", "#7c9a4f", "#2f7f7b", "#245c45"] },
      },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "valasz", title: "Skálaérték" },
        { field: "arany", title: "Arány", format: ".1f" },
        { field: "darab", title: "Elemszám" },
      ],
    },
  });

  if (primaryNotes.futureDisposal) {
    primaryNotes.futureDisposal.textContent = "Mindkét ország válaszadói alapvetően magas hajlandóságot mutatnak arra, hogy a jövőben elektronikai eszközeiket megfelelő módon adják le. A válaszok elsősorban a skála felső tartományaiban koncentrálódnak, ami arra utal, hogy a felelős e-hulladék-kezelés elvi támogatottsága széles körben jelen van. A romániai mintában valamivel nagyobb arányban jelennek meg a legmagasabb értékek, míg a holland válaszok kiegyensúlyozottabban oszlanak meg a magas kategóriák között. Ez arra utalhat, hogy a pozitív szándék mindkét országban erős, ugyanakkor a gyakorlati megvalósulást valószínűleg nem kizárólag az egyéni hajlandóság, hanem az elérhető infrastruktúra és lehetőségek is befolyásolják.";
  }
}

function shareRowsForQuestion(rows, question, categoryLabel = question.label) {
  // TÖBBVÁLASZOS AGGREGÁCIÓ:
  // Kapcsolódó ábrák: "Akadályok és motivációk együtt olvasva", "Mi történik az eszközzel..."
  // A pontosvesszővel elválasztott válaszokból mintán belüli százalékos arányokat készít.
  return GROUPS.flatMap((group) => {
    const groupRows = rows.filter((row) => row.group === group);
    const total = groupRows.filter((row) => normalize(row[question.key])).length;
    const counts = {};
    groupRows.forEach((row) => {
      splitChoices(row[question.key]).forEach((choice) => {
        counts[choice] = (counts[choice] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([valasz, darab]) => ({
      termek: categoryLabel,
      minta: group,
      valasz,
      darab,
      arany: percent(darab, total),
    }));
  });
}

function categoryAverageRows(categoryRows) {
  // A "Minden" nézet kategóriaátlag: nem a nyers válaszszámokat keveri össze.
  const grouped = {};
  categoryRows.forEach((row) => {
    const key = `${row.minta}|||${row.valasz}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row.arany);
  });
  return Object.entries(grouped).map(([key, values]) => {
    const [minta, valasz] = key.split("|||");
    return { termek: "Minden", minta, valasz, darab: null, arany: mean(values) };
  });
}

function productChoiceRows(rows, questions) {
  const categoryRows = questions.flatMap((question) => shareRowsForQuestion(rows, question));
  return [...categoryRows, ...categoryAverageRows(categoryRows)];
}

function topChoiceSpec(productField = true) {
  // VEGA-LITE SPECIFIKÁCIÓRÉSZ:
  // Kapcsolódó ábrák: akadályok/motivációk és leadási utak Top nézete.
  // A Vega-Lite window/rank transform csak a vizualizációban rangsorolja a leggyakoribb válaszokat.
  return {
    transform: [
      ...(productField ? [{ filter: "datum.termek == termekSzuro" }] : []),
      { window: [{ op: "rank", as: "rank" }], sort: [{ field: "arany", order: "descending" }], groupby: ["minta"] },
      { filter: "datum.rank <= 7" },
    ],
    mark: { type: "bar", cornerRadiusEnd: 5 },
    encoding: {
      y: { field: "valasz", type: "nominal", title: null, sort: "-x" },
      x: { field: "arany", type: "quantitative", title: "Arány a válaszadók között (%)", axis: { format: ".0f" } },
      color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
      opacity: { condition: { param: "mintaSzuro", value: 0.86 }, value: 0.18 },
      tooltip: [
        { field: "minta", title: "Minta" },
        ...(productField ? [{ field: "termek", title: "Termékkategória" }] : []),
        { field: "valasz", title: "Válasz" },
        { field: "darab", title: "Elemszám (háttéradat)" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  };
}

function comparisonColumnSpec(productField = true) {
  // VEGA-LITE SPECIFIKÁCIÓRÉSZ:
  // Kapcsolódó ábrák: akadályok/motivációk és leadási utak Országösszevetés nézete.
  // Itt nem stacked chart készül, hanem kategóriánként egymás melletti oszlop Romániának és Hollandiának.
  return {
    transform: productField ? [{ filter: "datum.termek == termekSzuro" }] : [],
    mark: { type: "bar", cornerRadiusEnd: 4 },
    encoding: {
      x: {
        field: "valasz",
        type: "nominal",
        title: null,
        sort: { field: "arany", order: "descending" },
        axis: { labelAngle: -30, labelLimit: 120 },
      },
      y: { field: "arany", type: "quantitative", title: "Arány a válaszadók között (%)", axis: { format: ".0f" } },
      xOffset: { field: "minta" },
      color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
      tooltip: [
        { field: "minta", title: "Minta" },
        ...(productField ? [{ field: "termek", title: "Termékkategória" }] : []),
        { field: "valasz", title: "Válasz" },
        { field: "darab", title: "Elemszám (háttéradat)" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  };
}

function setChartViewToggle(toggle, selectedView, onChange) {
  if (!toggle) return;
  toggle.querySelectorAll("button").forEach((button) => {
    const isActive = button.dataset.view === selectedView;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.onclick = () => onChange(button.dataset.view);
  });
}

function renderPrimaryBarrierMotivation(rows) {
  // ÁBRA: "Akadályok és motivációk együtt olvasva".
  // Módszer: JS többválaszos aggregáció, Top vagy Országösszevetés nézettel.
  // Renderelés: Vega-Lite bar chart; a motivációknál az 1 darabos válaszopciók szűrve vannak.
  setChartViewToggle(primaryBarrierViewToggle, primaryBarrierView, (view) => {
    primaryBarrierView = view;
    renderPrimaryBarrierMotivation(rows);
  });
  setChartViewToggle(primaryMotivationViewToggle, primaryMotivationView, (view) => {
    primaryMotivationView = view;
    renderPrimaryBarrierMotivation(rows);
  });

  const barrierSpec = primaryBarrierView === "compare" ? comparisonColumnSpec(true) : topChoiceSpec(true);
  const repairProductOptions = repairBarrierQuestions.map((question) => question.label);
  embedPrimary(primaryCharts.barrierChoice, {
    ...primaryBaseSpec(repairBarrierQuestions.flatMap((question) => shareRowsForQuestion(rows, question)), primaryBarrierView === "compare" ? 390 : 330),
    params: [
      { name: "termekSzuro", value: repairProductOptions[0], bind: { input: "select", options: repairProductOptions, name: "Termékkategória: " } },
      ...(primaryBarrierView === "top" ? [{ name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" }] : []),
    ],
    ...barrierSpec,
  });

  const motivationValues = motivationQuestions.flatMap((question) =>
    shareRowsForQuestion(rows, question, question.label).map((row) => ({ ...row, kerdes: question.label }))
  ).filter((row) => row.darab > 1);
  const motivationSpec = primaryMotivationView === "compare" ? comparisonColumnSpec(false) : topChoiceSpec(false);
  embedPrimary(primaryCharts.motivationChoice, {
    ...primaryBaseSpec(motivationValues, primaryMotivationView === "compare" ? 390 : 330),
    params: [
      { name: "kerdesSzuro", value: motivationQuestions[0].label, bind: { input: "select", options: motivationQuestions.map((question) => question.label), name: "Motiváció: " } },
      ...(primaryMotivationView === "top" ? [{ name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" }] : []),
    ],
    transform: [{ filter: "datum.kerdes == kerdesSzuro" }, ...motivationSpec.transform],
    mark: motivationSpec.mark,
    encoding: motivationSpec.encoding,
  });

  if (primaryNotes.barrierChoice) {
    primaryNotes.barrierChoice.textContent = "A legjelentősebb akadályt az jelenti, hogy a javítás költsége sok esetben megközelíti vagy eléri egy új termék árát. További problémát jelent az alkatrészek korlátozott elérhetősége, a megbízható szervizek hiánya és a javítás időigénye. Az adatbiztonsággal kapcsolatos aggályok ezzel szemben mindkét országban viszonylag alacsony jelentőségűnek bizonyultak.";
  }
  if (primaryNotes.motivationChoice) {
    primaryNotes.motivationChoice.textContent = "Mindkét országban egyértelműen az alacsonyabb javítási költség bizonyult a legerősebb ösztönző tényezőnek. Emellett a válaszadók nagy része fontosnak tartja a megbízható szervizekhez való könnyebb hozzáférést és az egyszerűbb javítási folyamatokat is. Az eredmények azt mutatják, hogy a javítás népszerűsítéséhez elsősorban gyakorlati és gazdasági akadályokat kell csökkenteni.";
  }
}

function renderPrimaryDisposalPath(rows) {
  // ÁBRA: "Mi történik az eszközzel az életciklus végén?"
  // Módszer: JS többválaszos/kategóriaarány aggregáció termékkategóriánként.
  // Renderelés: Vega-Lite bar chart Top vagy Országösszevetés nézettel.
  setChartViewToggle(primaryDisposalViewToggle, primaryDisposalView, (view) => {
    primaryDisposalView = view;
    renderPrimaryDisposalPath(rows);
  });
  const disposalSpec = primaryDisposalView === "compare" ? comparisonColumnSpec(true) : topChoiceSpec(true);
  embedPrimary(primaryCharts.disposalPath, {
    ...primaryBaseSpec(productChoiceRows(rows, disposalPathQuestions), primaryDisposalView === "compare" ? 390 : 340),
    params: [
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
      ...(primaryDisposalView === "top" ? [{ name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" }] : []),
    ],
    ...disposalSpec,
  });

  if (primaryNotes.disposalPath) {
    primaryNotes.disposalPath.textContent = "A válaszok alapján az elektronikai eszközök jelentős része nem kerül azonnal vissza a körforgásba, hanem a háztartásokban marad, továbbadásra vagy értékesítésre kerül. A romániai mintában az otthoni tárolás hangsúlyosabb, míg Hollandiában a különböző életciklus-végi megoldások kiegyensúlyozottabban oszlanak meg. Ez arra utal, hogy az elektronikai termékek útja a használat után sok esetben hosszabb és összetettebb, mint a közvetlen újrahasznosítás.";
  }
}

function renderPrimaryDropoffKnowledge(rows) {
  const values = GROUPS.flatMap((group) => {
    const groupRows = rows.filter((row) => row.group === group);
    const total = groupRows.filter((row) => normalize(row.q27_knews_dropoff)).length;
    const counts = countBy(groupRows, "q27_knews_dropoff");
    return Object.entries(counts)
      .filter(([answer]) => normalize(answer))
      .map(([answer, darab]) => ({
        minta: group,
        valasz: normalize(answer),
        darab,
        arany: percent(darab, total),
      }));
  });

  embedPrimary(primaryCharts.dropoffKnowledge, {
    ...primaryBaseSpec(values, 300),
    facet: {
      column: { field: "minta", type: "nominal", title: null, sort: GROUPS, header: { labelFontWeight: 800, labelColor: "#245c45" } },
    },
    spec: {
      mark: { type: "arc", innerRadius: 42, stroke: "#ffffff", strokeWidth: 2 },
      encoding: {
        theta: { field: "arany", type: "quantitative", stack: true },
        color: {
          field: "valasz",
          type: "nominal",
          title: "Válasz",
          scale: { domain: ["Igen", "Nem"], range: ["#245c45", "#b66f45"] },
        },
        tooltip: [
          { field: "minta", title: "Minta" },
          { field: "valasz", title: "Válasz" },
          { field: "arany", title: "Arány", format: ".1f" },
          { field: "darab", title: "Elemszám" },
        ],
      },
    },
    resolve: { scale: { color: "shared" } },
  });

}

function renderPrimaryRepairQuality(rows) {
  // ÁBRA: "Hibátlan és apró hibás eszközök elfogadása".
  // Módszer: q22 és q23 Likert-átlagok termékkategóriánként és mintánként.
  // Renderelés: Vega-Lite grouped column chart, 0-tól induló y-skálával.
  const fullMetric = scaleMetrics.find((metric) => metric.key === "fullRepair");
  const imperfectMetric = scaleMetrics.find((metric) => metric.key === "imperfectRepair");
  const values = productCategories.flatMap((product) =>
    GROUPS.flatMap((group) => {
      const groupRows = rows.filter((row) => row.group === group);
      return [
        { termek: product.label, minta: group, allapot: "Hibátlan javítás után", allapotRovid: "Hibátlan", atlag: mean(groupRows.map((row) => metricValueForProduct(row, fullMetric, product))) },
        { termek: product.label, minta: group, allapot: "Apró hibákkal javítás után", allapotRovid: "Apró hibás", atlag: mean(groupRows.map((row) => metricValueForProduct(row, imperfectMetric, product))) },
      ];
    })
  );

  embedPrimary(primaryCharts.repairQuality, {
    ...primaryBaseSpec(values, 340),
    params: [
      { name: "termekSzuro", value: "Minden", bind: { input: "select", options: productCategories.map((product) => product.label), name: "Termékkategória: " } },
      { name: "mintaSzuro", select: { type: "point", fields: ["minta"] }, bind: "legend" },
    ],
    transform: [{ filter: "datum.termek == termekSzuro" }],
    mark: { type: "bar", cornerRadiusEnd: 5 },
    encoding: {
      x: { field: "allapotRovid", type: "nominal", title: null, sort: ["Hibátlan", "Apró hibás"], axis: { labelAngle: 0 } },
      y: { field: "atlag", type: "quantitative", title: "Átlagos elfogadási hajlandóság", scale: { domain: [0, 6] } },
      xOffset: { field: "minta" },
      color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
      opacity: { condition: { param: "mintaSzuro", value: 0.9 }, value: 0.18 },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "termek", title: "Termékkategória" },
        { field: "allapot", title: "Javítás utáni állapot" },
        { field: "atlag", title: "Átlag", format: ".2f" },
      ],
    },
  });

  if (primaryNotes.repairQuality) {
    primaryNotes.repairQuality.textContent = "A teljes mértékben megjavított eszközök használatának elfogadottsága mindkét országban magas, ami pozitív képet mutat a javítás társadalmi elfogadottságáról. Amennyiben azonban kisebb hibák maradnak fenn, az elfogadási hajlandóság jelentősen csökken. Ez arra utal, hogy a fogyasztók számára nem pusztán a működőképesség, hanem a javítás minősége is meghatározó szempont.";
  }
}

function renderPrimarySelfRepair(rows) {
  // ÁBRA: "Önálló javítási hajlandóság".
  // Módszer: q21 kategóriás válaszok országonkénti százalékos megoszlása.
  // Renderelés: Vega-Lite 100%-os stacked bar chart.
  const answerOrder = ["igen", "talán", "nem"];
  const labelForAnswer = (answer) => {
    const normalized = normalize(answer).toLowerCase();
    if (normalized === "igen") return "Igen";
    if (normalized === "talán" || normalized === "talan") return "Talán";
    if (normalized === "nem") return "Nem";
    return answer || "Nincs válasz";
  };

  const values = GROUPS.flatMap((group) => {
    const groupRows = rows.filter((row) => row.group === group && normalize(row.q21_fix_minemr_yourself));
    const total = groupRows.length;
    const counts = {};
    groupRows.forEach((row) => {
      const answer = labelForAnswer(row.q21_fix_minemr_yourself);
      counts[answer] = (counts[answer] || 0) + 1;
    });
    return Object.entries(counts).map(([valasz, darab]) => ({
      minta: group,
      valasz,
      darab,
      arany: percent(darab, total),
      sorrend: answerOrder.indexOf(valasz.toLowerCase()),
    }));
  });

  embedPrimary(primaryCharts.selfRepair, {
    ...primaryBaseSpec(values, 340),
    mark: { type: "bar", cornerRadiusEnd: 4 },
    encoding: {
      y: { field: "minta", type: "nominal", title: null, sort: GROUPS },
      x: { field: "arany", type: "quantitative", title: "Válaszmegoszlás", stack: "normalize", axis: { format: "%" } },
      color: {
        field: "valasz",
        type: "nominal",
        title: "Válasz",
        sort: { field: "sorrend" },
        scale: { domain: ["Igen", "Talán", "Nem"], range: ["#2f7f7b", "#d9b26f", "#b66f45"] },
      },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "valasz", title: "Válasz" },
        { field: "arany", title: "Arány", format: ".1f" },
        { field: "darab", title: "Elemszám" },
      ],
    },
  });

  if (primaryNotes.selfRepair) {
    primaryNotes.selfRepair.textContent = "Mindkét országban magas azok aránya, akik kisebb hibákat saját maguk is megpróbálnának kijavítani. A holland válaszadók körében ez a hajlandóság még erősebben jelenik meg, ami fejlettebb önálló javítási kultúrára utalhat. Az eredmények alapján a kisebb javítások elvégzése sok fogyasztó számára természetes alternatívát jelent a szerviz igénybevételével szemben.";
  }
}
