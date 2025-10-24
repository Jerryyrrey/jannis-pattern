/************************************************************
 * 00) HELFER & BOOTSTRAP
 ************************************************************/
const $ = (sel) => document.querySelector(sel);
const exists = (sel) => !!$(sel);

function isIndexPage() {
  return exists("#world") || exists("#p1x");
}
function isAvatarPage() {
  return exists("#heightInput") && exists("#weightInput");
}

/************************************************************
 * 01) UI UTILITIES
 ************************************************************/
function copyPythonCode() {
  const ta = $("#pythonCode");
  if (!ta) return;
  ta.select();
  document.execCommand("copy");
  alert("✅ Python-Code kopiert!");
}

/************************************************************
 * 02) POLYGON (6 Punkte + Kurve P3~>P4)
 ************************************************************/
function getInputPoints() {
  const pts = [];
  for (let i = 1; i <= 6; i++) {
    const xEl = $(`#p${i}x`);
    const yEl = $(`#p${i}y`);
    if (!xEl || !yEl) continue;
    const x = parseFloat(xEl.value);
    const y = parseFloat(yEl.value);
    pts.push([x, y]);
  }
  return pts;
}

function updatePythonPolygon(pointsMM) {
  const py = `import pattern_api

# Erstellt ein Polygon mit 6 Punkten in CLO 3D
points = (
${pointsMM.map(p => `    (${p[0]}, ${p[1]}, 0),`).join("\n")}
)

pattern_api.CreatePatternWithPoints(points)
`;
  const ta = $("#pythonCode");
  if (ta) ta.value = py;
}

function updatePolygon() {
  const world = $("#world");
  if (!world) return;

  const pts = getInputPoints();
  if (pts.length < 6) return;

  // SVG leeren
  while (world.firstChild) world.removeChild(world.firstChild);

  // Pfad: P1->P2->P3, Kurve P3~>P4 (Q), dann P4->P5->P6->Z
  let d = `M ${pts[0][0]} ${pts[0][1]} L ${pts[1][0]} ${pts[1][1]} L ${pts[2][0]} ${pts[2][1]}`;
  const cx = (pts[2][0] + pts[3][0]) / 2;
  const cy = (pts[2][1] + pts[3][1]) / 2;
  d += ` Q ${cx} ${cy} ${pts[3][0]} ${pts[3][1]}`;
  d += ` L ${pts[4][0]} ${pts[4][1]} L ${pts[5][0]} ${pts[5][1]} Z`;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("fill", "#66ccff");
  path.setAttribute("stroke", "#333");
  path.setAttribute("stroke-width", "2");
  world.appendChild(path);

  // Marker
  pts.forEach(([x, y], i) => {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", x);
    c.setAttribute("cy", y);
    c.setAttribute("r", 3.5);
    c.setAttribute("fill", "red");
    world.appendChild(c);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${x + 6}, ${y - 6}) scale(1,-1)`);
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("font-size", "10");
    t.setAttribute("fill", "#333");
    t.textContent = `P${i + 1}`;
    g.appendChild(t);
    world.appendChild(g);
  });

  updatePythonPolygon(pts); // Python mit Original-mm
}

function resetInputs() {
  const defaults = [
    [20, 0],
    [0, 410],
    [55, 665],
    [190, 720],
    [290, 620],
    [290, 0],
  ];
  for (let i = 1; i <= 6; i++) {
    const xEl = $(`#p${i}x`);
    const yEl = $(`#p${i}y`);
    if (!xEl || !yEl) continue;
    xEl.value = defaults[i - 1][0];
    yEl.value = defaults[i - 1][1];
  }
  updatePolygon();
}

/************************************************************
 * 03) AVATAR (Größe/Gewicht + S/M/L)
 ************************************************************/
function determinePatternSize() {
  const heightEl = $("#heightInput");
  const weightEl = $("#weightInput");
  const msg = $("#avatarMessage");
  if (!heightEl || !weightEl || !msg) return;

  const height = parseFloat(heightEl.value);
  const weight = parseFloat(weightEl.value);

  if (!height || !weight) {
    msg.textContent = "⚠️ Bitte Größe und Gewicht eingeben!";
    msg.style.color = "orange";
    return;
  }

  let size = "M";
  if (height < 170) size = "S";
  else if (height >= 170 && height < 180) size = "M";
  else if (height >= 180 && height <= 190) size = "L";
  else size = "nicht definiert";

  localStorage.setItem("avatarHeight", String(height));
  localStorage.setItem("avatarWeight", String(weight));
  localStorage.setItem("patternSize", size);

  msg.textContent = `✅ Gespeichert! Du bekommst das Schnittmuster: ${size}`;
  msg.style.color = "green";
}

function initAvatarFromLocalStorage() {
  const h = localStorage.getItem("avatarHeight");
  const w = localStorage.getItem("avatarWeight");
  if ($("#heightInput") && h) $("#heightInput").value = h;
  if ($("#weightInput") && w) $("#weightInput").value = w;
}

/************************************************************
 * 04) BOOTSTRAP
 ************************************************************/
window.onload = () => {
  if (isIndexPage()) {
    resetInputs(); // zeigt sofort deinen Grundschnitt (SVG + Python)
  }
  if (isAvatarPage()) {
    initAvatarFromLocalStorage();
  }
};
