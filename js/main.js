// Kaldi Café · landing

const root = document.documentElement;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const conMouse = matchMedia('(hover: hover)').matches;

/* ---------- la hora del local (también ?momento=dia|noche para mostrarla en el pitch) ---------- */
const q = new URLSearchParams(location.search).get('momento');
const ahoraBA = () => {
  const p = new Intl.DateTimeFormat('es-AR', { hour: 'numeric', minute: 'numeric', weekday: 'short', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' }).formatToParts(new Date());
  const v = k => p.find(x => x.type === k)?.value;
  return { h: +v('hour') % 24, m: +v('minute'), dom: /dom/i.test(v('weekday')), sab: /s[aá]b/i.test(v('weekday')) };
};
const T = ahoraBA();
const abre = T.dom ? 9 : 8;
let abierto = (T.h + T.m / 60) >= abre && T.h < 20;
if (q === 'dia') abierto = true; if (q === 'noche') abierto = false;
const estadoCorto = abierto ? 'Abierto ahora · hasta las 20:00 hs' : `Cerrado · abre ${T.h >= 20 ? 'mañana' : 'hoy'} a las ${T.h >= 20 ? (T.sab ? 9 : 8) : abre}:00 hs`;
$$('[data-estado], [data-estado-largo]').forEach(e => e.textContent = estadoCorto);
if (!abierto) { $$('.placa2 i').forEach(i => i.style.background = '#9a3b2f'); $('.horarios .ahora')?.classList.add('cerrado'); }
const ev = $('[data-estado-vent]'); if (ev) ev.textContent = abierto ? 'Hoy la ventanita está abierta hasta las 20:00 hs.' : 'Ahora está cerrada: lo podés dejar pedido para cuando abra.';

/* ---------- 1 · el cartel: letras con sombra que sigue la luz ---------- */
const muro = $('.muro');
if (muro) {
  const letras = $('.letras', muro);
  const tecla = $('.tecla', muro);
  let lx = .25, ly = .1, tx = lx, ty = ly, raf = 0, tocado = false;
  function sombra() {
    raf = 0;
    lx += (tx - lx) * .12; ly += (ty - ly) * .12;
    const r = letras.getBoundingClientRect(), m = muro.getBoundingClientRect();
    const fs = parseFloat(getComputedStyle(letras).fontSize);
    const prof = Math.max(3, Math.round(fs / 40));
    const noche = muro.classList.contains('noche');
    const cx = (r.left + r.width / 2 - m.left) / m.width, cy = (r.top + r.height / 2 - m.top) / m.height;
    let dx = cx - lx, dy = cy - ly; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const largo = Math.min(1.4, .45 + d) * fs * .16;
    const capas = [];
    for (let i = 1; i <= prof; i++) capas.push(`${(dx * i).toFixed(1)}px ${(dy * i).toFixed(1)}px 0 ${noche ? '#7a5427' : '#121a2c'}`);
    if (noche) capas.push(`0 0 ${(fs * .12).toFixed(0)}px rgba(243,190,110,.55)`, `0 0 ${(fs * .3).toFixed(0)}px rgba(243,170,80,.35)`);
    else {
      capas.push(`${(dx * largo * .5).toFixed(1)}px ${(dy * largo * .5).toFixed(1)}px ${(fs * .03).toFixed(1)}px rgba(60,40,20,.28)`);
      capas.push(`${(dx * largo).toFixed(1)}px ${(dy * largo).toFixed(1)}px ${(fs * .09).toFixed(1)}px rgba(60,40,20,.2)`);
    }
    letras.style.textShadow = capas.join(',');
    muro.style.setProperty('--lx', (lx * 100).toFixed(1) + '%');
    muro.style.setProperty('--ly', (ly * 100).toFixed(1) + '%');
    if (Math.abs(tx - lx) > .002 || Math.abs(ty - ly) > .002) raf = requestAnimationFrame(sombra);
  }
  const pedir = () => { if (!raf) raf = requestAnimationFrame(sombra); };
  const apuntar = (x, y) => {
    const m = muro.getBoundingClientRect();
    tx = Math.min(1.1, Math.max(-.1, (x - m.left) / m.width)); ty = Math.min(.9, Math.max(-.2, (y - m.top) / m.height)); pedir();
  };
  muro.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') apuntar(e.clientX, e.clientY); }, { passive: true });
  muro.addEventListener('touchmove', e => { tocado = true; apuntar(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
  muro.addEventListener('pointerleave', () => { tx = .25; ty = .1; pedir(); });
  if (!conMouse && !reduce) {
    const t0 = performance.now();
    setInterval(() => {
      if (tocado || document.hidden || muro.getBoundingClientRect().bottom < 0) return;
      const t = (performance.now() - t0) / 9000;
      tx = .5 + Math.cos(t * Math.PI) * .55; ty = .1 - Math.abs(Math.sin(t * Math.PI)) * .1; pedir();
    }, 120);
  }
  function noche(on, chispa) {
    muro.classList.toggle('noche', on);
    tecla.setAttribute('aria-pressed', on);
    tecla.lastElementChild.textContent = on ? 'Apagá el cartel' : 'Prendé el cartel';
    $$('.halo', muro).forEach(h => h.style.animation = chispa ? '' : 'none');
    sombra();
  }
  tecla.addEventListener('click', () => noche(!muro.classList.contains('noche'), true));
  addEventListener('resize', pedir, { passive: true });
  // intro: el muro arranca a oscuras y el cartel se prende (siempre arranca prendido; la tecla lo apaga)
  if (root.classList.contains('con-intro')) {
    setTimeout(() => { root.classList.add('listo'); noche(true, true); root.classList.remove('con-intro'); }, 380);
  } else { root.classList.add('listo'); noche(true); }
}

/* ---------- entradas: la luz se prende ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { threshold: .18 });
$$('.rv').forEach(el => io.observe(el));

/* ---------- nav: sección visible ---------- */
const links = $$('.tabbar a, .indice a');
const ion = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + (innerWidth < 1024 ? ({ promos: 'vidriera', historia: 'llevate' }[e.target.id] || e.target.id) : e.target.id)));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main > section[id]').forEach(s => ion.observe(s));

/* ---------- filas de la vidriera: se arrastran con el mouse ---------- */
$$('.fila, .tickets').forEach(f => {
  let x0 = 0, s0 = 0, mov = false, abajo = false;
  f.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || f.scrollWidth <= f.clientWidth) return; abajo = true; mov = false; x0 = e.clientX; s0 = f.scrollLeft; });
  addEventListener('pointermove', e => { if (!abajo) return; const dx = e.clientX - x0; if (Math.abs(dx) > 5) { mov = true; f.classList.add('arrastrando'); } f.scrollLeft = s0 - dx; });
  addEventListener('pointerup', () => { if (!abajo) return; abajo = false; f.classList.remove('arrastrando'); });
  f.addEventListener('click', e => { if (mov) { e.preventDefault(); e.stopPropagation(); mov = false; } }, true);
});

/* ---------- promos: la del momento del día ---------- */
const hRef = q === 'dia' && !(T.h >= 8 && T.h < 20) ? 10 : T.h;
const franja = hRef < 12 ? 'manana' : hRef < 16 ? 'mediodia' : 'tarde';
const tk = $(`.ticket[data-franja~="${franja}"]`);
if (tk) { tk.classList.add('ahora'); tk.insertAdjacentHTML('afterbegin', '<span class="chip-ahora">Ideal ahora</span>'); }

/* ---------- popups propios (carta completa y encargos) ---------- */
let ultimoFoco = null;
function abrirPop(el) {
  ultimoFoco = document.activeElement;
  el.hidden = false; root.classList.add('pop-abierto');
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('abierto')));
  setTimeout(() => $('.x', el)?.focus(), 60);
}
function cerrarPop(el) {
  el.classList.remove('abierto'); root.classList.remove('pop-abierto');
  setTimeout(() => { el.hidden = true; ultimoFoco?.focus?.(); }, 380);
}
document.addEventListener('click', e => {
  const a = e.target.closest('[data-abrir]'); if (a) { abrirPop(document.getElementById(a.dataset.abrir)); return; }
  const c = e.target.closest('[data-cerrar]'); if (c) cerrarPop(c.closest('.pop-carta'));
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  $$('.pop-carta.abierto').forEach(cerrarPop);
  $$('.ficha.abierta').forEach(f => f.classList.remove('abierta'));
});

/* ---------- el kit ---------- */
const { initKit } = await import('../kit/kit.js?v=1');
const kit = await initKit({
  config: 'cliente.json',
  carrito: { label: 'Tu bolsita', fab: false },
  imagenes: { lqip: 'img/lqip.json' },
});
window.kit = kit;
const prods = await kit.store.getProductos();
const P = id => prods.find(p => p.id === id);
const plata = n => kit.money(n) || '';

// precios de la vidriera, las promos y los encargos siempre desde la carta del panel
function pintarPrecios(lista) {
  $$('[data-precio]').forEach(el => { const p = lista.find(x => x.id === el.dataset.precio); if (p) el.textContent = p.precio != null ? plata(p.precio) : 'Consultar'; });
  $$('.prod[data-id]').forEach(el => { const p = lista.find(x => x.id === el.dataset.id); el.hidden = !p || p.disponible === false; });
}
pintarPrecios(prods);
document.addEventListener('kit:carta', e => pintarPrecios(e.detail.productos));
kit.carrito.sync();

// bolsita: contador en la barra del celu y botón de desktop
function pintarBolsita(lineas) {
  const n = lineas.reduce((a, l) => a + (l.cant || 1), 0);
  $$('.bolsita__n').forEach(b => { b.textContent = n; b.hidden = n === 0 && b.closest('.tabbar'); });
  $('.bolsita-desk').hidden = false;
  $('.bolsita-desk').classList.toggle('on', scrollY > innerHeight * .8);
}
pintarBolsita(kit.carrito.lineas);
document.addEventListener('kit:carrito', e => pintarBolsita(e.detail.lineas));
addEventListener('scroll', () => pintarBolsita(kit.carrito.lineas), { passive: true });

// la píldora del panel no tapa el cartel ni el cafeto en el celu
const tapan = new Set();
const iop = new IntersectionObserver(es => {
  es.forEach(e => e.isIntersecting ? tapan.add(e.target) : tapan.delete(e.target));
  const desk = innerWidth >= 1024;
  // celu: se esconde sobre el cartel y el cafeto · desktop: solo se muestra en el cartel y en el footer
  root.classList.toggle('oculta-pill', desk && !tapan.has($('.piepag')));
}, { threshold: .25 });
[muro, $('.piepag')].forEach(el => el && iop.observe(el));

/* ---------- encargos: elegir opción y día ---------- */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-encargar]'); if (!b) return;
  const p = P(b.dataset.encargar); if (!p) return;
  const pop = $('#encargo-pop');
  $('h2', pop).textContent = p.nombre;
  $('.enc-precio', pop).textContent = plata(p.precio);
  $('.enc-desc', pop).textContent = p.descripcion || '';
  const o = (p.opciones || [])[0];
  $('.enc-ops', pop).innerHTML = o ? `<legend>${o.nombre}</legend>` + o.valores.map((v, i) => `<label><input type="radio" name="op" value="${v.id}" ${i ? '' : 'checked'}><span>${v.nombre}</span></label>`).join('') : '';
  pop.dataset.id = p.id; pop.dataset.op = o?.id || '';
  abrirPop(pop);
});
$('#encargo-pop .btn')?.addEventListener('click', () => {
  const pop = $('#encargo-pop'); const v = $('input[name="op"]:checked', pop)?.value;
  kit.carrito.agregar(pop.dataset.id, 1, { origen: $('#encargo-pop .btn'), opc: pop.dataset.op && v ? { [pop.dataset.op]: v } : undefined });
  cerrarPop(pop);
  setTimeout(() => kit.carrito.abrir(), 420);
});

