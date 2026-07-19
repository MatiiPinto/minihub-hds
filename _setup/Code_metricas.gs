// ════════════════════════════════════════════════════════════════════════════
// Code_metricas.gs — Métricas anónimas del HUB público HDS
//
// Recibe POST de metrics.js y agrega una fila a la hoja "METRICAS":
// Fecha · Hora · Visitante · Sesión · Evento · Plataforma · Detalle · Dispositivo.
// Sin IP ni datos personales (el visitante es un id aleatorio de navegador).
//
// INSTALACIÓN (una vez):
//   1. Crear una Google Sheet nueva (ej. "METRICAS HUB Publico HDS").
//   2. Extensiones → Apps Script → pegar este archivo completo.
//   3. Implementar → Nueva implementación → tipo "Aplicación web":
//        · Ejecutar como: Yo
//        · Acceso: Cualquier persona
//   4. Copiar la URL /exec y pegarla en metrics.js → METRICS_URL (repo minihub-hds).
//
// Eventos que llegan:
//   visita       → apertura de una plataforma (detalle: especialidad/sistema si
//                  venía en el link compartido)
//   latido       → cada 30 s con la pestaña visible (detalle: seg acumulados)
//   salida       → al cerrar/salir (detalle: segundos totales de permanencia)
//   tab/subtema  → pestaña o subtema consultado (detalle: cuál)
//   ficha        → ficha de equipo abierta en EquiBox (detalle: cuál)
//   clic_tarjeta → tarjeta clickeada en el index del HUB
// ════════════════════════════════════════════════════════════════════════════
var TZ = 'America/Santiago';

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('METRICAS') || ss.insertSheet('METRICAS');
    if (sh.getLastRow() === 0) {
      sh.appendRow(['Fecha', 'Hora', 'Visitante', 'Sesión', 'Evento',
                    'Plataforma', 'Detalle', 'Dispositivo']);
      sh.setFrozenRows(1);
    }
    var p = (e && e.parameter) || {};
    var now = new Date();
    sh.appendRow([
      Utilities.formatDate(now, TZ, 'yyyy-MM-dd'),
      Utilities.formatDate(now, TZ, 'HH:mm:ss'),
      String(p.v || '').slice(0, 30),
      String(p.s || '').slice(0, 20),
      String(p.evento || '').slice(0, 30),
      String(p.plataforma || '').slice(0, 60),
      String(p.detalle || '').slice(0, 90),
      String(p.disp || '').slice(0, 15)
    ]);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error: ' + err);
  }
}

// GET de prueba: abrir la URL /exec debe responder "Métricas HUB público activas".
function doGet() {
  return ContentService.createTextOutput('Métricas HUB público activas');
}
