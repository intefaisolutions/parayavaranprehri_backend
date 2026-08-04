const fs = require("fs");

const path =
  "C:/Users/admin/.cursor/projects/d-IntefAi-paryawaran/agent-tools/a7954d08-799b-4556-a3e2-7c2cae77ac58.txt";
const text = fs.readFileSync(path, "utf8");

const linkName = (s) => {
  const m = String(s).match(/\[([^\]]+)\]/);
  return m ? m[1].trim() : String(s).replace(/\|/g, "").trim();
};

const DISTRICT_ALIASES = {
  "Ashok Nagar": "Ashoknagar",
  Hoshangabad: "Hoshangabad (Narmadapuram)",
  Narmadapuram: "Hoshangabad (Narmadapuram)",
  "Khandwa (East Nimar)": "Khandwa",
  "East Nimar": "Khandwa",
  "West Nimar": "Khargone",
  "Khargone (West Nimar)": "Khargone",
};

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const rows = [];
let currentDistrict = "";

for (const line of text.split(/\r?\n/)) {
  if (!/^\|\d+\|/.test(line)) continue;
  const cells = line
    .split("|")
    .map((c) => c.trim())
    .filter((c, i, a) => !(i === 0 || (i === a.length - 1 && c === "")));

  if (cells.length < 2) continue;
  const num = Number(cells[0]);
  if (!Number.isFinite(num)) continue;

  const name = linkName(cells[1]);
  let district = "";
  for (let i = 2; i < cells.length; i++) {
    const c = cells[i];
    if (/_district/.test(c)) {
      district = linkName(c).replace(/\s*district$/i, "").trim();
      break;
    }
  }
  if (district) currentDistrict = district;
  else district = currentDistrict;
  if (!name || !district) continue;

  const mapped = DISTRICT_ALIASES[district] || district;
  rows.push({
    id: `mp-${num}-${slug(name)}`,
    country: "India",
    state: "Madhya Pradesh",
    district: mapped,
    name,
    assemblyNumber: num,
    boundary: null,
  });
}

const byDist = {};
for (const r of rows) byDist[r.district] = (byDist[r.district] || 0) + 1;

const out =
  "d:/IntefAi/paryawaran/parayavaranprehri_backend/src/geo/data/mp-constituencies.json";
fs.writeFileSync(out, JSON.stringify(rows, null, 2));
console.log(
  JSON.stringify(
    {
      parsed: rows.length,
      districts: Object.keys(byDist).length,
      sampleDistricts: Object.entries(byDist)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(0, 15),
      dewas: rows.filter((r) => r.district === "Dewas").map((r) => r.name),
      ujjain: rows.filter((r) => r.district === "Ujjain").map((r) => r.name),
    },
    null,
    2,
  ),
);
