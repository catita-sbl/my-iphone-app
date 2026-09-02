const LABEL = { mimica: 'Mímica', situacao: 'Murphy', resposta: 'Podia', dilema: 'Dilema' };
let DECK = [], pile = [], drawn = 0;

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function cardHTML(c, i, eager) {
  const n = String(i + 1).padStart(3, '0');
  if (c.tipo === 'situacao') {
    return `<div class="card t-situacao">
      <div class="head"><span class="tag">Murphy</span><span class="num">${n}</span></div>
      <div class="sit-cap">${esc(c.cap)}</div>
      <div class="pic"><img src="${c.img}" alt="" loading="${eager ? 'eager' : 'lazy'}"></div>
      <div class="worse">Mas podia ser pior…</div>
    </div>`;
  }
  if (c.tipo === 'resposta') {
    return `<div class="card t-resposta">
      <div class="head"><span class="tag">Podia</span><span class="num">${n}</span></div>
      <div class="body"><div class="res"><b>Podia</b> ${esc(c.txt)}</div></div>
      <div class="worse">Mas podia ser pior…</div>
    </div>`;
  }
  if (c.tipo === 'dilema') {
    return `<div class="card t-dilema">
      <div class="head"><span class="tag">Dilema</span><span class="num">${n}</span></div>
      <div class="body">
        <div class="q">${esc(c.q)}</div>
        <div class="opts">
          <div class="opt"><b>A</b><span>${esc(c.a)}</span></div>
          <div class="opt"><b>B</b><span>${esc(c.b)}</span></div>
          <div class="opt"><b>C</b><span>${esc(c.c)}</span></div>
        </div>
      </div>
      <div class="foot-mark">Pires de Baratas</div>
    </div>`;
  }
  return `<div class="card t-${c.tipo}">
    <div class="head"><span class="tag">${LABEL[c.tipo]}</span><span class="num">${n}</span></div>
    <div class="pic"><img src="${c.img}" alt="" loading="${eager ? 'eager' : 'lazy'}"></div>
    <div class="body">
      <div class="cap">${esc(c.cap)}</div>
      <div class="sub">${esc(c.sub)}</div>
    </div>
  </div>`;
}

const backHTML = () => `<div class="card back">
  <svg class="bl" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="22" r="12" stroke="currentColor" stroke-width="2.5"/>
    <path d="M4 22h32" stroke="currentColor" stroke-width="2.5"/>
    <path d="M20 10V3M13 12l-4-6M27 12l4-6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="16" cy="20" r="1.8" fill="currentColor"/><circle cx="24" cy="20" r="1.8" fill="currentColor"/>
  </svg>
  <div class="bt">PIRES DE<br>BARATAS</div>
  <div class="bs">humor adulto</div>
</div>`;

/* ---------- tabs ---------- */
document.getElementById('tabs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  document.querySelectorAll('#tabs button').forEach(x => x.classList.toggle('on', x === b));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === 'v-' + b.dataset.view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ---------- jogar ---------- */
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0;[a[i], a[j]] = [a[j], a[i]]; } return a; };

function activeTypes() {
  return [...document.querySelectorAll('#playFilters input:checked')].map(i => i.value);
}
function rebuildPile() {
  const t = activeTypes();
  pile = shuffle(DECK.map((c, i) => ({ c, i })).filter(o => t.includes(o.c.tipo)));
  drawn = 0; updateCounter();
}
function updateCounter() {
  document.getElementById('counter').textContent = pile.length
    ? `${drawn} de ${drawn + pile.length} cartas tiradas`
    : (drawn ? 'baralho esgotado — embaralha de novo' : 'escolhe pelo menos um tipo de carta');
}
let chainUsed = [];
function worseBtn() { return document.getElementById('worse'); }
function addWorse() {
  const stage = document.getElementById('stage');
  const pool = DECK.map((c, i) => ({ c, i })).filter(o => o.c.tipo === 'resposta' && !chainUsed.includes(o.i));
  if (!pool.length) return;
  const o = pool[Math.random() * pool.length | 0];
  chainUsed.push(o.i);
  const wrap = document.createElement('div');
  wrap.className = 'card-scale pop';
  wrap.innerHTML = cardHTML(o.c, o.i);
  (stage.querySelector('.chain') || stage).appendChild(wrap);
  if (chainUsed.length >= 4) worseBtn().disabled = true;
  wrap.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
worseBtn().addEventListener('click', addWorse);

function draw() {
  const stage = document.getElementById('stage');
  if (!pile.length) { rebuildPile(); if (!pile.length) { stage.innerHTML = `<div class="empty">Escolhe pelo menos um tipo de carta.</div>`; updateCounter(); return; } }
  const o = pile.pop(); drawn++;
  chainUsed = [];
  const w = worseBtn();
  if (o.c.tipo === 'situacao') { w.hidden = false; w.disabled = false; }
  else { w.hidden = true; }
  stage.innerHTML = `<div class="chain"><div class="card-scale pop">${cardHTML(o.c, o.i)}</div></div>`;
  updateCounter();
  if (typeof tReset === 'function') {
    tReset();
    if (o.c.tipo === 'mimica' && T.auto.checked) tStart();
  }
}
document.getElementById('draw').addEventListener('click', draw);
document.getElementById('reshuffle').addEventListener('click', () => { rebuildPile(); worseBtn().hidden = true; document.getElementById('stage').innerHTML = `<div class="card-scale">${backHTML()}</div>`; });
document.getElementById('playFilters').addEventListener('change', rebuildPile);
document.addEventListener('keydown', e => { if (e.code === 'Space' && document.getElementById('v-jogar').classList.contains('on')) { e.preventDefault(); draw(); } });

/* ---------- baralho ---------- */
function renderGrid(filter) {
  const grid = document.getElementById('grid');
  grid.innerHTML = DECK.map((c, i) => ({ c, i }))
    .filter(o => filter === 'todos' || o.c.tipo === filter)
    .map(o => `<div class="cell"><div class="cell-box"><div class="card-scale">${cardHTML(o.c, o.i)}</div></div></div>`).join('');
}
document.getElementById('deckFilters').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  document.querySelectorAll('#deckFilters .chip').forEach(x => x.classList.toggle('on', x === b));
  renderGrid(b.dataset.f);
});

/* ---------- imprimir ---------- */
let printFilter = 'todos';
function renderSheets() {
  const list = DECK.map((c, i) => ({ c, i })).filter(o => printFilter === 'todos' || o.c.tipo === printFilter);
  const withBacks = document.getElementById('backs').checked;
  let html = '';
  for (let p = 0; p < list.length; p += 9) {
    const page = list.slice(p, p + 9);
    html += `<div class="sheet">${page.map(o => `<div class="slot">${cardHTML(o.c, o.i, true)}</div>`).join('')}
      ${Array.from({ length: 9 - page.length }, () => '<div class="slot"></div>').join('')}</div>`;
  }
  if (withBacks) html += `<div class="sheet">${Array.from({ length: 9 }, () => `<div class="slot">${backHTML()}</div>`).join('')}</div>`;
  document.getElementById('sheets').innerHTML = html;
}
document.getElementById('printFilters').addEventListener('click', e => {
  const b = e.target.closest('.chip'); if (!b) return;
  document.querySelectorAll('#printFilters .chip').forEach(x => x.classList.toggle('on', x === b));
  printFilter = b.dataset.f; renderSheets();
});
document.getElementById('backs').addEventListener('change', renderSheets);
document.getElementById('print').addEventListener('click', () => window.print());

/* ---------- boot ---------- */
fetch('deck.json').then(r => r.json()).then(d => {
  DECK = d;
  const counts = { todos: d.length, mimica: 0, situacao: 0, resposta: 0, dilema: 0 };
  d.forEach(c => counts[c.tipo]++);
  document.querySelectorAll('#deckFilters .chip').forEach(ch => ch.querySelector('span').textContent = counts[ch.dataset.f]);
  document.getElementById('stage').innerHTML = `<div class="card-scale">${backHTML()}</div>`;
  rebuildPile(); renderGrid('todos'); renderSheets();
});

/* ---------- cronómetro 60s ---------- */
const T = {
  total: 60, left: 60, id: null, ac: null,
  el: document.getElementById('timer'),
  num: document.getElementById('tnum'),
  ring: document.getElementById('tprog'),
  btn: document.getElementById('tstart'),
  auto: document.getElementById('tauto'),
  snd: document.getElementById('tsound')
};
const RING = 2 * Math.PI * 52;
T.ring.style.strokeDasharray = RING;

function fmt(s) { return s >= 100 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : String(s); }
function paint() {
  T.num.textContent = T.left > 0 ? fmt(T.left) : 'STOP';
  T.ring.style.strokeDashoffset = RING * (1 - T.left / T.total);
  T.el.classList.toggle('warn', T.left > 0 && T.left <= 10);
  T.el.classList.toggle('over', T.left === 0);
  T.btn.classList.toggle('running', !!T.id);
  T.btn.textContent = T.id ? 'Parar' : (T.left === T.total ? `Iniciar ${fmt(T.total)}${T.total < 100 ? 's' : ''}` : 'Continuar');
}
function beep(freq, dur, vol) {
  if (!T.snd.checked) return;
  try {
    T.ac = T.ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = T.ac.createOscillator(), g = T.ac.createGain();
    o.type = 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, T.ac.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, T.ac.currentTime + dur);
    o.connect(g).connect(T.ac.destination); o.start(); o.stop(T.ac.currentTime + dur);
  } catch (e) {}
}
function buzz(ms) { if (T.snd.checked && navigator.vibrate) navigator.vibrate(ms); }
function tStop() { if (T.id) { clearInterval(T.id); T.id = null; } paint(); }
function tReset(sec) {
  tStop();
  if (sec) T.total = sec;
  T.left = T.total; T.el.classList.remove('warn', 'over'); paint();
}
function tStart() {
  if (T.id) { tStop(); return; }
  if (T.left === 0) T.left = T.total;
  if (T.snd.checked) { try { T.ac = T.ac || new (window.AudioContext || window.webkitAudioContext)(); T.ac.resume(); } catch (e) {} }
  beep(880, .09, .18);
  paint();
  T.id = setInterval(() => {
    T.left--;
    if (T.left <= 5 && T.left > 0) { beep(660, .07, .16); buzz(40); }
    if (T.left <= 0) {
      T.left = 0; clearInterval(T.id); T.id = null;
      beep(180, .8, .3); setTimeout(() => beep(140, .9, .3), 320); buzz([250, 120, 400]);
    }
    paint();
  }, 1000);
  paint();
}
T.btn.addEventListener('click', tStart);
document.getElementById('treset').addEventListener('click', () => tReset());
document.querySelector('.timer-set').addEventListener('click', e => {
  const p = e.target.closest('.pill'); if (!p) return;
  document.querySelectorAll('.timer-set .pill').forEach(x => x.classList.toggle('on', x === p));
  tReset(+p.dataset.sec);
});
document.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 't' && document.getElementById('v-jogar').classList.contains('on')
      && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); tStart(); }
});
tReset(60);
