/*
  Kódfelépítés röviden:
  - webpage/script.js: rövid main fájl, csak az inicializáló hívásokkal.
  - webpage/js/config.js: DOM-hivatkozások, adatútvonalak, kérdés- és kategóriakonfigurációk.
  - webpage/js/data-utils.js: CSV-parsing és közös segédfüggvények.
  - webpage/js/demography.js: demográfiai ábrák és Cramér V háttérszámítás.
  - webpage/js/primary-*.js: primer indexképzés, algoritmusok és ábracsoportok.
  - webpage/js/secondary-visualizations.js: WEEE és Eurobarometer másodlagos ábrák.
  - webpage/js/app-data.js: adatbetöltés és renderelési pipeline.
  - webpage/js/canvas-nav.js: nyitó canvas animáció és aktív navigáció.
  - webpage/charts/*.js: ábránként külön leíró metaanyag és algoritmusmagyarázat.

  Informatikai módszertani logika:
  1. Python/Pandas előkészítés: a data/cleaned CSV-k már tisztított, harmonizált adatok.
     Ide tartozik az előzetes adatjavítás, mezőnevek egységesítése és a Eurobarometer CSV előállítása.
  2. Böngészős JS aggregáció/indexképzés: itt készülnek a mintán belüli arányok, átlagok,
     Likert-indexek, kvartilisek és a vizualizációhoz szükséges köztes táblák.
  3. Egyéb algoritmusok: a Cramér V és a Pearson r JavaScriptben számolódik.
     A KMeans klaszterezést a cluster_analysis.py végzi Scikit-learnnel; az eredmény
     a master_dataset_clustered.csv cluster oszlopából kerül a weboldalra.
  4. Vega-Lite specifikációk: a legtöbb ábra mark/encoding/transform objektumként készül,
     majd a vegaEmbed rajzolja ki. Kivétel: a pókháló ábra és a nyitó animáció saját SVG/canvas rajzolás.
*/

const canvas = document.querySelector("#cycleCanvas");
const year = document.querySelector("#year");
const navLinks = [...document.querySelectorAll(".nav a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const sourceBars = document.querySelector("#sourceBars");
const groupCounts = document.querySelector("#groupCounts");
const attributeControls = document.querySelector("#attributeControls");
const comparisonChart = document.querySelector("#comparisonChart");
const profileCards = document.querySelector("#profileCards");
const conclusions = document.querySelector("#conclusions");
const totalResponses = document.querySelector("#totalResponses");
const primaryRadarProduct = document.querySelector("#primaryRadarProduct");
const primaryProfileViewToggle = document.querySelector("#primaryProfileViewToggle");
const primaryBarrierViewToggle = document.querySelector("#primaryBarrierViewToggle");
const primaryMotivationViewToggle = document.querySelector("#primaryMotivationViewToggle");
const primaryDisposalViewToggle = document.querySelector("#primaryDisposalViewToggle");
const metricGroupingTable = document.querySelector("#metricGroupingTable");
const primaryCharts = {
  valueDimensions: document.querySelector("#primaryValueDimensions"),
  brokenPhoneDisposal: document.querySelector("#primaryBrokenPhoneDisposal"),
  educationProgram: document.querySelector("#primaryEducationProgram"),
  usedPurchase: document.querySelector("#primaryUsedPurchase"),
  alternativeConsumption: document.querySelector("#primaryAlternativeConsumption"),
  repairWillingness: document.querySelector("#primaryRepairWillingness"),
  futureDisposal: document.querySelector("#primaryFutureDisposal"),
  radar: document.querySelector("#primaryRadar"),
  heatmap: document.querySelector("#primaryHeatmap"),
  histogram: document.querySelector("#primaryHistogram"),
  bubble: document.querySelector("#primaryBubble"),
  candles: document.querySelector("#primaryCandles"),
  correlation: document.querySelector("#primaryCorrelation"),
  clusterProfile: document.querySelector("#primaryClusterProfile"),
  barrierChoice: document.querySelector("#primaryBarrierChoice"),
  motivationChoice: document.querySelector("#primaryMotivationChoice"),
  dropoffKnowledge: document.querySelector("#primaryDropoffKnowledge"),
  disposalPath: document.querySelector("#primaryDisposalPath"),
  repairQuality: document.querySelector("#primaryRepairQuality"),
  selfRepair: document.querySelector("#primarySelfRepair"),
};
const primaryNotes = {
  valueDimensions: document.querySelector("#primaryValueDimensionsNote"),
  brokenPhoneDisposal: document.querySelector("#primaryBrokenPhoneDisposalNote"),
  educationProgram: document.querySelector("#primaryEducationProgramNote"),
  usedPurchase: document.querySelector("#primaryUsedPurchaseNote"),
  alternativeConsumption: document.querySelector("#primaryAlternativeConsumptionNote"),
  repairWillingness: document.querySelector("#primaryRepairWillingnessNote"),
  futureDisposal: document.querySelector("#primaryFutureDisposalNote"),
  radar: document.querySelector("#primaryRadarNote"),
  heatmap: document.querySelector("#primaryHeatmapNote"),
  histogram: document.querySelector("#primaryHistogramNote"),
  bubble: document.querySelector("#primaryBubbleNote"),
  candles: document.querySelector("#primaryCandlesNote"),
  correlation: document.querySelector("#primaryCorrelationNote"),
  clusterProfile: document.querySelector("#primaryClusterProfileNote"),
  barrierChoice: document.querySelector("#primaryBarrierChoiceNote"),
  motivationChoice: document.querySelector("#primaryMotivationChoiceNote"),
  disposalPath: document.querySelector("#primaryDisposalPathNote"),
  repairQuality: document.querySelector("#primaryRepairQualityNote"),
  selfRepair: document.querySelector("#primarySelfRepairNote"),
};
const secondaryCharts = {
  categoryTrend: document.querySelector("#weeeCategoryTrend"),
  recyclingTrend: document.querySelector("#weeeRecyclingTrend"),
  recyclingRanking: document.querySelector("#weeeRecyclingRanking"),
  eurobarometerQb1NestedPie: document.querySelector("#eurobarometerQb1NestedPie"),
  eurobarometerQb2Columns: document.querySelector("#eurobarometerQb2Columns"),
  eurobarometerQb6Stacked: document.querySelector("#eurobarometerQb6Stacked"),
  eurobarometerQb7Dots: document.querySelector("#eurobarometerQb7Dots"),
  eurobarometerQb8Share: document.querySelector("#eurobarometerQb8Share"),
};
const secondaryNotes = {
  categoryTrend: document.querySelector("#weeeCategoryTrendNote"),
  recyclingTrend: document.querySelector("#weeeRecyclingTrendNote"),
  recyclingRanking: document.querySelector("#weeeRecyclingRankingNote"),
  eurobarometerQb1NestedPie: document.querySelector("#eurobarometerQb1NestedPieNote"),
  eurobarometerQb2Columns: document.querySelector("#eurobarometerQb2ColumnsNote"),
  eurobarometerQb6Stacked: document.querySelector("#eurobarometerQb6StackedNote"),
  eurobarometerQb7Dots: document.querySelector("#eurobarometerQb7DotsNote"),
  eurobarometerQb8Share: document.querySelector("#eurobarometerQb8ShareNote"),
};

const DATA_PATH = "../data/cleaned/master_dataset_clustered.csv";
const WEEE_DATA_PATH = "../data/weee_data.csv";
const WEEE_RECYCLING_PATH = "../data/weee_recycling rate.csv";
const EUROBAROMETER_PATH = "../data/cleaned/eurobarometer_sp550_ro_nl_eu.csv";
const DATA_PATHS = [
  DATA_PATH,
  "data/cleaned/master_dataset_clustered.csv",
  "./data/cleaned/master_dataset_clustered.csv",
];
const WEEE_DATA_PATHS = [
  WEEE_DATA_PATH,
  "data/weee_data.csv",
  "./data/weee_data.csv",
];
const WEEE_RECYCLING_PATHS = [
  WEEE_RECYCLING_PATH,
  "data/weee_recycling%20rate.csv",
  "data/weee_recycling rate.csv",
  "./data/weee_recycling%20rate.csv",
  "./data/weee_recycling rate.csv",
];
const EUROBAROMETER_PATHS = [
  EUROBAROMETER_PATH,
  "data/cleaned/eurobarometer_sp550_ro_nl_eu.csv",
  "./data/cleaned/eurobarometer_sp550_ro_nl_eu.csv",
];

// ADATFORRÁSOK:
// - DATA_PATH: Python/Pandas által tisztított, Scikit-learnnel klaszterezett primer adatbázis.
// - WEEE_DATA_PATH és WEEE_RECYCLING_PATH: Eurostat/WEEE másodlagos CSV-k.
// - EUROBAROMETER_PATH: a két PDF alapján létrehozott, tisztított Eurobarometer CSV.
const GROUPS = ["Romániai minta", "Holland minta"];
const GROUP_COLORS = {
  "Romániai minta": "#b66f45",
  "Holland minta": "#2f7f7b",
};
const BUBBLE_GROUP_COLORS = {
  "Romániai minta": "#b66f45",
  "Holland minta": "#2f7f7b",
};
const COMPARISON_COLORS = {
  romania: "#b66f45",
  netherlands: "#2f7f7b",
  eu: "#52635d",
};
const sourceLabels = {
  Hungary: "Magyar kitöltés",
  Romania: "Román kitöltés",
  Netherlands: "Holland kitöltés",
};

const attributes = [
  { key: "age", label: "Életkor", order: ["18 - 24", "25 - 34", "35 - 44", "45 - 65"] },
  { key: "gender", label: "Nem", order: ["Nő", "Férfi", "Egyéb / nem kíván válaszolni"] },
  {
    key: "education",
    label: "Végzettség",
    order: [
      "Középiskola / Érettségi",
      "Szakképesítés",
      "Főiskola / Egyetemi diploma (BA/BSc)",
      "Mesterképzés vagy magasabb (MA/MSc/PhD)",
    ],
  },
  {
    key: "residence",
    label: "Lakóhely",
    order: [
      "Nagyváros (100 000 lakos fölött)",
      "Város (20 000 - 100 000 lakos)",
      "Kisváros / Község (20 000 lakos alatt)",
      "Vidéki terület / falu",
    ],
  },
  {
    key: "household_size",
    label: "Háztartásméret",
    order: ["1 fő (egyedül élek)", "2 fő", "3-4 fő", "5 vagy több fő"],
  },
  {
    key: "household_income_eur",
    label: "Jövedelem",
    order: ["600 € alatt", "600–1 000 €", "1 001–1 600 €", "1 601–2 400 €", "2 400 € felett", "Nem kívánok válaszolni"],
  },
  {
    key: "occupation",
    label: "Foglalkozás",
    order: ["Tanuló / Hallgató", "Alkalmazott", "Vállalkozó", "Háztartásbeli", "Munkanélküli / Álláskereső"],
  },
];

const scaleMetrics = [
  { key: "attitude", label: "Környezeti attitűd", fields: ["q01_env_concern", "q02_nem_harm_decisions", "q03_follow_nemrms", "q04_sustainable_society"] },
  { key: "replacement", label: "Cseregyakoriság", fields: ["q09_replace_frequency_large_household", "q09_replace_frequency_personal_it", "q09_replace_frequency_small"] },
  { key: "rentShare", label: "Bérlés/megosztás nyitottság", fields: ["q14_open_to_rent_share_large_household", "q14_open_to_rent_share_personal_it", "q14_open_to_rent_share_small"] },
  { key: "durability", label: "Tartósság fontossága", fields: ["q15_importance_durability_large_household", "q15_importance_durability_personal_it", "q15_importance_durability_small"] },
  { key: "repair", label: "Javítási rutin", fields: ["q16_usually_repair_large_household", "q16_usually_repair_personal_it", "q16_usually_repair_small"] },
  { key: "fullRepair", label: "Teljes javítás elfogadása", fields: ["q22_willing_after_full_repair_large_household", "q22_willing_after_full_repair_personal_it", "q22_willing_after_full_repair_small"] },
  { key: "imperfectRepair", label: "Tökéletlen javítás elfogadása", fields: ["q23_willing_after_imperfect_repair_large_household", "q23_willing_after_imperfect_repair_personal_it", "q23_willing_after_imperfect_repair_small"] },
  { key: "futureDisposal", label: "Jövőbeni felelős leadás", fields: ["q30_willing_future_disposal"] },
];

const productCategories = [
  { key: "all", label: "Minden", index: null },
  { key: "large", label: "Nagy eszközök", index: 0 },
  { key: "personalIt", label: "Személyes IT", index: 1 },
  { key: "small", label: "Kis eszközök", index: 2 },
];

const attitudeItems = [
  { key: "q01_env_concern", label: "Környezeti aggodalom" },
  { key: "q02_nem_harm_decisions", label: "Döntések környezeti hatása" },
  { key: "q03_follow_nemrms", label: "Normakövetés" },
  { key: "q04_sustainable_society", label: "Fenntartható társadalom" },
];

const metricQuestionTexts = {
  q01_env_concern: "Aggaszt, ha a természeti környezet károsodik, még akkor is, ha ez engem közvetlenül nem érint.",
  q02_nem_harm_decisions: "Fontosnak tartom, hogy a döntéseimmel ne okozzak kárt a körülöttem élőknek vagy a jövő generációknak.",
  q03_follow_nemrms: "Igyekszem olyan szabályokat és normákat követni, amelyek a közösség vagy a társadalom egészének javát szolgálják.",
  q04_sustainable_society: "Fontosnak tartom, hogy a társadalom fenntartható és stabil keretek között működjön a jövőben is.",
  q09_replace_frequency_large_household: "Milyen gyakran cseréled le az alábbi eszközöket anélkül, hogy teljesen tönkrementek volna? Nagy háztartási gépek.",
  q09_replace_frequency_personal_it: "Milyen gyakran cseréled le az alábbi eszközöket anélkül, hogy teljesen tönkrementek volna? Személyes IT eszközök.",
  q09_replace_frequency_small: "Milyen gyakran cseréled le az alábbi eszközöket anélkül, hogy teljesen tönkrementek volna? Kis eszközök.",
  q14_open_to_rent_share_large_household: "Mennyire lennél nyitott arra, hogy a jövőben egy elektronikai eszközt bérelj vagy megosztva használj tulajdonlás helyett? Nagy háztartási gépek.",
  q14_open_to_rent_share_personal_it: "Mennyire lennél nyitott arra, hogy a jövőben egy elektronikai eszközt bérelj vagy megosztva használj tulajdonlás helyett? Személyes IT eszközök.",
  q14_open_to_rent_share_small: "Mennyire lennél nyitott arra, hogy a jövőben egy elektronikai eszközt bérelj vagy megosztva használj tulajdonlás helyett? Kis eszközök.",
  q15_importance_durability_large_household: "Fontosnak tartod vásárláskor, hogy egy eszköz mennyire tartós vagy könnyen javítható? Nagy háztartási gépek.",
  q15_importance_durability_personal_it: "Fontosnak tartod vásárláskor, hogy egy eszköz mennyire tartós vagy könnyen javítható? Személyes IT eszközök.",
  q15_importance_durability_small: "Fontosnak tartod vásárláskor, hogy egy eszköz mennyire tartós vagy könnyen javítható? Kis eszközök.",
  q16_usually_repair_large_household: "Ha egy elektronikai eszköz meghibásodik, általában megjavíttatod? Nagy háztartási gépek.",
  q16_usually_repair_personal_it: "Ha egy elektronikai eszköz meghibásodik, általában megjavíttatod? Személyes IT eszközök.",
  q16_usually_repair_small: "Ha egy elektronikai eszköz meghibásodik, általában megjavíttatod? Kis eszközök.",
  q22_willing_after_full_repair_large_household: "Mennyire vagy hajlandó egy elektronikai eszközt teljes mértékben megjavíttatva tovább használni? Nagy háztartási gépek.",
  q22_willing_after_full_repair_personal_it: "Mennyire vagy hajlandó egy elektronikai eszközt teljes mértékben megjavíttatva tovább használni? Személyes IT eszközök.",
  q22_willing_after_full_repair_small: "Mennyire vagy hajlandó egy elektronikai eszközt teljes mértékben megjavíttatva tovább használni? Kis eszközök.",
  q23_willing_after_imperfect_repair_large_household: "Mennyire vagy hajlandó egy elektronikai eszközt megjavíttatva, viszont kisebb fennmaradó hibák mellett tovább használni? Nagy háztartási gépek.",
  q23_willing_after_imperfect_repair_personal_it: "Mennyire vagy hajlandó egy elektronikai eszközt megjavíttatva, viszont kisebb fennmaradó hibák mellett tovább használni? Személyes IT eszközök.",
  q23_willing_after_imperfect_repair_small: "Mennyire vagy hajlandó egy elektronikai eszközt megjavíttatva, viszont kisebb fennmaradó hibák mellett tovább használni? Kis eszközök.",
  q21_fix_minemr_yourself: "Hajlandó lennél kisebb hibát önállóan megjavítani?",
  q30_willing_future_disposal: "A jövőben hajlandó lennél-e többet tenni az elektronikai eszközeid megfelelő leadásáért?",
};

const behaviorMetrics = scaleMetrics.filter((metric) => metric.key !== "attitude");

const multiChoiceQuestions = [
  { key: "q20_repair_motivation", label: "Javítási motivációk", product: "Minden" },
  { key: "q28_dropoff_motivation", label: "Leadási motivációk", product: "Minden" },
  { key: "q29_dropoff_barrier", label: "Leadási akadályok", product: "Minden" },
  { key: "q19_large_nemt_repair_reason", label: "Nagy eszköz javítási akadály", product: "Nagy eszközök" },
  { key: "q18_it_nemt_repair_reason", label: "IT eszköz javítási akadály", product: "Személyes IT" },
  { key: "q17_small_nemt_repair_reason", label: "Kis eszköz javítási akadály", product: "Kis eszközök" },
  { key: "q11", label: "Nagy eszköz életciklus vége", product: "Nagy eszközök" },
  { key: "q25_it_end_of_life", label: "IT eszköz életciklus vége", product: "Személyes IT" },
  { key: "q24_small_end_of_life", label: "Kis eszköz életciklus vége", product: "Kis eszközök" },
];

const educationScores = {
  "Középiskola / Érettségi": 1,
  "Szakképesítés": 2,
  "Főiskola / Egyetemi diploma (BA/BSc)": 3,
  "Mesterképzés vagy magasabb (MA/MSc/PhD)": 4,
};

const incomeScores = {
  "600 € alatt": 1,
  "600–1 000 €": 2,
  "1 001–1 600 €": 3,
  "1 601–2 400 €": 4,
  "2 400 € felett": 5,
};

const residenceScores = {
  "Vidéki terület / falu": 1,
  "Kisváros / Község (20 000 lakos alatt)": 2,
  "Város (20 000 - 100 000 lakos)": 3,
  "Nagyváros (100 000 lakos fölött)": 4,
};

let selectedAttribute = attributes[0].key;
let surveyRows = [];
let primaryBarrierView = "top";
let primaryMotivationView = "top";
let primaryDisposalView = "top";

if (year) {
  year.textContent = new Date().getFullYear();
}

Object.assign(window, {
  canvas,
  year,
  navLinks,
  sections,
  sourceBars,
  groupCounts,
  attributeControls,
  comparisonChart,
  profileCards,
  conclusions,
  totalResponses,
  primaryRadarProduct,
  primaryProfileViewToggle,
  primaryBarrierViewToggle,
  primaryMotivationViewToggle,
  primaryDisposalViewToggle,
  metricGroupingTable,
  primaryCharts,
  primaryNotes,
  secondaryCharts,
  secondaryNotes,
  DATA_PATH,
  WEEE_DATA_PATH,
  WEEE_RECYCLING_PATH,
  EUROBAROMETER_PATH,
  DATA_PATHS,
  WEEE_DATA_PATHS,
  WEEE_RECYCLING_PATHS,
  EUROBAROMETER_PATHS,
  GROUPS,
  GROUP_COLORS,
  BUBBLE_GROUP_COLORS,
  COMPARISON_COLORS,
  sourceLabels,
  attributes,
  selectedAttribute,
  surveyRows,
  primaryBarrierView,
  primaryMotivationView,
  primaryDisposalView,
  productCategories,
  scaleMetrics,
  metricQuestionTexts,
  attitudeItems,
  behaviorMetrics,
  multiChoiceQuestions,
  educationScores,
  incomeScores,
  residenceScores,
});
