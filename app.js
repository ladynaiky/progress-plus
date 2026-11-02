/* =====================================================================
   Progress+ · app.js
   Todo el funcionamiento de la app vive en este archivo, en 8 partes:
     1. Configuración       → estados, plataformas, colores e iconos
     2. Datos guardados     → leer y guardar tus juegos en el móvil
     3. Estado de pantalla  → qué pestaña, pantalla o panel está abierto
     4. Utilidades          → fechas, textos y filtros
     5. Acciones            → lo que pasa al tocar cada botón
     6. Vistas              → el HTML de cada pantalla
     7. Eventos             → conecta los toques con las acciones
     8. Arranque            → pinta la app al abrirla
   ===================================================================== */
'use strict';

/* ---------- 1. CONFIGURACIÓN ---------- */

// Los 5 estados. "color" pinta la cabecera, la pestaña y los botones.
const ESTADOS = {
  jugando:    { titulo: 'Jugando',     etiqueta: 'Jugando',    color: '#3DDC97', rgb: '61, 220, 151' },
  pendiente:  { titulo: 'Pendientes',  etiqueta: 'Pendiente',  color: '#4CC9F0', rgb: '76, 201, 240' },
  pausa:      { titulo: 'En pausa',    etiqueta: 'En pausa',   color: '#FFB547', rgb: '255, 181, 71' },
  terminado:  { titulo: 'Terminados',  etiqueta: 'Terminado',  color: '#A78BFA', rgb: '167, 139, 250' },
  abandonado: { titulo: 'Abandonados', etiqueta: 'Abandonado', color: '#FF6B81', rgb: '255, 107, 129' }
};
const ORDEN_ESTADOS = ['jugando', 'pendiente', 'pausa', 'terminado', 'abandonado'];

// Para añadir una consola nueva: añádela aquí y en ORDEN_PLATAFORMAS.
const PLATAFORMAS = {
  pc:     { nombre: 'PC',         fondo: '#2563EB', texto: '#FFFFFF' },
  deck:   { nombre: 'Steam Deck', fondo: '#555B6E', texto: '#FFFFFF' },
  switch: { nombre: 'Switch',     fondo: '#E60012', texto: '#FFFFFF' },
  ds:     { nombre: '3DS',        fondo: '#8EC5FF', texto: '#0E0F14' }
};
const ORDEN_PLATAFORMAS = ['pc', 'deck', 'switch', 'ds'];

const CLAVE_GUARDADO = 'progress-plus';
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const VACIO = {
  jugando:    ['No estás jugando a nada', 'Añade un juego o empieza uno de tus pendientes.'],
  pendiente:  ['Aún no tienes pendientes', 'Apunta los juegos que tienes o que quieres jugar más adelante.'],
  pausa:      ['Nada en pausa', 'Aquí aparecerán los juegos que dejes a medias.'],
  terminado:  ['Ningún juego terminado en {anio}', 'Los juegos que termines aparecen en el año en que los empezaste.'],
  abandonado: ['Ningún abandonado en {anio}', 'Aquí irán los juegos que dejes de jugar.']
};

function svg(trazos, tam = 22, grosor = 1.8) {
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${trazos}</svg>`;
}

const ICONOS = {
  jugando:    svg('<path d="M8 5v14l11-7z"/>'),
  pendiente:  svg('<path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z"/>'),
  pausa:      svg('<rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/>'),
  terminado:  svg('<path d="M5 12l5 5L20 7"/>'),
  abandonado: svg('<circle cx="12" cy="12" r="8"/><path d="M9 9l6 6M15 9l-6 6"/>'),
  lupa:       svg('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', 24),
  lupaPeque:  svg('<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', 20, 2),
  ajustes:    svg('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>', 24),
  flecha:     svg('<path d="M9 6l6 6-6 6"/>', 20),
  abajo:      svg('<path d="M6 9l6 6 6-6"/>', 18, 2),
  cerrar:     svg('<path d="M6 6l12 12M18 6L6 18"/>', 24),
  atras:      svg('<path d="M15 6l-6 6 6 6"/>', 24),
  mas:        svg('<path d="M12 5v14M5 12h14"/>', 26, 2.2),
  masPeque:   svg('<path d="M12 5v14M5 12h14"/>', 20, 2.2),
  lapiz:      svg('<path d="M5 19h4L19 9l-4-4L5 15z"/>'),
  papelera:   svg('<path d="M5 7h14M10 11v6M14 11v6M7 7l1 12h8l1-12M9 7V4h6v3"/>', 20),
  descargar:  svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  subir:      svg('<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>'),
  mando:      svg('<rect x="2.5" y="7" width="19" height="10" rx="5"/><path d="M7 12h3M8.5 10.5v3M15 11h.01M17 13h.01"/>', 44, 1.6),
  check:      svg('<path d="M5 12l5 5L20 7"/>', 18, 2.2),
  alerta:     svg('<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17h.01"/>', 18, 2)
};


/* ---------- 2. DATOS GUARDADOS ----------
   Cada juego es un objeto así:
   { id, nombre, plataforma, estado, inicio, fin, alta, cambio }
   - inicio: día en que empezaste a jugarlo (decide el año)
   - fin:    día en que lo terminaste o abandonaste
   - alta:   día en que lo apuntaste
   - cambio: último cambio de estado (ordena las listas)
   Las fechas se guardan como texto "AAAA-MM-DD". */

let datos = cargarDatos();

function cargarDatos() {
  try {
    const texto = localStorage.getItem(CLAVE_GUARDADO);
    if (texto) {
      const guardado = JSON.parse(texto);
      const juegos = limpiarJuegos(guardado.juegos);
      if (juegos) return { juegos, ultimaCopia: esFecha(guardado.ultimaCopia) ? guardado.ultimaCopia : null };
    }
  } catch (error) {
    // Sin datos o almacenamiento bloqueado: empezamos de cero.
  }
  return { juegos: [], ultimaCopia: null };
}

function guardarDatos() {
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify({ version: 1, juegos: datos.juegos, ultimaCopia: datos.ultimaCopia }));
  } catch (error) {
    mostrarAviso('No se ha podido guardar en este móvil');
  }
}

// Comprueba que una lista de juegos es válida (al abrir la app o al importar una copia).
function limpiarJuegos(lista) {
  if (!Array.isArray(lista)) return null;
  const valida = lista.every(j => j && typeof j.nombre === 'string' && j.nombre.trim() &&
    tiene(PLATAFORMAS, j.plataforma) && tiene(ESTADOS, j.estado));
  if (!valida) return null;
  return lista.map(j => {
    const alta = esFecha(j.alta) ? j.alta : hoy();
    let inicio = esFecha(j.inicio) ? j.inicio : null;
    let fin = esFecha(j.fin) ? j.fin : null;
    if (j.estado !== 'pendiente' && !inicio) inicio = alta;
    if (tieneAnio(j.estado) && !fin) fin = inicio;
    return {
      id: String(j.id || nuevoId()),
      nombre: j.nombre.trim(),
      plataforma: j.plataforma,
      estado: j.estado,
      inicio: j.estado === 'pendiente' ? null : inicio,
      fin: tieneAnio(j.estado) ? fin : null,
      alta,
      cambio: esFecha(j.cambio) ? j.cambio : (fin || inicio || alta)
    };
  });
}


/* ---------- 3. ESTADO DE PANTALLA ----------
   Lo que se ve en cada momento. No se guarda: al cerrar la app se olvida. */

const ui = {
  pestana: 'jugando',
  pantalla: 'lista',      // 'lista' | 'nuevo' | 'editar' | 'ajustes'
  fichaId: null,          // juego con el panel de opciones abierto
  editId: null,           // juego que se está editando
  anio: new Date().getFullYear(),
  menuAnio: false,
  buscando: false,
  busqueda: '',
  form: { nombre: '', plataforma: null, estado: 'jugando', inicio: '', fin: '' },
  errores: {},
  dialogo: null
};

let aviso = null;              // el mensaje temporal de abajo ("Deshacer")
let temporizadorAviso = null;
let enfocar = null;            // elemento que recibe el foco tras pintar

// "Capas": búsqueda, panel y pantallas. Se apuntan en el historial del
// navegador para que el botón Atrás de Android cierre la capa de arriba
// en vez de salir de la app.
const capas = [];

function abrirCapa(tipo) {
  capas.push(tipo);
  history.pushState({ capa: capas.length }, '');
}

function cambiarCapa(tipo) {
  if (capas.length) capas[capas.length - 1] = tipo;
  else abrirCapa(tipo);
}

function cerrarCapa() {
  if (capas.length) history.back();
}

window.addEventListener('popstate', () => {
  const tipo = capas.pop();
  if (tipo === 'busqueda') {
    ui.buscando = false;
    ui.busqueda = '';
  } else if (tipo === 'ficha') {
    ui.fichaId = null;
  } else if (tipo) {
    ui.pantalla = 'lista';
    ui.errores = {};
  }
  pintar();
});


/* ---------- 4. UTILIDADES ---------- */

function tiene(objeto, clave) { return Object.prototype.hasOwnProperty.call(objeto, clave); }
function dos(n) { return String(n).padStart(2, '0'); }
function hoy() { const d = new Date(); return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`; }
function esFecha(t) { return typeof t === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t); }
function anioDe(fecha) { return Number(fecha.slice(0, 4)); }
function tieneAnio(estado) { return estado === 'terminado' || estado === 'abandonado'; }
function nuevoId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function buscarJuego(id) { return datos.juegos.find(j => j.id === id) || null; }
function plural(n, uno, varios) { return `${n} ${n === 1 ? uno : varios}`; }
function normalizar(t) { return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

// Evita que un nombre con símbolos como < o & rompa el HTML.
function esc(texto) {
  return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// "2026-08-20" → "20 ago" (o "20 ago 2025" si no es de este año)
function fechaCorta(fecha) {
  if (!fecha) return '';
  const [a, m, d] = fecha.split('-').map(Number);
  return `${d} ${MESES[m - 1]}${a !== new Date().getFullYear() ? ' ' + a : ''}`;
}

// Juegos de la lista actual: los de la pestaña (y del año, en Terminados y
// Abandonados) o, si estás buscando, los de todos los estados.
function juegosVisibles() {
  let lista;
  if (ui.buscando) {
    const texto = normalizar(ui.busqueda.trim());
    lista = texto ? datos.juegos.filter(j => normalizar(j.nombre).includes(texto)) : [];
  } else {
    lista = datos.juegos.filter(j => j.estado === ui.pestana &&
      (!tieneAnio(ui.pestana) || (j.inicio && anioDe(j.inicio) === ui.anio)));
  }
  // Más recientes primero
  return lista.slice().sort((a, b) => (a.cambio === b.cambio ? 0 : a.cambio < b.cambio ? 1 : -1));
}

function aniosDisponibles() {
  const anios = new Set([new Date().getFullYear(), ui.anio]);
  datos.juegos.forEach(j => { if (j.estado === ui.pestana && j.inicio) anios.add(anioDe(j.inicio)); });
  return [...anios].sort((a, b) => b - a);
}

function textoContador(n) {
  if (ui.buscando) {
    return ui.busqueda.trim() ? `${plural(n, 'resultado', 'resultados')} en todos tus juegos` : 'Escribe el nombre de un juego';
  }
  if (tieneAnio(ui.pestana)) return `${plural(n, 'juego empezado', 'juegos empezados')} en`;
  if (n === 0) return 'Sin juegos todavía';
  return `${plural(n, 'juego', 'juegos')} · más recientes primero`;
}

function textoMeta(j) {
  if (j.estado === 'pendiente') return `Pendiente · añadido ${fechaCorta(j.alta)}`;
  if (j.estado === 'jugando') return `Jugando desde ${fechaCorta(j.inicio)}`;
  if (j.estado === 'pausa') return `En pausa · empezado ${fechaCorta(j.inicio)}`;
  if (j.estado === 'terminado') return `Terminado ${fechaCorta(j.fin)} · empezado ${fechaCorta(j.inicio)}`;
  return `Abandonado ${fechaCorta(j.fin)} · empezado ${fechaCorta(j.inicio)}`;
}

// Opciones del panel según el estado: [acción, estado destino, título, explicación]
function opcionesFicha(j) {
  switch (j.estado) {
    case 'pendiente':
      return [['mover', 'jugando', 'Empezar a jugar', 'Hoy queda como fecha de inicio']];
    case 'jugando':
      return [
        ['mover', 'pausa', 'En pausa', ''],
        ['mover', 'terminado', 'Terminado', 'Guarda la fecha de hoy'],
        ['mover', 'abandonado', 'Abandonado', 'Guarda la fecha de hoy']
      ];
    case 'pausa':
      return [
        ['mover', 'jugando', 'Seguir jugando', ''],
        ['mover', 'abandonado', 'Abandonado', 'Guarda la fecha de hoy']
      ];
    case 'terminado':
      return [['rejugar', 'jugando', 'Volver a jugar', 'Se añade como partida nueva en Jugando. Esta se queda en Terminados.']];
    default:
      return [['mover', 'jugando', 'Retomar', `Vuelve a Jugando y sigue contando en ${j.inicio ? anioDe(j.inicio) : ''}.`]];
  }
}


/* ---------- 5. ACCIONES ---------- */

function cambiarPestana(estado) {
  if (estado !== ui.pestana) ui.anio = new Date().getFullYear();   // cada pestaña abre en el año actual
  ui.pestana = estado;
  ui.menuAnio = false;
  window.scrollTo(0, 0);
  if (ui.buscando) cerrarCapa();   // al cerrar la búsqueda se vuelve a pintar
  else pintar();
}

function alternarBusqueda() {
  if (ui.buscando) { cerrarCapa(); return; }
  ui.buscando = true;
  ui.busqueda = '';
  ui.menuAnio = false;
  abrirCapa('busqueda');
  enfocar = '#campo-busqueda';
  pintar();
}

function abrirFicha(id) {
  ui.fichaId = id;
  ui.menuAnio = false;
  abrirCapa('ficha');
  enfocar = '.ficha .accion';
  pintar();
}

// Cambia el estado de un juego y apunta las fechas que tocan.
function mover(id, nuevoEstado) {
  const juego = buscarJuego(id);
  if (!juego) return;
  const antes = datos.juegos;
  const fecha = hoy();
  datos.juegos = antes.map(j => {
    if (j.id !== id) return j;
    const cambiado = { ...j, estado: nuevoEstado, cambio: fecha };
    if (nuevoEstado === 'jugando') {
      cambiado.inicio = j.inicio || fecha;   // un retomado conserva su año
      cambiado.fin = null;
    }
    if (tieneAnio(nuevoEstado)) cambiado.fin = fecha;
    return cambiado;
  });
  guardarDatos();
  cerrarCapa();
  mostrarAviso(`«${juego.nombre}» → ${ESTADOS[nuevoEstado].titulo}`, antes);
}

// Un terminado no se mueve: se crea una partida nueva en Jugando.
function volverAJugar(id) {
  const juego = buscarJuego(id);
  if (!juego) return;
  const antes = datos.juegos;
  const fecha = hoy();
  const partida = { id: nuevoId(), nombre: juego.nombre, plataforma: juego.plataforma, estado: 'jugando', inicio: fecha, fin: null, alta: fecha, cambio: fecha };
  datos.juegos = [partida, ...antes];
  guardarDatos();
  cerrarCapa();
  mostrarAviso(`Nueva partida de «${juego.nombre}» en Jugando`, antes);
}

function abrirNuevo() {
  ui.form = { nombre: '', plataforma: null, estado: ui.pestana === 'pendiente' ? 'pendiente' : 'jugando', inicio: '', fin: '' };
  ui.errores = {};
  ui.pantalla = 'nuevo';
  ui.menuAnio = false;
  ocultarAviso();   // el aviso anterior ya no tiene que ver con esta pantalla
  abrirCapa('nuevo');
  window.scrollTo(0, 0);
  enfocar = '#campo-nombre';
  pintar();
}

function guardarNuevo() {
  const f = ui.form;
  const nombre = f.nombre.trim();
  ui.errores = {};
  if (!nombre) ui.errores.nombre = 'Escribe el nombre del juego';
  if (!f.plataforma) ui.errores.plataforma = 'Elige una plataforma';
  if (ui.errores.nombre || ui.errores.plataforma) {
    enfocar = ui.errores.nombre ? '#campo-nombre' : '.opcion';
    pintar();
    return;
  }
  const antes = datos.juegos;
  const fecha = hoy();
  const juego = { id: nuevoId(), nombre, plataforma: f.plataforma, estado: f.estado, inicio: f.estado === 'jugando' ? fecha : null, fin: null, alta: fecha, cambio: fecha };
  datos.juegos = [juego, ...antes];
  guardarDatos();
  ui.pestana = f.estado;           // te lleva a la lista donde ha quedado
  cerrarCapa();
  mostrarAviso(`«${nombre}» añadido a ${ESTADOS[f.estado].titulo}`, antes);
}

function abrirEdicion() {
  const juego = buscarJuego(ui.fichaId);
  if (!juego) return;
  ui.form = { nombre: juego.nombre, plataforma: juego.plataforma, estado: juego.estado, inicio: juego.inicio || '', fin: juego.fin || '' };
  ui.errores = {};
  ui.editId = juego.id;
  ui.fichaId = null;
  ui.pantalla = 'editar';
  ocultarAviso();
  cambiarCapa('editar');   // sustituye al panel: Atrás vuelve a la lista
  window.scrollTo(0, 0);
  pintar();
}

function guardarEdicion() {
  const juego = buscarJuego(ui.editId);
  if (!juego) { cerrarCapa(); return; }
  const f = ui.form;
  const nombre = f.nombre.trim();
  const conFin = tieneAnio(juego.estado);
  ui.errores = {};
  if (!nombre) ui.errores.nombre = 'Escribe el nombre del juego';
  if (juego.estado !== 'pendiente' && !f.inicio) ui.errores.fechas = 'Pon la fecha de inicio';
  else if (conFin && !f.fin) ui.errores.fechas = 'Pon la fecha de fin';
  else if (conFin && f.fin < f.inicio) ui.errores.fechas = 'La fecha de fin no puede ser anterior al inicio';
  if (Object.keys(ui.errores).length) {
    enfocar = ui.errores.nombre ? '#campo-nombre' : '#campo-inicio';
    pintar();
    return;
  }
  const antes = datos.juegos;
  datos.juegos = antes.map(j => {
    if (j.id !== juego.id) return j;
    const cambiado = { ...j, nombre, plataforma: f.plataforma };
    if (juego.estado !== 'pendiente') cambiado.inicio = f.inicio;
    if (conFin) { cambiado.fin = f.fin; cambiado.cambio = f.fin; }
    return cambiado;
  });
  guardarDatos();
  cerrarCapa();
  mostrarAviso('Cambios guardados', antes);
}

function borrarJuego() {
  const juego = buscarJuego(ui.editId);
  if (!juego) return;
  const antes = datos.juegos;
  datos.juegos = antes.filter(j => j.id !== juego.id);
  guardarDatos();
  cerrarCapa();
  mostrarAviso(`«${juego.nombre}» borrado`, antes);
}

function abrirAjustes() {
  ui.pantalla = 'ajustes';
  ui.menuAnio = false;
  abrirCapa('ajustes');
  window.scrollTo(0, 0);
  pintar();
}

// Copia de seguridad: descarga un archivo .json con todos tus juegos.
function exportarCopia() {
  const contenido = JSON.stringify({ app: 'Progress+', version: 1, fecha: hoy(), juegos: datos.juegos }, null, 2);
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(new Blob([contenido], { type: 'application/json' }));
  enlace.download = `progress-plus-${hoy()}.json`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 2000);
  datos.ultimaCopia = hoy();
  guardarDatos();
  pintar();
  mostrarAviso('Copia descargada en tu móvil');
}

function importarCopia(archivo) {
  const lector = new FileReader();
  lector.onload = () => {
    let juegos = null;
    try { juegos = limpiarJuegos(JSON.parse(lector.result).juegos); } catch (error) { juegos = null; }
    if (!juegos) { mostrarAviso('Ese archivo no es una copia de Progress+'); return; }
    const actuales = datos.juegos.length;
    const deLaCopia = juegos.length === 1 ? 'el juego de la copia' : `los ${juegos.length} juegos de la copia`;
    ui.dialogo = {
      titulo: 'Recuperar copia',
      texto: actuales === 0 ? `Se cargarán ${deLaCopia}.`
        : actuales === 1 ? `Tu juego actual se sustituirá por ${deLaCopia}.`
        : `Tus ${actuales} juegos actuales se sustituirán por ${deLaCopia}.`,
      boton: 'Recuperar',
      alAceptar: () => {
        const antes = datos.juegos;
        datos.juegos = juegos;
        guardarDatos();
        mostrarAviso('Copia recuperada', antes);
      }
    };
    enfocar = '.dialogo .boton-secundario';
    pintar();
  };
  lector.onerror = () => mostrarAviso('No se ha podido leer el archivo');
  lector.readAsText(archivo);
}

// Mensaje temporal de abajo. Si recibe "antes", ofrece Deshacer.
const cajaAviso = document.getElementById('aviso');

function mostrarAviso(texto, antes) {
  clearTimeout(temporizadorAviso);
  aviso = { texto, antes: antes || null };
  cajaAviso.innerHTML = `<span class="aviso__texto">${esc(texto)}</span>` +
    (aviso.antes ? '<button type="button" class="aviso__boton" data-accion="deshacer">Deshacer</button>' : '');
  cajaAviso.classList.add('visible');
  temporizadorAviso = setTimeout(ocultarAviso, 6000);
}

function ocultarAviso() {
  clearTimeout(temporizadorAviso);
  aviso = null;
  cajaAviso.classList.remove('visible');
  cajaAviso.innerHTML = '';
}

function deshacer() {
  if (!aviso || !aviso.antes) return;
  datos.juegos = aviso.antes;
  guardarDatos();
  ocultarAviso();
  pintar();
}


/* ---------- 6. VISTAS ----------
   Cada función devuelve el HTML de una parte. pintar() las junta. */

const raiz = document.getElementById('app');
const metaColor = document.querySelector('meta[name="theme-color"]');

function pintar() {
  const estado = ESTADOS[ui.pestana];
  // El color de la pestaña activa se reparte a toda la app con --accent.
  document.documentElement.style.setProperty('--accent', estado.color);
  document.documentElement.style.setProperty('--accent-rgb', estado.rgb);

  let html;
  if (ui.pantalla === 'nuevo' || ui.pantalla === 'editar') html = vistaFormulario();
  else if (ui.pantalla === 'ajustes') html = vistaAjustes();
  else html = vistaLista();
  raiz.innerHTML = html + vistaFicha() + vistaDialogo();

  // La barra de estado de Android toma el color de la cabecera.
  metaColor.setAttribute('content', ui.pantalla === 'lista' ? estado.color : '#0E0F14');
  document.body.dataset.pantalla = ui.pantalla;
  document.body.classList.toggle('bloqueado', Boolean(ui.fichaId || ui.dialogo));

  if (enfocar) {
    const elemento = raiz.querySelector(enfocar);
    if (elemento) elemento.focus({ preventScroll: true });
    enfocar = null;
  }
}

// Al escribir en el buscador solo se repinta la lista, para no cerrar el teclado.
function pintarResultados() {
  const lista = juegosVisibles();
  document.getElementById('lista').innerHTML = vistaFilas(lista);
  document.getElementById('contador').textContent = textoContador(lista.length);
}

function vistaLista() {
  const estado = ESTADOS[ui.pestana];
  const lista = juegosVisibles();
  return `
    <div class="cabecera">
      <header class="cabecera__fila">
        <h1 class="cabecera__titulo">${ui.buscando ? 'Buscar' : estado.titulo}</h1>
        <div class="cabecera__botones">
          <button type="button" class="boton-icono" data-accion="buscar" aria-label="${ui.buscando ? 'Cerrar búsqueda' : 'Buscar'}" aria-expanded="${ui.buscando}">${ui.buscando ? ICONOS.cerrar : ICONOS.lupa}</button>
          <button type="button" class="boton-icono" data-accion="ajustes" aria-label="Ajustes">${ICONOS.ajustes}</button>
        </div>
      </header>
      ${ui.buscando ? vistaBuscador() : ''}
      <div class="cabecera__info">
        <p class="cabecera__contador" id="contador">${textoContador(lista.length)}</p>
        ${!ui.buscando && tieneAnio(ui.pestana) ? vistaSelectorAnio() : ''}
      </div>
    </div>
    <main class="lista" id="lista">${vistaFilas(lista)}</main>
    ${!ui.buscando && lista.length ? `<button type="button" class="fab" data-accion="nuevo" aria-label="Añadir juego">${ICONOS.mas}</button>` : ''}
    ${vistaNavegacion()}`;
}

function vistaBuscador() {
  return `
    <div class="buscador">
      ${ICONOS.lupaPeque}
      <input id="campo-busqueda" type="search" enterkeyhint="search" autocomplete="off" placeholder="Buscar en todos tus juegos" aria-label="Buscar juego" value="${esc(ui.busqueda)}">
    </div>`;
}

function vistaSelectorAnio() {
  const menu = ui.menuAnio ? `
    <div class="selector-anio__menu">
      ${aniosDisponibles().map(a => `
        <button type="button" class="selector-anio__opcion" data-accion="elegir-anio" data-anio="${a}" aria-pressed="${a === ui.anio}">${a}${a === ui.anio ? ICONOS.check : ''}</button>`).join('')}
    </div>` : '';
  return `
    <div class="selector-anio">
      <button type="button" class="selector-anio__boton" data-accion="menu-anio" aria-expanded="${ui.menuAnio}" aria-label="Elegir año, ahora ${ui.anio}">${ui.anio}${ICONOS.abajo}</button>
      ${menu}
    </div>`;
}

function chip(plataforma) {
  const p = PLATAFORMAS[plataforma];
  return `<span class="chip" style="background:${p.fondo};color:${p.texto}">${p.nombre}</span>`;
}

function vistaFilas(lista) {
  if (!lista.length) return vistaVacia();
  return `
    <ul class="filas">
      ${lista.map(j => `
        <li>
          <button type="button" class="fila" data-accion="ficha" data-id="${esc(j.id)}">
            <span class="fila__nombre">${esc(j.nombre)}</span>
            ${ui.buscando ? `<span class="fila__estado" style="color:${ESTADOS[j.estado].color}">${ESTADOS[j.estado].etiqueta}</span>` : ''}
            ${chip(j.plataforma)}
            ${ICONOS.flecha}
          </button>
        </li>`).join('')}
    </ul>`;
}

function vistaVacia() {
  if (ui.buscando) {
    const texto = ui.busqueda.trim();
    if (!texto) return '';
    return `
      <div class="vacio">
        <h2 class="vacio__titulo">Sin resultados</h2>
        <p class="vacio__texto">Ningún juego coincide con «${esc(texto)}».</p>
      </div>`;
  }
  const [titulo, texto] = VACIO[ui.pestana];
  return `
    <div class="vacio">
      <div class="vacio__icono" aria-hidden="true">${ICONOS.mando}</div>
      <h2 class="vacio__titulo">${titulo.replace('{anio}', ui.anio)}</h2>
      <p class="vacio__texto">${texto}</p>
      <button type="button" class="boton-acento" data-accion="nuevo">${ICONOS.masPeque}Añadir juego</button>
    </div>`;
}

function vistaNavegacion() {
  return `
    <nav class="navegacion" aria-label="Estados">
      ${ORDEN_ESTADOS.map(clave => {
        const activo = clave === ui.pestana;
        const e = ESTADOS[clave];
        return `
          <button type="button" class="navegacion__boton${activo ? ' activo' : ''}" data-accion="pestana" data-estado="${clave}"${activo ? ' aria-current="page"' : ''} style="--c:${e.color};--c-rgb:${e.rgb}">
            <span class="navegacion__icono">${ICONOS[clave]}</span>${e.titulo}
          </button>`;
      }).join('')}
    </nav>`;
}

function vistaFormulario() {
  const esNuevo = ui.pantalla === 'nuevo';
  const juego = esNuevo ? null : buscarJuego(ui.editId);
  if (!esNuevo && !juego) return '';
  const f = ui.form;
  const err = ui.errores;
  const estado = ESTADOS[esNuevo ? f.estado : juego.estado];

  const plataformas = ORDEN_PLATAFORMAS.map(clave => {
    const p = PLATAFORMAS[clave];
    const elegida = f.plataforma === clave;
    return `
      <button type="button" class="opcion${elegida ? ' elegida' : ''}" data-accion="elegir-plataforma" data-plataforma="${clave}" aria-pressed="${elegida}" style="--opcion-fondo:${p.fondo};--opcion-texto:${p.texto}">
        <span class="opcion__punto" aria-hidden="true"></span>${p.nombre}
      </button>`;
  }).join('');

  return `
    <header class="barra-superior">
      <button type="button" class="boton-icono" data-accion="volver" aria-label="${esNuevo ? 'Cerrar sin guardar' : 'Volver sin guardar'}">${esNuevo ? ICONOS.cerrar : ICONOS.atras}</button>
      <h1 class="barra-superior__titulo">${esNuevo ? 'Añadir juego' : 'Editar juego'}</h1>
    </header>
    <form class="formulario" id="formulario" novalidate>
      <label class="etiqueta" for="campo-nombre">Nombre</label>
      <input class="campo${err.nombre ? ' con-error' : ''}" id="campo-nombre" name="nombre" type="text" autocomplete="off" autocapitalize="sentences" enterkeyhint="done" maxlength="120" placeholder="Escribe el nombre del juego" value="${esc(f.nombre)}"${err.nombre ? ' aria-invalid="true" aria-describedby="error-nombre"' : ''}>
      ${err.nombre ? `<p class="error" id="error-nombre" role="alert">${err.nombre}</p>` : ''}

      <p class="etiqueta" id="grupo-plataforma">Plataforma</p>
      <div class="opciones" role="group" aria-labelledby="grupo-plataforma">${plataformas}</div>
      ${err.plataforma ? `<p class="error" role="alert">${err.plataforma}</p>` : ''}

      ${esNuevo ? vistaEstadoNuevo() : vistaEstadoEdicion(juego)}

      <div class="barra-inferior">
        <button type="submit" class="boton-principal" style="--accent:${estado.color};--accent-rgb:${estado.rgb}">${esNuevo ? `Guardar en ${estado.titulo}` : 'Guardar cambios'}</button>
        ${esNuevo ? '' : `<button type="button" class="boton-secundario" data-accion="borrar">${ICONOS.papelera}Borrar juego</button>`}
      </div>
    </form>`;
}

function vistaEstadoNuevo() {
  const f = ui.form;
  const opciones = ['pendiente', 'jugando'].map(clave => {
    const elegido = f.estado === clave;
    return `
      <button type="button" class="opcion opcion--estado${elegido ? ' elegida' : ''}" data-accion="elegir-estado" data-estado="${clave}" aria-pressed="${elegido}" style="--opcion-fondo:${ESTADOS[clave].color};--opcion-texto:#0E0F14">
        ${ICONOS[clave]}${ESTADOS[clave].etiqueta}
      </button>`;
  }).join('');
  const nota = f.estado === 'jugando'
    ? `Hoy queda como fecha de inicio y el juego cuenta para ${new Date().getFullYear()}.`
    : 'Sin fecha: contará para el año en que empieces a jugarlo.';
  return `
    <p class="etiqueta" id="grupo-estado">Estado</p>
    <div class="opciones" role="group" aria-labelledby="grupo-estado">${opciones}</div>
    <p class="nota">${nota}</p>`;
}

function vistaEstadoEdicion(juego) {
  const e = ESTADOS[juego.estado];
  const f = ui.form;
  const conInicio = juego.estado !== 'pendiente';
  const conFin = tieneAnio(juego.estado);
  const fechas = conInicio ? `
    <div class="fechas">
      <div>
        <label class="etiqueta" for="campo-inicio">Inicio</label>
        <input class="campo" id="campo-inicio" name="inicio" type="date" max="${hoy()}" value="${f.inicio}">
      </div>
      ${conFin ? `
      <div>
        <label class="etiqueta" for="campo-fin">Fin</label>
        <input class="campo" id="campo-fin" name="fin" type="date" max="${hoy()}" value="${f.fin}">
      </div>` : ''}
    </div>` : '';
  return `
    <p class="etiqueta">Estado</p>
    <p class="pastilla" style="background:rgba(${e.rgb}, 0.14);color:${e.color}">${ICONOS[juego.estado]}${e.etiqueta}</p>
    <p class="nota">El estado se cambia tocando el juego en la lista.</p>
    ${fechas}
    ${ui.errores.fechas ? `<p class="error" role="alert">${ui.errores.fechas}</p>` : ''}`;
}

function vistaAjustes() {
  const ultima = datos.ultimaCopia;
  const dias = ultima ? Math.floor((new Date(hoy()) - new Date(ultima)) / 86400000) : null;
  let estadoCopia;
  if (!ultima) estadoCopia = `<p class="estado-copia estado-copia--alerta">${ICONOS.alerta}Aún no has hecho ninguna copia</p>`;
  else if (dias > 30) estadoCopia = `<p class="estado-copia estado-copia--alerta">${ICONOS.alerta}Última copia: ${fechaCorta(ultima)}, hace más de un mes</p>`;
  else estadoCopia = `<p class="estado-copia">${ICONOS.check}Última copia: ${fechaCorta(ultima)}</p>`;

  return `
    <header class="barra-superior">
      <button type="button" class="boton-icono" data-accion="volver" aria-label="Volver">${ICONOS.atras}</button>
      <h1 class="barra-superior__titulo">Ajustes</h1>
    </header>
    <main class="ajustes">
      <section class="tarjeta">
        <h2 class="tarjeta__titulo">Copia de seguridad</h2>
        <p class="tarjeta__texto">Tus juegos se guardan solo en este móvil. Haz una copia de vez en cuando para no perderlos si cambias de teléfono.</p>
        ${estadoCopia}
        <button type="button" class="boton-fila" data-accion="exportar">
          <span class="boton-fila__icono" aria-hidden="true">${ICONOS.descargar}</span>
          <span class="boton-fila__texto"><span class="boton-fila__titulo">Exportar copia</span><span class="boton-fila__sub">Descarga un archivo con tus ${plural(datos.juegos.length, 'juego', 'juegos')}</span></span>
        </button>
        <button type="button" class="boton-fila" data-accion="importar">
          <span class="boton-fila__icono" aria-hidden="true">${ICONOS.subir}</span>
          <span class="boton-fila__texto"><span class="boton-fila__titulo">Importar copia</span><span class="boton-fila__sub">Recupera tus juegos desde un archivo</span></span>
        </button>
      </section>
    </main>`;
}

function vistaFicha() {
  const j = ui.fichaId ? buscarJuego(ui.fichaId) : null;
  if (!j) return '';
  const opciones = opcionesFicha(j).map(([accion, destino, titulo, explicacion]) => `
    <button type="button" class="accion" data-accion="${accion}" data-a="${destino}" style="--c:${ESTADOS[destino].color};--c-rgb:${ESTADOS[destino].rgb}">
      <span class="accion__icono" aria-hidden="true">${ICONOS[destino]}</span>
      <span class="accion__texto">
        <span class="accion__titulo">${titulo}</span>
        ${explicacion ? `<span class="accion__sub">${explicacion}</span>` : ''}
      </span>
    </button>`).join('');
  return `
    <button type="button" class="velo" data-accion="volver" aria-label="Cerrar panel" tabindex="-1"></button>
    <section class="ficha" role="dialog" aria-modal="true" aria-labelledby="ficha-titulo">
      <div class="ficha__asa" aria-hidden="true"></div>
      <h2 class="ficha__titulo" id="ficha-titulo">${esc(j.nombre)}</h2>
      <p class="ficha__meta">${chip(j.plataforma)}<span>${textoMeta(j)}</span></p>
      <p class="ficha__seccion">${j.estado === 'terminado' ? 'Opciones' : 'Cambiar a'}</p>
      ${opciones}
      <hr class="separador">
      <button type="button" class="enlace-accion" data-accion="editar">${ICONOS.lapiz}Editar o borrar juego</button>
      <button type="button" class="boton-secundario boton-secundario--relleno" data-accion="volver">Cancelar</button>
    </section>`;
}

function vistaDialogo() {
  const d = ui.dialogo;
  if (!d) return '';
  return `
    <div class="velo" aria-hidden="true"></div>
    <section class="dialogo" role="alertdialog" aria-modal="true" aria-labelledby="dialogo-titulo" aria-describedby="dialogo-texto">
      <h2 id="dialogo-titulo">${d.titulo}</h2>
      <p id="dialogo-texto">${d.texto}</p>
      <div class="dialogo__botones">
        <button type="button" class="boton-secundario" data-accion="cancelar-dialogo">Cancelar</button>
        <button type="button" class="boton-principal" data-accion="aceptar-dialogo">${d.boton}</button>
      </div>
    </section>`;
}


/* ---------- 7. EVENTOS ----------
   Cada botón lleva data-accion="…". Un solo "escuchador" mira qué botón
   se ha tocado y llama a la acción con ese nombre. */

const ACCIONES = {
  'pestana':           boton => cambiarPestana(boton.dataset.estado),
  'buscar':            () => alternarBusqueda(),
  'ajustes':           () => abrirAjustes(),
  'menu-anio':         () => {
    ui.menuAnio = !ui.menuAnio;
    if (ui.menuAnio) enfocar = '.selector-anio__opcion[aria-pressed="true"]';
    pintar();
  },
  'elegir-anio':       boton => {
    ui.anio = Number(boton.dataset.anio);
    ui.menuAnio = false;
    enfocar = '.selector-anio__boton';
    pintar();
  },
  'ficha':             boton => abrirFicha(boton.dataset.id),
  'mover':             boton => mover(ui.fichaId, boton.dataset.a),
  'rejugar':           () => volverAJugar(ui.fichaId),
  'editar':            () => abrirEdicion(),
  'volver':            () => cerrarCapa(),
  'nuevo':             () => abrirNuevo(),
  'elegir-plataforma': boton => {
    ui.form.plataforma = boton.dataset.plataforma;
    delete ui.errores.plataforma;
    enfocar = `.opcion[data-plataforma="${boton.dataset.plataforma}"]`;
    pintar();
  },
  'elegir-estado':     boton => {
    ui.form.estado = boton.dataset.estado;
    enfocar = `.opcion[data-estado="${boton.dataset.estado}"]`;
    pintar();
  },
  'borrar':            () => borrarJuego(),
  'exportar':          () => exportarCopia(),
  'importar':          () => document.getElementById('archivo-copia').click(),
  'cancelar-dialogo':  () => { ui.dialogo = null; pintar(); },
  'aceptar-dialogo':   () => {
    const dialogo = ui.dialogo;
    ui.dialogo = null;
    dialogo.alAceptar();
    pintar();
  },
  'deshacer':          () => deshacer()
};

document.addEventListener('click', evento => {
  // Tocar fuera del selector de año lo cierra.
  if (ui.menuAnio && !evento.target.closest('.selector-anio')) {
    ui.menuAnio = false;
    pintar();
    return;
  }
  const boton = evento.target.closest('[data-accion]');
  if (!boton) return;
  const accion = ACCIONES[boton.dataset.accion];
  if (accion) accion(boton);
});

document.addEventListener('input', evento => {
  const campo = evento.target;
  if (campo.id === 'campo-busqueda') {
    ui.busqueda = campo.value;
    pintarResultados();
    return;
  }
  if (campo.name === 'nombre' || campo.name === 'inicio' || campo.name === 'fin') {
    ui.form[campo.name] = campo.value;
    if (campo.name === 'nombre' && ui.errores.nombre) {
      delete ui.errores.nombre;
      campo.classList.remove('con-error');
      campo.removeAttribute('aria-invalid');
      const error = document.getElementById('error-nombre');
      if (error) error.remove();
    }
  }
});

document.addEventListener('submit', evento => {
  if (evento.target.id !== 'formulario') return;
  evento.preventDefault();
  if (ui.pantalla === 'nuevo') guardarNuevo();
  else guardarEdicion();
});

document.addEventListener('keydown', evento => {
  // El botón "Listo" del teclado cierra el teclado en vez de guardar.
  if (evento.key === 'Enter' && (evento.target.id === 'campo-nombre' || evento.target.id === 'campo-busqueda')) {
    evento.preventDefault();
    evento.target.blur();
    return;
  }
  if (evento.key === 'Escape') {
    if (ui.dialogo) { ui.dialogo = null; pintar(); }
    else if (ui.menuAnio) { ui.menuAnio = false; pintar(); }
    else cerrarCapa();
  }
});

document.getElementById('archivo-copia').addEventListener('change', evento => {
  const archivo = evento.target.files[0];
  evento.target.value = '';
  if (archivo) importarCopia(archivo);
});


/* ---------- 8. ARRANQUE ---------- */

history.replaceState({ capa: 0 }, '');
pintar();

// Pide al móvil que no borre los datos de la app si se queda sin espacio.
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// El service worker (sw.js) guarda la app para poder abrirla sin conexión.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
