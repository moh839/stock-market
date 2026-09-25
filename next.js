// ---------- Data setup ----------
const stocks = [
  {sym:"AAPL", name:"Apple Inc.", price:214.32, vol:1.2},
  {sym:"MSFT", name:"Microsoft Corp.", price:428.11, vol:1.1},
  {sym:"GOOGL", name:"Alphabet Inc.", price:171.84, vol:1.4},
  {sym:"AMZN", name:"Amazon.com", price:198.55, vol:1.5},
  {sym:"NVDA", name:"NVIDIA Corp.", price:132.67, vol:2.3},
  {sym:"TSLA", name:"Tesla Inc.", price:256.90, vol:2.8},
  {sym:"META", name:"Meta Platforms", price:562.40, vol:1.7},
  {sym:"NFLX", name:"Netflix Inc.", price:712.15, vol:1.6}
];

const indices = [
  {sym:"S&P 500", price:5872.16, vol:0.4},
  {sym:"NASDAQ", price:18541.30, vol:0.6},
  {sym:"DOW", price:42815.90, vol:0.3},
  {sym:"VIX", price:14.62, vol:1.9}
];

const newsItems = [
  {h:"Chipmakers rally as demand outlook improves", s:"MarketWire"},
  {h:"Fed signals steady rates through year-end", s:"Reuters"},
  {h:"Retail sales beat expectations in latest report", s:"Bloomberg"},
  {h:"Tech sector leads broad market gains", s:"CNBC"},
  {h:"Energy stocks slip on falling crude prices", s:"AP"}
];

// ---------- Seed fake historical data ----------
function seedHistory(base, n, vol) {
  let h = [];
  let p = base * (0.94 + Math.random() * 0.05);
  for (let i = 0; i < n; i++) {
    p += (Math.random() - 0.5) * (base * 0.006 * vol);
    h.push(p);
  }
  h[h.length - 1] = base;
  return h;
}
stocks.forEach(s => { s.hist = seedHistory(s.price, 60, s.vol); s.open = s.hist[0]; });
indices.forEach(s => { s.hist = seedHistory(s.price, 60, s.vol); s.open = s.hist[0]; });

let active = stocks[0].sym;
let range = "1D";

// ---------- Helpers ----------
function delta(s) { return s.price - s.open; }
function pct(s) { return (delta(s) / s.open) * 100; }
function fmt(n, d = 2) { return n.toLocaleString(undefined, {minimumFractionDigits: d, maximumFractionDigits: d}); }
function sign(n) { return n >= 0 ? "+" + fmt(n) : fmt(n); }

// ---------- Render: index strip ----------
function renderIndices() {
  document.getElementById("idxStrip").innerHTML = indices.map(s => {
    const cls = delta(s) >= 0 ? "up" : "down";
    return `<div class="idx"><b>${s.sym}</b><span class="chg ${cls}">${fmt(s.price)} ${sign(pct(s))}%</span></div>`;
  }).join("");
}

// ---------- Render: watchlist ----------
function sparkPath(hist, w = 52, h = 22) {
  const min = Math.min(...hist), max = Math.max(...hist);
  const range = (max - min) || 1;
  return hist.map((v, i) => {
    const x = (i / (hist.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return (i === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
  }).join(" ");
}

function renderWatchlist() {
  document.getElementById("watchlist").innerHTML = stocks.map(s => {
    const d = delta(s), cls = d >= 0 ? "up" : "down";
    return `<div class="stock-row ${s.sym === active ? 'active' : ''}" data-sym="${s.sym}">
      <div><div class="sym mono">${s.sym}</div><div class="name">${s.name}</div></div>
      <svg class="spark" viewBox="0 0 52 22"><path d="${sparkPath(s.hist)}" fill="none" stroke="${d >= 0 ? 'var(--up)' : 'var(--down)'}" stroke-width="1.6"/></svg>
      <div class="right"><div class="price mono">${fmt(s.price)}</div><div class="delta mono ${cls}">${sign(pct(s))}%</div></div>
    </div>`;
  }).join("");

  document.querySelectorAll(".stock-row").forEach(el => {
    el.addEventListener("click", () => { active = el.dataset.sym; renderAll(); });
  });
}

// ---------- Render: center chart + stats ----------
function renderCenter() {
  const s = stocks.find(x => x.sym === active);
  const d = delta(s), cls = d >= 0 ? "up" : "down";

  document.getElementById("cSym").textContent = s.sym;
  document.getElementById("cName").textContent = s.name;
  document.getElementById("cPrice").textContent = "$" + fmt(s.price);
  document.getElementById("cDelta").className = "big-delta mono " + cls;
  document.getElementById("cDelta").textContent = sign(d) + " (" + sign(pct(s)) + "%) today";

  drawChart(s.hist, d >= 0);

  const high = Math.max(...s.hist).toFixed(2);
  const low = Math.min(...s.hist).toFixed(2);
  const statData = [
    ["Open", "$" + fmt(s.open)],
    ["Day High", "$" + high],
    ["Day Low", "$" + low],
    ["Volume", (s.vol * 38.2).toFixed(1) + "M"]
  ];
  document.getElementById("statGrid").innerHTML = statData.map(([l, v]) =>
    `<div class="stat"><div class="label">${l}</div><div class="val">${v}</div></div>`).join("");
}

// ---------- Chart drawing (SVG line + area) ----------
function drawChart(hist, isUp) {
  const svg = document.getElementById("chart");
  const w = 700, h = 260, pad = 10;
  const min = Math.min(...hist), max = Math.max(...hist);
  const rng = (max - min) || 1;

  const pts = hist.map((v, i) => {
    const x = (i / (hist.length - 1)) * w;
    const y = pad + (h - 2 * pad) - ((v - min) / rng) * (h - 2 * pad);
    return [x, y];
  });

  const lineD = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const areaD = lineD + ` L${w},${h} L0,${h} Z`;
  const color = isUp ? "var(--up)" : "var(--down)";

  svg.innerHTML = `
    <defs>
      <linearGradient id="fadeGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${isUp ? '#2fd480' : '#f2495c'}" stop-opacity="0.22"/>
        <stop offset="100%" stop-color="${isUp ? '#2fd480' : '#f2495c'}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${areaD}" fill="url(#fadeGrad)" stroke="none"/>
    <path d="${lineD}" fill="none" stroke="${color}" stroke-width="2"/>
    <circle id="hoverDot" r="4" fill="${color}" style="display:none"/>
  `;

  svg._pts = pts;
  svg._hist = hist;
}

// ---------- Chart hover crosshair ----------
function svgHover() {
  const svg = document.getElementById("chart");
  const info = document.getElementById("crossInfo");

  svg.addEventListener("mousemove", e => {
    if (!svg._pts) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 700;
    let idx = Math.round((x / 700) * (svg._pts.length - 1));
    idx = Math.max(0, Math.min(svg._pts.length - 1, idx));

    const p = svg._pts[idx], v = svg._hist[idx];
    const dot = document.getElementById("hoverDot");
    if (dot) {
      dot.style.display = "block";
      dot.setAttribute("cx", p[0]);
      dot.setAttribute("cy", p[1]);
    }
    info.style.opacity = "1";
    info.textContent = "$" + v.toFixed(2);
  });

  svg.addEventListener("mouseleave", () => { info.style.opacity = "0"; });
}

// ---------- Render: order book ----------
function renderOrderBook() {
  const s = stocks.find(x => x.sym === active);
  let rows = "";
  for (let i = 0; i < 6; i++) {
    const bid = (s.price - i * 0.08 - Math.random() * 0.03).toFixed(2);
    const ask = (s.price + i * 0.08 + Math.random() * 0.03).toFixed(2);
    const qty = Math.floor(100 + Math.random() * 900);
    rows += `<div class="ob-row"><span class="bid">${bid}</span><span class="qty">${qty}</span><span class="ask">${ask}</span></div>`;
  }
  document.getElementById("orderBook").innerHTML = rows;
}

// ---------- Render: news ----------
function renderNews() {
  document.getElementById("news").innerHTML = newsItems.map(n =>
    `<div class="news-item">${n.h}<div class="src">${n.s}</div></div>`).join("");
}

// ---------- Clock ----------
function tickClock() {
  const d = new Date();
  document.getElementById("clock").textContent =
    d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'}) + " · Market Open";
}

// ---------- Master render ----------
function renderAll() {
  renderIndices();
  renderWatchlist();
  renderCenter();
  renderOrderBook();
  renderNews();
}

// ---------- Simulate live price ticks ----------
function tick() {
  [...stocks, ...indices].forEach(s => {
    const move = (Math.random() - 0.5) * (s.price * 0.0009 * s.vol);
    s.price = Math.max(0.5, s.price + move);
    s.hist.push(s.price);
    if (s.hist.length > 60) s.hist.shift();
  });
  renderAll();
}

// ---------- Range tab switching ----------
document.getElementById("rangeTabs").addEventListener("click", e => {
  if (e.target.tagName !== "BUTTON") return;
  document.querySelectorAll("#rangeTabs button").forEach(b => b.classList.remove("on"));
  e.target.classList.add("on");
  range = e.target.dataset.r;
  // Range only affects simulated volatility bucket for demo purposes
});

// ---------- Init ----------
svgHover();
renderAll();
tickClock();
setInterval(tick, 1800);
setInterval(tickClock, 1000);