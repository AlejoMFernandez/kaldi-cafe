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
const estadoCorto = abierto ? 'Abierto ahora · hasta las 20' : `Cerrado · abre ${T.h >= 20 ? 'mañana' : 'hoy'} a las ${T.h >= 20 ? (T.sab ? 9 : 8) : abre}`;
$$('[data-estado], [data-estado-largo]').forEach(e => e.textContent = estadoCorto);
if (!abierto) { $$('.placa2 i').forEach(i => i.style.background = '#9a3b2f'); $('.horarios .ahora')?.classList.add('cerrado'); }
const ev = $('[data-estado-vent]'); if (ev) ev.textContent = abierto ? 'Hoy la ventanita está abierta hasta las 20.' : 'Ahora está cerrada: lo podés dejar pedido para cuando abra.';

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
  // intro: arranca de noche con el cartel prendido y amanece (si el local está abierto)
  if (root.classList.contains('con-intro')) {
    noche(true, true);
    setTimeout(() => {
      root.classList.add('listo');
      setTimeout(() => { if (abierto) { tx = .22; ty = .05; lx = -.2; ly = .6; noche(false); pedir(); } root.classList.remove('con-intro'); }, 700);
    }, 550);
  } else { root.classList.add('listo'); noche(!abierto); }
}

/* ---------- entradas: la luz se prende ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } }), { threshold: .18 });
$$('.rv').forEach(el => io.observe(el));

/* ---------- nav: sección visible ---------- */
const links = $$('.tabbar a, .indice a');
const ion = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + (e.target.id === 'promos' || e.target.id === 'llevate' ? (innerWidth < 1024 ? 'vidriera' : e.target.id) : e.target.id)));
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
const franja = T.h < 12 ? 'manana' : T.h < 16 ? 'mediodia' : 'tarde';
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
  $('.bolsita-desk').classList.toggle('on', n > 0 || scrollY > innerHeight * .8);
}
pintarBolsita(kit.carrito.lineas);
document.addEventListener('kit:carrito', e => pintarBolsita(e.detail.lineas));
addEventListener('scroll', () => pintarBolsita(kit.carrito.lineas), { passive: true });

// la píldora del panel no tapa el cartel ni el cafeto en el celu
const tapan = new Set();
const iop = new IntersectionObserver(es => {
  es.forEach(e => e.isIntersecting ? tapan.add(e.target) : tapan.delete(e.target));
  root.classList.toggle('oculta-pill', innerWidth < 1024 && tapan.size > 0);
}, { threshold: .25 });
[muro, $('#cafeto')].forEach(el => el && iop.observe(el));

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

/* ---------- 2 · el cafeto de Kaldi ---------- */
const escena = $('#cafeto');
if (escena) {
  const datos = JSON.parse(escena.dataset.bebidas);
  const cerezas = $$('.cereza', escena);
  const cabra = $('.cabra', escena), zona = $('.cabra-zona', escena), ficha = $('.ficha', escena), boing = $('.boing', escena), cont = $('.contador b', escena);
  const probadas = new Set(); let ocupada = false;
  datos.forEach(d => { const p = P(d.id); if (p?.precio != null) d.precio = plata(p.precio); });
  function ubicar() {
    const rama = $$('.rama', escena).find(s => getComputedStyle(s).display !== 'none'); if (!rama) return;
    const e = escena.getBoundingClientRect();
    $$('.ancla', rama).forEach(a => {
      const r = a.getBoundingClientRect(), c = cerezas[+a.dataset.i]; if (!c) return;
      c.style.setProperty('--xc', (r.left + r.width / 2 - e.left) + 'px');
      c.style.setProperty('--yc', (r.top + r.height / 2 - e.top) + 'px');
    });
  }
  ubicar(); new ResizeObserver(ubicar).observe(escena);
  const boca = () => { const r = cabra.getBoundingClientRect(); return { x: r.left + r.width * .87, y: r.top + r.height * .37 }; };
  function darle(i, desde) {
    if (ocupada) return; ocupada = true;
    escena.classList.remove('invita'); ficha.classList.remove('abierta');
    const c = cerezas[i], r = desde || c.getBoundingClientRect();
    const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2, b = boca();
    c.classList.add('comida');
    const f = document.createElement('div'); f.className = 'fantasma'; document.body.append(f);
    f.style.transform = `translate(${x0}px,${y0}px)`;
    cabra.classList.add('apunta');
    f.animate([{ transform: `translate(${x0}px,${y0}px)` }, { transform: `translate(${(x0 + b.x) / 2}px,${Math.min(y0, b.y) - 70}px) scale(1.1)`, offset: .5 }, { transform: `translate(${b.x}px,${b.y}px) scale(.4)` }],
      { duration: reduce ? 1 : 520, easing: 'cubic-bezier(.4,0,.6,1)' }).onfinish = () => {
      f.remove(); cabra.classList.remove('apunta'); cabra.classList.add('mastica');
      setTimeout(() => {
        cabra.classList.remove('mastica'); cabra.classList.add('salta');
        const e = escena.getBoundingClientRect(), cr = cabra.getBoundingClientRect();
        boing.style.left = (cr.left - e.left + cr.width * .55) + 'px'; boing.style.top = (cr.top - e.top - 10) + 'px';
        boing.textContent = ['¡Boing!', '¡Hop!', '¡Muuuy bien!', '¡Otra!'][probadas.size % 4];
        boing.classList.remove('va'); void boing.offsetWidth; boing.classList.add('va');
        setTimeout(() => { cabra.classList.remove('salta'); mostrar(i); }, reduce ? 0 : 640);
      }, reduce ? 0 : 720);
    };
  }
  function mostrar(i) {
    const d = datos[i];
    const img = $('img', ficha); img.src = d.foto; img.alt = d.nombre;
    $('.tipo', ficha).textContent = d.tipo; $('h3', ficha).textContent = d.nombre;
    $('p', ficha).textContent = d.desc; $('.precio', ficha).textContent = d.precio;
    ficha.dataset.i = i; ficha.classList.add('abierta');
    probadas.add(i); cont.textContent = `${probadas.size}/${datos.length}`;
    setTimeout(() => { const c = cerezas[i]; c.classList.remove('comida'); c.classList.add('crece'); setTimeout(() => c.classList.remove('crece'), 700); ocupada = false; }, 500);
  }
  $('.x', ficha).addEventListener('click', () => ficha.classList.remove('abierta'));
  $('.sumar', ficha).addEventListener('click', e => kit.carrito.agregar(datos[ficha.dataset.i].id, 1, { origen: e.currentTarget }));
  const sobre = ev => { const r = zona.getBoundingClientRect(); return ev.clientX > r.left - 20 && ev.clientX < r.right + 20 && ev.clientY > r.top - 20 && ev.clientY < r.bottom + 20; };
  cerezas.forEach((c, i) => {
    let arr = null;
    c.addEventListener('pointerdown', ev => { if (ocupada) return; arr = { x: ev.clientX, y: ev.clientY, mov: false, f: null }; c.setPointerCapture(ev.pointerId); });
    c.addEventListener('pointermove', ev => {
      if (!arr) return;
      if (!arr.mov && Math.hypot(ev.clientX - arr.x, ev.clientY - arr.y) > 8) { arr.mov = true; arr.f = document.createElement('div'); arr.f.className = 'fantasma'; document.body.append(arr.f); c.style.opacity = '.25'; }
      if (arr.mov) { arr.f.style.transform = `translate(${ev.clientX}px,${ev.clientY}px)`; const s = sobre(ev); escena.classList.toggle('apuntando', s); cabra.classList.toggle('apunta', s); }
    });
    const fin = ev => {
      if (!arr) return; const a = arr; arr = null; c.style.opacity = '';
      escena.classList.remove('apuntando'); cabra.classList.remove('apunta');
      if (!a.mov) return darle(i);
      a.f.remove();
      if (ev.type === 'pointerup' && sobre(ev)) darle(i, { left: ev.clientX - 10, top: ev.clientY - 10, width: 20, height: 20 });
    };
    c.addEventListener('pointerup', fin); c.addEventListener('pointercancel', fin);
    c.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); darle(i); } });
  });
}
