// ════════════════════════════════════════════════════════════════════════════
// metrics.js — Telemetría anónima del HUB público HDS (GitHub Pages).
//
// Diseño de privacidad (Ley 21.719: minimización): NO se registra IP, nombre
// ni dato personal alguno. El "visitante" es un identificador aleatorio local
// (localStorage) que solo distingue navegadores; la sesión es otro aleatorio
// por pestaña. Eventos: visita · latido (30 s visibles) · salida (total seg)
// · tab/subtema/ficha (temas consultados) · clic_tarjeta (index).
//
// METRICS_URL: URL /exec del Apps Script (ver _setup/Code_metricas.gs).
// Vacía → la telemetría queda apagada (no-op). Debug local: agregar ?mdebug=1
// a la URL para ver los eventos en la consola sin depender del endpoint.
// ════════════════════════════════════════════════════════════════════════════
(function(){
  var METRICS_URL = ''; /*__METRICS_URL__*/
  var DEBUG = /[?&]mdebug=1/.test(location.search);
  if (!METRICS_URL && !DEBUG) return;

  // ── identificadores anónimos ──────────────────────────────────────────────
  function rnd(){ return Math.random().toString(36).slice(2,10); }
  var vid = '';
  try {
    vid = localStorage.getItem('hds_mid') || '';
    if (!vid){ vid = 'v' + rnd() + rnd(); localStorage.setItem('hds_mid', vid); }
  } catch(e){ vid = 'v-priv'; }
  var sid = '';
  try {
    sid = sessionStorage.getItem('hds_sid') || '';
    if (!sid){ sid = 's' + rnd(); sessionStorage.setItem('hds_sid', sid); }
  } catch(e){ sid = 's-priv'; }

  var PAGE = (location.pathname.split('/').pop() || 'index.html');
  var DISP = (function(){
    var w = Math.min(screen.width, window.innerWidth || screen.width);
    return w < 600 ? 'movil' : (w < 1024 ? 'tablet' : 'escritorio');
  })();

  // ── envío (sendBeacon → fetch no-cors keepalive) ──────────────────────────
  function send(evento, detalle){
    var payload = {
      v: vid, s: sid, evento: evento, plataforma: PAGE,
      detalle: String(detalle == null ? '' : detalle).slice(0, 80), disp: DISP
    };
    if (DEBUG) { try { console.log('[metrics]', payload); } catch(e){} }
    if (!METRICS_URL) return;
    var body = new URLSearchParams(payload).toString();
    try {
      if (navigator.sendBeacon &&
          navigator.sendBeacon(METRICS_URL,
            new Blob([body], {type:'application/x-www-form-urlencoded'}))) return;
    } catch(e){}
    try {
      fetch(METRICS_URL, { method:'POST', mode:'no-cors', keepalive:true,
        headers:{'Content-Type':'application/x-www-form-urlencoded'}, body: body });
    } catch(e){}
  }
  // API pública para instrumentar desde las plataformas si se quiere
  window.hdsMetric = send;

  // ── visita (con parámetros de link compartido si vienen) ─────────────────
  var q = new URLSearchParams(location.search);
  var ctx = q.get('especialidad') || q.get('servicio') || q.get('sistema') || '';
  send('visita', ctx);

  // ── tiempo de permanencia: latido cada 30 s con pestaña visible ──────────
  var visibleSecs = 0, lastTick = Date.now();
  setInterval(function(){
    if (document.visibilityState === 'visible'){
      visibleSecs += 30;
      send('latido', visibleSecs);
    }
  }, 30000);
  window.addEventListener('pagehide', function(){
    // segundos visibles acumulados (redondeo al latido + resto aproximado)
    send('salida', visibleSecs + Math.min(30, Math.round((Date.now()-lastTick)/1000)%30));
  });

  // ── temas: hooks por plataforma (delegación de clics, defensivo) ─────────
  function textoDe(el){ return (el.textContent || '').trim().replace(/\s+/g,' ').slice(0, 60); }
  document.addEventListener('click', function(ev){
    var t = ev.target;
    try {
      // pestañas dimensionales de EquiBox ([data-dim]) y similares
      var dim = t.closest ? t.closest('[data-dim]') : null;
      if (dim && dim.getAttribute('data-dim') && dim.getAttribute('data-dim').indexOf('+')===-1){
        send('tab', dim.getAttribute('data-dim')); return;
      }
      // subtemas (barra de subtabs de EquiBox)
      var st = t.closest ? t.closest('.subtab-bar button, .subtab-bar [role="tab"], .subtab-bar a') : null;
      if (st){ send('subtema', textoDe(st)); return; }
      // pestañas genéricas (Correo Neumático y otras: class="tab")
      var tab = t.closest ? t.closest('.tab') : null;
      if (tab){ send('tab', textoDe(tab)); return; }
      // tarjetas del index del HUB
      var card = t.closest ? t.closest('a.pcard') : null;
      if (card){ send('clic_tarjeta', card.getAttribute('title') || textoDe(card)); return; }
    } catch(e){}
  }, true);

  // ── fichas de equipo (EquiBox): envolver openModal si existe ─────────────
  window.addEventListener('load', function(){
    if (typeof window.openModal === 'function'){
      var _om = window.openModal;
      window.openModal = function(){
        try {
          var a = arguments[0];
          var d = (a && (a.name || a.id)) || (typeof a === 'string' ? a : '');
          send('ficha', d);
        } catch(e){}
        return _om.apply(this, arguments);
      };
    }
  });
})();
