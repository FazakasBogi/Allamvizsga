function normalize(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

async function fetchTextFromCandidates(paths) {
  const candidates = Array.isArray(paths) ? paths : [paths];
  const errors = [];

  for (const path of candidates) {
    try {
      const response = await fetch(path);
      if (response.ok) return response.text();
      errors.push(`${path}: HTTP ${response.status}`);
    } catch (error) {
      errors.push(`${path}: ${error.message}`);
    }
  }

  throw new Error(errors.join(" | "));
}

// CSV-PARSING:
// A fájlokat a böngésző olvassa be. A nehezebb tisztítás és harmonizálás a data/cleaned
// állományok előállításakor, Python/Pandas lépésben történt; itt már renderelhető sorokká alakítjuk őket.
function parseCsv(text) {
  // Egyszerű CSV parser: kezeli az idézőjeleket és a sortöréseket is.
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const headers = rows.shift().map(normalize);
  return rows.map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, normalize(cells[index])]))
  );
}

function groupName(row) {
  return row.country === "Netherlands" ? "Holland minta" : "Romániai minta";
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = normalize(row[key]) || "Nincs válasz";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function percent(count, total) {
  return total ? (count / total) * 100 : 0;
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function getGroupRows(rows, group) {
  return rows.filter((row) => groupName(row) === group);
}

function orderedCategories(attribute, rows) {
  const found = new Set(rows.map((row) => normalize(row[attribute.key])).filter(Boolean));
  const ordered = attribute.order.filter((item) => found.has(item));
  const extra = [...found].filter((item) => !ordered.includes(item)).sort((a, b) => a.localeCompare(b, "hu"));
  return [...ordered, ...extra];
}
