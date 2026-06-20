function renderWeeeCategoryTrend(rows) {
  // ÁBRA: "WEEE begyűjtött mennyiségek országonként és termékkategóriánként".
  // Adatelőkészítés: Eurostat/WEEE CSV; a JS országnevet és kategórianevet egységesít.
  // Renderelés: Vega-Lite mennyiségi, országonként egymás melletti stacked column chart.
  const countryMap = {
    Romania: "Románia",
    Netherlands: "Hollandia",
  };
  const categoryMap = {
    "Large devices": "Nagy eszközök",
    "Personal devices": "Személyes IT eszközök",
    "Small devices": "Kis eszközök",
  };
  const categoryOrder = ["Nagy eszközök", "Személyes IT eszközök", "Kis eszközök"];
  const values = rows
    .map((row) => ({
      kategoria: categoryMap[normalize(row.Category)] || normalize(row.Category),
      orszag: countryMap[normalize(row.Country)] || normalize(row.Country),
      ev: toNumber(row.Year),
      ertek: toNumber(row.Value),
    }))
    .filter((row) => ["Hollandia", "Románia"].includes(row.orszag) && Number.isFinite(row.ev) && Number.isFinite(row.ertek))
    .map((row) => ({
      ...row,
      sorozat: `${row.orszag} - ${row.kategoria}`,
      kategoriaSorrend: categoryOrder.indexOf(row.kategoria),
    }));
  const seriesOrder = [
    "Hollandia - Nagy eszközök",
    "Hollandia - Személyes IT eszközök",
    "Hollandia - Kis eszközök",
    "Románia - Nagy eszközök",
    "Románia - Személyes IT eszközök",
    "Románia - Kis eszközök",
  ];
  const seriesColors = [
    "#245c45",
    "#2f7f7b",
    "#8fb8a9",
    "#b66f45",
    "#d6a84f",
    "#edc783",
  ];

  embedPrimary(secondaryCharts.categoryTrend, {
    ...primaryBaseSpec(values, 390),
    mark: { type: "bar", cornerRadiusEnd: 4 },
    encoding: {
      x: { field: "ev", type: "ordinal", title: "Év", sort: [2019, 2020, 2021, 2022, 2023] },
      xOffset: { field: "orszag", type: "nominal", title: "Ország", sort: ["Hollandia", "Románia"] },
      y: {
        field: "ertek",
        type: "quantitative",
        title: "Begyűjtött e-hulladék (tonna)",
        stack: "zero",
        axis: { format: "~s" },
      },
      color: {
        field: "sorozat",
        type: "nominal",
        title: null,
        scale: { domain: seriesOrder, range: seriesColors },
        legend: { columns: 3, labelLimit: 180 },
      },
      order: {
        field: "kategoriaSorrend",
        type: "quantitative",
      },
      tooltip: [
        { field: "orszag", title: "Ország" },
        { field: "ev", title: "Év" },
        { field: "kategoria", title: "Termékkategória" },
        { field: "ertek", title: "Begyűjtött mennyiség", format: "," },
      ],
    },
  });

  const latestYear = Math.max(...values.map((row) => row.ev));
  const latest = values.filter((row) => row.ev === latestYear).sort((a, b) => b.ertek - a.ertek)[0];
  if (secondaryNotes.categoryTrend && latest) {
    secondaryNotes.categoryTrend.textContent = "A két ország hasonló népessége ellenére Hollandia minden kategóriában több e-hulladékot gyűjt be. A különbség különösen a kis elektronikai eszközök esetében jelentős, ahol a holland rendszer lényegesen nagyobb mennyiséget képes formálisan begyűjteni. Ez arra utal, hogy a körforgásos gazdaság sikerében nemcsak a feldolgozás minősége, hanem a fogyasztók részvétele és a begyűjtési infrastruktúra fejlettsége is meghatározó.";
  }
}

function renderWeeeRecyclingTrend(rows) {
  // ÁBRA: "WEEE újrahasznosítási ráta alakulása".
  // Adatelőkészítés: Eurostat újrahasznosítási CSV; üres cella = hiányzó adat, nem nulla.
  // Renderelés: Vega-Lite vonaldiagram.
  const countryMap = {
    Romania: "Románia",
    Netherlands: "Hollandia",
    "European Union - 27 countries (from 2020)": "EU-27",
  };
  const values = rows
    .map((row) => ({
      orszag: countryMap[normalize(row.geo)] || normalize(row.geo),
      ev: toNumber(row.TIME_PERIOD),
      rata: toNumber(row.OBS_VALUE),
    }))
    // Az üres Eurostat cella hiányzó adat, nem 0; ezért a vonal megszakadhat.
    .filter((row) => ["Románia", "Hollandia", "EU-27"].includes(row.orszag) && Number.isFinite(row.ev) && Number.isFinite(row.rata));

  embedPrimary(secondaryCharts.recyclingTrend, {
    ...primaryBaseSpec(values, 340),
    mark: { type: "line", point: true, strokeWidth: 3 },
    encoding: {
      x: { field: "ev", type: "ordinal", title: "Év", sort: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023] },
      y: { field: "rata", type: "quantitative", title: "Újrahasznosítási ráta (%)", scale: { domainMin: 50 } },
      color: { field: "orszag", type: "nominal", title: null, scale: { domain: ["Románia", "Hollandia", "EU-27"], range: [COMPARISON_COLORS.romania, COMPARISON_COLORS.netherlands, COMPARISON_COLORS.eu] } },
      tooltip: [
        { field: "orszag", title: "Ország" },
        { field: "ev", title: "Év" },
        { field: "rata", title: "Ráta", format: ".1f" },
      ],
    },
  });

  const latestYear = Math.max(...values.map((row) => row.ev));
  const latest = values.filter((row) => row.ev === latestYear).sort((a, b) => b.rata - a.rata);
  if (secondaryNotes.recyclingTrend && latest.length) {
    secondaryNotes.recyclingTrend.textContent = "A holland rendszer stabil, míg Romániában nagyobb ingadozás figyelhető meg. Az EU-27 átlag a vizsgált időszakban viszonylag kiegyensúlyozottan alakult, Hollandia pedig jellemzően ehhez közeli értékeket mutatott. Románia több évben is megközelítette vagy meghaladta az uniós átlagot, ami a begyűjtött hulladék hatékony feldolgozására utal.";
  }
}

function renderWeeeRecyclingRanking(rows) {
  // ÁBRA: "Újrahasznosítási ráta az utolsó romániai adatévben".
  // Módszer: JS szűrés az utolsó olyan évre, ahol Romániának is van adatpontja.
  // Renderelés: Vega-Lite rangsoroló vízszintes oszlopdiagram.
  const latestYear = Math.max(
    ...rows
      .filter((row) => normalize(row.geo) === "Romania" && Number.isFinite(toNumber(row.OBS_VALUE)))
      .map((row) => toNumber(row.TIME_PERIOD))
  );
  const focus = new Set(["Romania", "Netherlands", "European Union - 27 countries (from 2020)"]);
  const values = rows
    .map((row) => ({
      orszag: normalize(row.geo),
      ev: toNumber(row.TIME_PERIOD),
      rata: toNumber(row.OBS_VALUE),
    }))
    .filter((row) => row.ev === latestYear && Number.isFinite(row.rata))
    .sort((a, b) => b.rata - a.rata)
    .slice(0, 16)
    .concat(
      rows
        .map((row) => ({ orszag: normalize(row.geo), ev: toNumber(row.TIME_PERIOD), rata: toNumber(row.OBS_VALUE) }))
        .filter((row) => row.ev === latestYear && focus.has(row.orszag) && Number.isFinite(row.rata))
    )
    .filter((row, index, array) => array.findIndex((item) => item.orszag === row.orszag) === index)
    .map((row) => ({
      ...row,
      tipus: focus.has(row.orszag) ? "Kiemelt összevetés" : "Top ország",
      label: row.orszag === "European Union - 27 countries (from 2020)" ? "EU-27" : row.orszag,
    }));

  embedPrimary(secondaryCharts.recyclingRanking, {
    ...primaryBaseSpec(values, 380),
    mark: { type: "bar", cornerRadiusEnd: 5 },
    encoding: {
      y: { field: "label", type: "nominal", sort: "-x", title: null },
      x: { field: "rata", type: "quantitative", title: `Újrahasznosítási ráta ${latestYear}-ban (%)` },
      color: { field: "tipus", type: "nominal", title: null, scale: { domain: ["Kiemelt összevetés", "Top ország"], range: [COMPARISON_COLORS.romania, COMPARISON_COLORS.netherlands] } },
      tooltip: [
        { field: "label", title: "Ország" },
        { field: "rata", title: "Ráta", format: ".1f" },
      ],
    },
  });

  const romania = values.find((row) => row.orszag === "Romania");
  const netherlands = values.find((row) => row.orszag === "Netherlands");
  if (secondaryNotes.recyclingRanking && romania && netherlands) {
    secondaryNotes.recyclingRanking.textContent = `A magas újrahasznosítási ráta önmagában nem jelenti a rendszer sikerességét. Románia ${latestYear}-ben magasabb WEEE-újrahasznosítási rátát ért el, mint Hollandia, ugyanakkor ez kizárólag a már begyűjtött hulladék kezelésének hatékonyságát mutatja. Az eredmény arra utal, hogy Romániában nem az újrahasznosítás minősége, hanem elsősorban a begyűjtés alacsony szintje jelenti a kihívást.`;
  }
}

const eurobarometerCountries = ["EU-27", "Romania", "Netherlands"];
const eurobarometerCountryLabels = {
  "EU-27": "EU-27",
  Romania: "Románia",
  Netherlands: "Hollandia",
};
const eurobarometerCountryColors = {
  "EU-27": COMPARISON_COLORS.eu,
  Romania: COMPARISON_COLORS.romania,
  Netherlands: COMPARISON_COLORS.netherlands,
};
const eurobarometerResponseLabels = {
  "Totally agree": "Teljesen egyetért",
  "Tend to agree": "Inkább egyetért",
  "Tend to disagree": "Inkább nem ért egyet",
  "Totally disagree": "Egyáltalán nem ért egyet",
  "Don't know": "Nem tudja",
  "Better ensuring that products sold on the EU market do not contribute to harming the environment": "EU-piaci termékek környezeti kontrollja",
  "Investing in Research and Development to find technological solutions": "K+F és technológiai megoldások",
  "Providing more information and education to be more environmentally friendly": "Több információ és oktatás",
  "Restoring nature": "Természet helyreállítása",
  "Ensuring that environmental laws are respected": "Környezeti jogszabályok betartatása",
  "Removing government subsidies on activities that pollute": "Szennyező támogatások megszüntetése",
  "Increasing taxation on activities that pollute": "Szennyező tevékenységek adóztatása",
  "Promoting the circular economy through reducing waste, and reusing or recycling products": "Körforgásos gazdaság ösztönzése",
  "None of the above (SPONTANEOUS)": "Egyik sem",
  "Use reusable packaging": "Újrahasználható csomagolás",
  "Correctly sort my waste for recycling": "Hulladék helyes szelektálása",
  "Primarily buy products in recycled packages": "Újrahasznosított csomagolású termék",
  "Primarily buy products that do not have more packaging than necessary": "Kevesebb felesleges csomagolás",
  "None of the above": "Egyik sem",
  "Plastic waste": "Műanyag hulladék",
  "Electronic waste": "Elektronikai hulladék",
  "Battery waste": "Akkumulátorhulladék",
  "Food waste": "Élelmiszer-hulladék",
  "Textile waste": "Textilhulladék",
  "Chemical waste": "Vegyi hulladék",
  "All of these": "Mindegyik",
  "None of these (SPONTANEOUS)": "Egyik sem",
  Yes: "Igen",
  No: "Nem",
};

function eurobarometerRowsForQuestion(rows, questionCode, options = {}) {
  // EUROBAROMETER ADATELŐKÉSZÍTÉS:
  // A PDF-ekből előállított tisztított CSV-ből kérdésenként kiválogatja Románia,
  // Hollandia és EU-27 százalékos válaszait, majd magyar címkékkel látja el őket.
  const exclude = new Set(options.exclude || []);
  return rows
    .filter((row) => row.question_code === questionCode && !exclude.has(row.response))
    .map((row) => ({
      ...row,
      orszag: eurobarometerCountryLabels[row.country] || row.country,
      valasz: eurobarometerResponseLabels[row.response] || row.response,
      arany: toNumber(row.percent),
      sorrend: toNumber(row.response_order),
    }))
    .filter((row) => Number.isFinite(row.arany));
}

function eurobarometerColorScale() {
  return {
    domain: eurobarometerCountries.map((country) => eurobarometerCountryLabels[country]),
    range: eurobarometerCountries.map((country) => eurobarometerCountryColors[country]),
  };
}

function renderEurobarometerQb1(rows) {
  // ÁBRA: QB1 - környezeti ügyek hatása a mindennapi életre és egészségre.
  // Módszer: Eurobarometer százalékok kérdéskód szerinti szűrése.
  // Renderelés: Vega-Lite rétegzett arc/nested pie specifikáció, külön gyűrűvel országonként.
  const values = eurobarometerRowsForQuestion(rows, "QB1", {
    exclude: ["Total 'Agree'", "Total 'Disagree'"],
  }).map((row) => {
    const ring = { "EU-27": 0, Romania: 1, Netherlands: 2 }[row.country];
    return {
      ...row,
      radius2: 58 + ring * 54,
      radius: 100 + ring * 54,
    };
  });
  const countryLabels = [
    { orszag: "EU-27", x: 0, y: -79 },
    { orszag: "Románia", x: 0, y: -133 },
    { orszag: "Hollandia", x: 0, y: -187 },
  ];

  embedPrimary(secondaryCharts.eurobarometerQb1NestedPie, {
    ...primaryBaseSpec(values, 420),
    layer: [
      {
        mark: { type: "arc", stroke: "#f7f5ee", strokeWidth: 2 },
        encoding: {
          theta: { field: "arany", type: "quantitative", stack: true },
          radius: { field: "radius", type: "quantitative", scale: { domain: [0, 220], range: [0, 220] } },
          radius2: { field: "radius2", type: "quantitative", scale: { domain: [0, 220], range: [0, 220] } },
          color: { field: "valasz", type: "nominal", title: "Válasz" },
          opacity: {
            field: "orszag",
            type: "nominal",
            scale: { domain: ["EU-27", "Románia", "Hollandia"], range: [0.62, 0.82, 1] },
            legend: null,
          },
          order: { field: "sorrend", type: "quantitative" },
          tooltip: [
            { field: "orszag", title: "Ország" },
            { field: "valasz", title: "Válasz" },
            { field: "arany", title: "Arány", format: ".1f" },
          ],
        },
      },
      {
        data: { values: countryLabels },
        mark: { type: "rect", width: 76, height: 20, cornerRadius: 4, fill: "#f7f5ee", fillOpacity: 0.92 },
        encoding: {
          x: { field: "x", type: "quantitative", scale: { domain: [-220, 220] }, axis: null },
          y: { field: "y", type: "quantitative", scale: { domain: [-220, 220] }, axis: null },
        },
      },
      {
        data: { values: countryLabels },
        mark: { type: "text", align: "center", baseline: "middle", fontWeight: 900, fontSize: 13, color: "#245c45" },
        encoding: {
          x: { field: "x", type: "quantitative", scale: { domain: [-220, 220] }, axis: null },
          y: { field: "y", type: "quantitative", scale: { domain: [-220, 220] }, axis: null },
          text: { field: "orszag" },
        },
      },
    ],
  });

  if (secondaryNotes.eurobarometerQb1NestedPie) {
    secondaryNotes.eurobarometerQb1NestedPie.textContent = "A környezeti problémák jelentőségét mindkét ország lakossága magasra értékeli. A holland válaszadók körében különösen magas azok aránya, akik teljes mértékben egyetértenek azzal, hogy a környezeti ügyek közvetlen hatással vannak mindennapi életükre.";
  }
}

function renderEurobarometerQb2(rows) {
  // ÁBRA: QB2T - leghatékonyabb környezetpolitikai intézkedések.
  // Módszer: Eurobarometer többválaszos százalékok összevetése Románia, Hollandia és EU-27 között.
  // Renderelés: Vega-Lite grouped column chart.
  const values = eurobarometerRowsForQuestion(rows, "QB2T");
  embedPrimary(secondaryCharts.eurobarometerQb2Columns, {
    ...primaryBaseSpec(values, 420),
    mark: { type: "bar", cornerRadiusEnd: 4 },
    encoding: {
      x: { field: "valasz", type: "nominal", title: null, sort: { field: "sorrend" }, axis: { labelAngle: -28, labelLimit: 130 } },
      y: { field: "arany", type: "quantitative", title: "Arány (%)" },
      xOffset: { field: "orszag" },
      color: { field: "orszag", type: "nominal", title: null, scale: eurobarometerColorScale() },
      tooltip: [
        { field: "orszag", title: "Ország" },
        { field: "valasz", title: "Válasz" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  });

  if (secondaryNotes.eurobarometerQb2Columns) {
    secondaryNotes.eurobarometerQb2Columns.textContent = "Mindhárom minta a körforgásos gazdaságot tartja az egyik leghatékonyabb megoldásnak. Ugyanakkor a hangsúlyok eltérnek: Hollandiában nagyobb támogatást kapnak a technológiai és innovációs megoldások, míg Romániában az oktatás és a lakossági tájékoztatás szerepe jelenik meg erősebben.";
  }
}

function renderEurobarometerQb6(rows) {
  // ÁBRA: QB6 - hulladékcsökkentési lépések.
  // Módszer: többválaszos Eurobarometer arányok; az összegek meghaladhatják a 100%-ot.
  // Renderelés: Vega-Lite stacked bar chart, reszponzív jelmagyarázattal.
  const values = eurobarometerRowsForQuestion(rows, "QB6");
  embedPrimary(secondaryCharts.eurobarometerQb6Stacked, {
    ...primaryBaseSpec(values, 360),
    mark: { type: "bar", cornerRadiusEnd: 3 },
    encoding: {
      y: { field: "orszag", type: "nominal", title: null, sort: ["EU-27", "Románia", "Hollandia"] },
      x: { field: "arany", type: "quantitative", title: "Választási arányok összege (%)", stack: true },
      color: {
        field: "valasz",
        type: "nominal",
        title: "Vállalás",
        sort: { field: "sorrend" },
        legend: { orient: "bottom", direction: "vertical", columns: 1, labelLimit: 260 },
      },
      tooltip: [
        { field: "orszag", title: "Ország" },
        { field: "valasz", title: "Válasz" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  });

  if (secondaryNotes.eurobarometerQb6Stacked) {
    secondaryNotes.eurobarometerQb6Stacked.textContent = "Hollandiában minden vizsgált területen nagyobb a cselekvési hajlandóság. Különösen a szelektív hulladékgyűjtés és az újrahasználható csomagolások alkalmazása esetében figyelhető meg jelentős különbség a román és holland válaszadók között.";
  }
}

function renderEurobarometerQb7(rows) {
  // ÁBRA: QB7T - problémás hulladéktípusok.
  // Módszer: országonkénti százalékos válaszprofil a tisztított Eurobarometer CSV-ből.
  // Renderelés: Vega-Lite vonaldiagram pontjelöléssel.
  const values = eurobarometerRowsForQuestion(rows, "QB7T");
  embedPrimary(secondaryCharts.eurobarometerQb7Dots, {
    ...primaryBaseSpec(values, 380),
    mark: { type: "line", point: { filled: true, size: 80 }, strokeWidth: 3 },
    encoding: {
      x: { field: "valasz", type: "nominal", title: null, sort: { field: "sorrend" }, axis: { labelAngle: -25, labelLimit: 115 } },
      y: { field: "arany", type: "quantitative", title: "Arány (%)" },
      color: { field: "orszag", type: "nominal", title: null, scale: eurobarometerColorScale() },
      tooltip: [
        { field: "orszag", title: "Ország" },
        { field: "valasz", title: "Hulladéktípus" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  });

  if (secondaryNotes.eurobarometerQb7Dots) {
    secondaryNotes.eurobarometerQb7Dots.textContent = "Az elektronikai hulladék egyik országban sem számít a legfontosabb problémának. A válaszadók elsősorban a műanyag- és vegyszerhulladékot tekintik a legsúlyosabb környezeti kihívásnak, míg az e-hulladék jóval kisebb figyelmet kap.";
  }
}

function renderEurobarometerQb8(rows) {
  // ÁBRA: QB8 - fizetési hajlandóság fenntarthatóbb/javíthatóbb termékekért.
  // Módszer: igen/nem/bizonytalan válaszmegoszlások országonként.
  // Renderelés: Vega-Lite 100%-os normalizált stacked bar chart.
  const values = eurobarometerRowsForQuestion(rows, "QB8");
  embedPrimary(secondaryCharts.eurobarometerQb8Share, {
    ...primaryBaseSpec(values, 300),
    mark: { type: "bar", cornerRadiusEnd: 3 },
    encoding: {
      y: { field: "orszag", type: "nominal", title: null, sort: ["EU-27", "Románia", "Hollandia"] },
      x: { field: "arany", type: "quantitative", title: "Megoszlás", stack: "normalize", axis: { format: "%" } },
      color: { field: "valasz", type: "nominal", title: "Válasz", sort: { field: "sorrend" } },
      tooltip: [
        { field: "orszag", title: "Ország" },
        { field: "valasz", title: "Válasz" },
        { field: "arany", title: "Arány", format: ".1f" },
      ],
    },
  });

  if (secondaryNotes.eurobarometerQb8Share) {
    secondaryNotes.eurobarometerQb8Share.textContent = "A fenntarthatóbb termékekért való többletfizetés elfogadottsága jelentősen eltér az országok között. A holland válaszadók körében jóval magasabb a fizetési hajlandóság, míg Romániában a megkérdezettek kevesebb mint fele vállalna magasabb árat.";
  }
}

function renderEurobarometerVisualizations(rows) {
  renderEurobarometerQb1(rows);
  renderEurobarometerQb2(rows);
  renderEurobarometerQb6(rows);
  renderEurobarometerQb7(rows);
  renderEurobarometerQb8(rows);
}

async function loadSecondaryData() {
  // MÁSODLAGOS ADATBETÖLTÉS:
  // WEEE, újrahasznosítási ráta és Eurobarometer CSV-k párhuzamos betöltése.
  // A renderelő függvények építik meg az ábránkénti Vega-Lite specifikációkat.
  try {
    const [weeeText, recyclingText, eurobarometerText] = await Promise.all([
      fetchTextFromCandidates(WEEE_DATA_PATHS),
      fetchTextFromCandidates(WEEE_RECYCLING_PATHS),
      fetchTextFromCandidates(EUROBAROMETER_PATHS),
    ]);
    const weeeRows = parseCsv(weeeText);
    const recyclingRows = parseCsv(recyclingText);
    const eurobarometerRows = parseCsv(eurobarometerText);
    renderWeeeCategoryTrend(weeeRows);
    renderWeeeRecyclingTrend(recyclingRows);
    renderWeeeRecyclingRanking(recyclingRows);
    renderEurobarometerVisualizations(eurobarometerRows);
    setupChartDownloadButtons();
  } catch (error) {
    console.error("Másodlagos adatbetöltési hiba:", error);
    const message = window.location.protocol === "file:"
      ? "A másodlagos adatfájlok nem tölthetők be fájlból megnyitva. Nyisd meg GitHub Pages-en vagy indíts helyi webszervert."
      : "A másodlagos adatfájlok nem tölthetők be. Ellenőrizd, hogy a data mappa és a CSV fájlok is fel vannak-e töltve GitHubra.";
    [...Object.values(secondaryCharts), ...Object.values(secondaryNotes)].forEach((element) => {
      if (element) element.textContent = message;
    });
  }
}
