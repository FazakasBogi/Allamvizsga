const overviewValueDimensions = [
  { key: "q01_env_concern", label: "Környezeti aggodalom" },
  { key: "q02_nem_harm_decisions", label: "Döntések hatása" },
  { key: "q03_follow_nemrms", label: "Normakövetés" },
  { key: "q04_sustainable_society", label: "Fenntartható társadalom" },
];

function titleCaseAnswer(value) {
  const normalized = normalize(value).toLowerCase();
  if (normalized === "igen") return "Igen";
  if (normalized === "nem") return "Nem";
  if (normalized === "talán") return "Talán";
  return normalize(value) || "Nincs válasz";
}

function renderPrimaryValueDimensions(rows) {
  const values = GROUPS.flatMap((group) => {
    const groupRows = rows.filter((row) => row.group === group);
    return overviewValueDimensions.map((dimension) => {
      const answers = groupRows.map((row) => toNumber(row[dimension.key])).filter(Number.isFinite);
      return {
        minta: group,
        dimenzio: dimension.label,
        atlag: mean(answers),
        darab: answers.length,
      };
    });
  }).filter((row) => Number.isFinite(row.atlag));

  embedPrimary(primaryCharts.valueDimensions, {
    ...primaryBaseSpec(values, 330),
    mark: { type: "bar", cornerRadiusEnd: 4 },
    encoding: {
      x: { field: "dimenzio", type: "nominal", title: null, sort: overviewValueDimensions.map((item) => item.label), axis: { labelAngle: 0, labelLimit: 135 } },
      y: { field: "atlag", type: "quantitative", title: "Átlagos érték (1-6)", scale: { domain: [0, 6] } },
      xOffset: { field: "minta" },
      color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "dimenzio", title: "Értékdimenzió" },
        { field: "atlag", title: "Átlag", format: ".2f" },
        { field: "darab", title: "Válaszok száma" },
      ],
    },
  });

  if (primaryNotes.valueDimensions) {
    primaryNotes.valueDimensions.textContent = "Mindkét országban magas a környezeti és társadalmi értékek jelentősége. A romániai válaszadók minden vizsgált dimenzióban kissé magasabb értékeket adtak, különösen a fenntartható társadalom fontosságának megítélésében.";
  }
}

function renderPrimaryBrokenPhoneDisposal(rows) {
  const values = GROUPS.flatMap((group) => {
    const groupRows = rows.filter((row) => row.group === group);
    const total = groupRows.filter((row) => normalize(row.q05_broken_phone_actions)).length;
    const counts = {};
    groupRows.forEach((row) => {
      splitChoices(row.q05_broken_phone_actions).forEach((choice) => {
        counts[choice] = (counts[choice] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([valasz, darab]) => ({
      minta: group,
      valasz,
      darab,
      arany: percent(darab, total),
    }));
  });

  embedPrimary(primaryCharts.brokenPhoneDisposal, {
    ...primaryBaseSpec(values, 360),
    mark: { type: "bar", cornerRadiusEnd: 4 },
    encoding: {
      y: { field: "valasz", type: "nominal", title: null, sort: "-x", axis: { labelLimit: 170 } },
      x: { field: "arany", type: "quantitative", title: "Arány a válaszadók között (%)", axis: { format: ".0f" } },
      yOffset: { field: "minta" },
      color: { field: "minta", type: "nominal", title: null, scale: { domain: GROUPS, range: GROUPS.map((group) => GROUP_COLORS[group]) } },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "valasz", title: "Válasz" },
        { field: "darab", title: "Elemszám" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  });

  if (primaryNotes.brokenPhoneDisposal) {
    primaryNotes.brokenPhoneDisposal.textContent = "A válaszadók többsége tisztában van az e-hulladék megfelelő kezelésének lehetőségeivel. A leggyakoribb válaszok az eszköz továbbadása, javítása vagy hivatalos gyűjtőpontra történő leadása voltak, ugyanakkor mindkét országban jelentős a használaton kívüli készülékek otthoni tárolása.";
  }
}

function renderPrimaryEducationProgram(rows) {
  const answerOrder = ["Igen", "Talán", "Nem"];
  const values = GROUPS.flatMap((group) => {
    const groupRows = rows.filter((row) => row.group === group);
    const total = groupRows.filter((row) => normalize(row.q08_would_join_programs)).length;
    const counts = {};
    groupRows.forEach((row) => {
      const answer = titleCaseAnswer(row.q08_would_join_programs);
      if (answer !== "Nincs válasz") counts[answer] = (counts[answer] || 0) + 1;
    });
    return answerOrder.map((valasz) => {
      const darab = counts[valasz] || 0;
      return {
        minta: group,
        valasz,
        darab,
        arany: percent(darab, total),
      };
    });
  });

  embedPrimary(primaryCharts.educationProgram, {
    ...primaryBaseSpec(values, 330),
    mark: { type: "bar", cornerRadiusEnd: 4 },
    encoding: {
      x: { field: "minta", type: "nominal", title: null, sort: GROUPS, axis: { labelAngle: 0 } },
      y: { field: "arany", type: "quantitative", title: "Megoszlás (%)", stack: "zero", scale: { domain: [0, 100] }, axis: { format: ".0f" } },
      color: { field: "valasz", type: "nominal", title: "Válasz", scale: { domain: answerOrder, range: ["#245c45", "#d6a84f", "#b66f45"] } },
      tooltip: [
        { field: "minta", title: "Minta" },
        { field: "valasz", title: "Válasz" },
        { field: "darab", title: "Elemszám" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  });

  if (primaryNotes.educationProgram) {
    primaryNotes.educationProgram.textContent = "A korábbi részvétel alacsony, de az érdeklődés továbbra is jelen van. Különösen a romániai válaszadók mutatnak nagyobb nyitottságot arra, hogy a jövőben részt vegyenek e-hulladékkal kapcsolatos tájékoztató vagy oktatási programokon.";
  }
}

function renderPrimaryOverviewCharts(rows) {
  renderPrimaryValueDimensions(rows);
  renderPrimaryBrokenPhoneDisposal(rows);
  renderPrimaryEducationProgram(rows);
}
