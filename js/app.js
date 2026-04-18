// ============================================================
// CONFIGURACIÓN
// ============================================================
var CONFIG = {
  // URL del Google Apps Script Web App
  // Reemplaza con tu URL al publicar el script
  API_URL:
    'https://script.google.com/macros/s/AKfycbxnS5ZtXE9z5S-4uBeFE4_wjR91ndTL0mQofeRy6sAzSRgnpB1dLV61Bw3aTiN47aYC0g/exec',
  LOCAL_DATA_URL: 'data.json',
  LOCAL_STORAGE_KEY: 'rubrica_evaluaciones_locales',
  TOTAL_SECS: 8,
};

// Datos maestros — se cargan desde API o se definen aquí
var DATOS = {
  jurados: [],
  categorias: [],
  equipos: [],
};

// Rangos por criterio
var RANGOS = {
  1: {
    Excelente: { min: 17, max: 20 },
    Bueno: { min: 13, max: 16 },
    Basico: { min: 8, max: 12 },
    Insuficiente: { min: 1, max: 7 },
  },
  2: {
    Excelente: { min: 17, max: 20 },
    Bueno: { min: 13, max: 16 },
    Basico: { min: 8, max: 12 },
    Insuficiente: { min: 1, max: 7 },
  },
  3: {
    Excelente: { min: 13, max: 15 },
    Bueno: { min: 10, max: 12 },
    Basico: { min: 6, max: 9 },
    Insuficiente: { min: 1, max: 5 },
  },
  4: {
    Excelente: { min: 17, max: 20 },
    Bueno: { min: 13, max: 16 },
    Basico: { min: 8, max: 12 },
    Insuficiente: { min: 1, max: 7 },
  },
  5: {
    Excelente: { min: 13, max: 15 },
    Bueno: { min: 10, max: 12 },
    Basico: { min: 6, max: 9 },
    Insuficiente: { min: 1, max: 5 },
  },
  6: {
    Excelente: { min: 8, max: 10 },
    Bueno: { min: 6, max: 7 },
    Basico: { min: 4, max: 5 },
    Insuficiente: { min: 1, max: 3 },
  },
};

var NOMBRES_CRITERIOS = {
  1: 'Comprensión del problema',
  2: 'Coherencia de la solución',
  3: 'Integración de herramientas',
  4: 'Calidad del documento',
  5: 'Viabilidad preliminar',
  6: 'Claridad del video pitch',
};

// Estado actual
var seccionActual = 1;

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
  cargarDatos();
  inicializarEventos();
  actualizarProgreso();
  actualizarAccionesLocales();
});

function describirErrorApi(response, texto, parseErr) {
  if (
    texto &&
    texto.indexOf(
      'No se encontró la función de la secuencia de comandos: doGet',
    ) !== -1
  ) {
    return 'La Web App de Apps Script no tiene una función doGet() publicada';
  }

  if (response && response.status === 403) {
    return 'La API respondió 403. Revisa permisos y vuelve a desplegar la Web App';
  }

  if (parseErr) {
    return 'La API no devolvió JSON válido';
  }

  if (response && !response.ok) {
    return 'HTTP error: ' + response.status;
  }

  return 'Respuesta inesperada de la API';
}

function leerJsonDesdeRespuesta(response) {
  return response.text().then(function (texto) {
    if (!response.ok) {
      throw new Error(describirErrorApi(response, texto));
    }

    try {
      return JSON.parse(texto);
    } catch (parseErr) {
      throw new Error(describirErrorApi(response, texto, parseErr));
    }
  });
}

function esEntornoLocal() {
  return (
    window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );
}

function cargarDatosLocales() {
  return fetch(CONFIG.LOCAL_DATA_URL).then(function (response) {
    console.log('📡 Response local status:', response.status);
    return leerJsonDesdeRespuesta(response);
  });
}

function tieneApiRemotaConfigurada() {
  return Boolean(CONFIG.API_URL);
}

function obtenerEvaluacionesLocales() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG.LOCAL_STORAGE_KEY) || '[]');
  } catch (err) {
    console.warn('⚠️ No se pudo leer el almacenamiento local, se reiniciará.');
    return [];
  }
}

function guardarEvaluacionLocal(datos) {
  var evaluaciones = obtenerEvaluacionesLocales();

  evaluaciones.push({
    fecha: new Date().toISOString(),
    datos: datos,
  });

  localStorage.setItem(CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(evaluaciones));
  actualizarAccionesLocales();

  return evaluaciones.length;
}

function actualizarAccionesLocales() {
  var accionesEl = document.getElementById('accionesLocales');
  var contadorEl = document.getElementById('contadorEvaluacionesLocales');
  var exportarEl = document.getElementById('btnExportarLocales');
  var limpiarEl = document.getElementById('btnLimpiarLocales');
  var total = obtenerEvaluacionesLocales().length;

  if (!accionesEl || !contadorEl || !exportarEl || !limpiarEl) {
    return;
  }

  if (!esEntornoLocal()) {
    accionesEl.style.display = 'none';
    return;
  }

  accionesEl.style.display = 'flex';
  contadorEl.textContent = 'Evaluaciones locales guardadas: ' + total;
  exportarEl.disabled = total === 0;
  limpiarEl.disabled = total === 0;
}

function exportarEvaluacionesLocales() {
  var evaluaciones = obtenerEvaluacionesLocales();
  var fecha;
  var archivo;
  var enlace;

  if (!evaluaciones.length) {
    alert('No hay evaluaciones locales para exportar.');
    return;
  }

  fecha = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  archivo = new Blob(
    [JSON.stringify({ evaluaciones: evaluaciones }, null, 2)],
    {
      type: 'application/json',
    },
  );
  enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = 'evaluaciones-locales-' + fecha + '.json';
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(enlace.href);
}

function limpiarEvaluacionesLocales() {
  if (!obtenerEvaluacionesLocales().length) {
    actualizarAccionesLocales();
    return;
  }

  if (
    !window.confirm(
      'Se eliminarán todas las evaluaciones guardadas localmente.',
    )
  ) {
    return;
  }

  localStorage.removeItem(CONFIG.LOCAL_STORAGE_KEY);
  actualizarAccionesLocales();
}

function probarConexion() {
  var statusEl = document.getElementById('statusConexion');
  if (statusEl) statusEl.textContent = '🔄 Probando conexión...';

  if (esEntornoLocal()) {
    cargarDatosLocales()
      .then(function (json) {
        console.log('✅ Datos locales OK:', json);
        if (statusEl) {
          statusEl.textContent =
            '📄 Modo local — ' +
            json.jurados.length +
            ' jurados, ' +
            json.equipos.length +
            ' equipos';
          statusEl.style.color = 'green';
        }
        DATOS.jurados = json.jurados;
        DATOS.categorias = json.categorias;
        DATOS.equipos = json.equipos;
        llenarSelectJurados();
        llenarSelectCategorias();
        llenarSelectEquipos();
      })
      .catch(function (err) {
        console.error('❌ Error cargando datos locales:', err);
        if (statusEl) {
          statusEl.textContent = '❌ Error en data.json: ' + err.message;
          statusEl.style.color = 'red';
        }
        usarDatosEjemplo();
      });
    return;
  }

  fetch(CONFIG.API_URL + '?test=1')
    .then(function (response) {
      console.log('Status HTTP:', response.status);
      console.log('OK:', response.ok);
      return leerJsonDesdeRespuesta(response);
    })
    .then(function (json) {
      console.log('✅ Conexión OK:', json);
      if (statusEl) {
        statusEl.textContent =
          '✅ Conectado — ' +
          json.jurados.length +
          ' jurados, ' +
          json.equipos.length +
          ' equipos';
        statusEl.style.color = 'green';
      }
      DATOS.jurados = json.jurados;
      DATOS.categorias = json.categorias;
      DATOS.equipos = json.equipos;
      llenarSelectJurados();
      llenarSelectCategorias();
      llenarSelectEquipos();
    })
    .catch(function (err) {
      console.error('❌ Error de conexión:', err);
      if (statusEl) {
        statusEl.textContent = '❌ Sin conexión: ' + err.message;
        statusEl.style.color = 'red';
      }
      // Usar datos de ejemplo como fallback
      usarDatosEjemplo();
    });
}

// ============================================================
// CARGAR DATOS DESDE API O JSON LOCAL
// ============================================================
function cargarDatos() {
  document.getElementById('loaderOverlay').style.display = 'flex';

  if (esEntornoLocal()) {
    console.log(
      '📄 Entorno local detectado. Cargando desde:',
      CONFIG.LOCAL_DATA_URL,
    );
    cargarDatosLocales()
      .then(function (data) {
        console.log('✅ Datos desde JSON local:', data);
        cargarDatosEnMemoria(data, '📄 Datos locales (JSON)');
      })
      .catch(function (errLocal) {
        console.error('❌ Falló carga local:', errLocal.message);

        var statusEl = document.getElementById('statusConexion');
        if (statusEl) {
          statusEl.textContent =
            '⚠️ Usando datos de ejemplo — ' + errLocal.message;
          statusEl.style.color = 'orange';
        }
        usarDatosEjemplo();
        document.getElementById('loaderOverlay').style.display = 'none';
      });
    return;
  }

  console.log('🔄 Intentando cargar datos desde API:', CONFIG.API_URL);

  // Primero intenta API remota
  fetch(CONFIG.API_URL)
    .then(function (response) {
      console.log('📡 Response API status:', response.status);
      return leerJsonDesdeRespuesta(response);
    })
    .then(function (data) {
      console.log('✅ Datos desde API remota:', data);
      cargarDatosEnMemoria(data, '✅ API remota');
    })
    .catch(function (errApi) {
      console.warn('⚠️ API remota no disponible:', errApi.message);
      console.log('🔄 Intentando cargar desde data.json local...');

      // Si falla, intenta JSON local
      cargarDatosLocales()
        .then(function (data) {
          console.log('✅ Datos desde JSON local:', data);
          cargarDatosEnMemoria(data, '📄 Datos locales (JSON)');
        })
        .catch(function (errLocal) {
          console.error('❌ Falló carga local:', errLocal.message);
          console.log('📋 Usando datos de ejemplo...');

          var statusEl = document.getElementById('statusConexion');
          if (statusEl) {
            statusEl.textContent =
              '⚠️ Usando datos de ejemplo. API: ' +
              errApi.message.substring(0, 30);
            statusEl.style.color = 'orange';
          }
          usarDatosEjemplo();
          document.getElementById('loaderOverlay').style.display = 'none';
        });
    });
}

function cargarDatosEnMemoria(data, origen) {
  if (data.status === 'ok') {
    DATOS.jurados = data.jurados || [];
    DATOS.categorias = data.categorias || [];
    DATOS.equipos = data.equipos || [];

    llenarSelectJurados();
    llenarSelectCategorias();
    llenarSelectEquipos();

    var statusEl = document.getElementById('statusConexion');
    if (statusEl) {
      statusEl.textContent =
        origen +
        ' — ' +
        DATOS.jurados.length +
        ' jurados | ' +
        DATOS.equipos.length +
        ' equipos';
      statusEl.style.color = 'green';
    }

    console.log('✅ Jurados   :', DATOS.jurados.length);
    console.log('✅ Categorías:', DATOS.categorias.length);
    console.log('✅ Equipos   :', DATOS.equipos.length);

    document.getElementById('loaderOverlay').style.display = 'none';
  } else {
    throw new Error(
      'Formato de datos inválido: ' + (data.mensaje || 'sin status ok'),
    );
  }
}

function usarDatosEjemplo() {
  DATOS.jurados = [
    'Prof. Byron Zurita',
    'Prof. Juan Carlos López',
    'Prof. Israel Herrera',
  ];

  DATOS.categorias = ['Junior', 'Senior', 'Poster'];

  DATOS.equipos = [
    {
      codigo: 'E001',
      nombre: 'Equipo Ruta Ágil',
      categoria: 'Junior',
      int1: 'Ana Pérez',
      int2: 'Luis Gómez',
      int3: 'Carla Torres',
      int4: 'Mateo Benítez',
      int5: 'Sara Mena',
    },
    {
      codigo: 'E002',
      nombre: 'Equipo DataSmart',
      categoria: 'Senior',
      int1: 'Pedro Ruiz',
      int2: 'María León',
      int3: 'Juan Ron',
      int4: 'Luisa Berbe',
      int5: 'Santos Palus',
    },
    {
      codigo: 'E003',
      nombre: 'Equipo Logitc',
      categoria: 'Poster',
      int1: 'Rosa',
      int2: 'Juan',
      int3: 'Antony',
      int4: 'Balsalmo',
      int5: 'Pedro',
    },
  ];

  llenarSelectJurados();
  llenarSelectCategorias();
  llenarSelectEquipos();

  console.warn('⚠️ Usando datos de ejemplo. Verifica la conexión con la API.');
}

// ============================================================
// ENVIAR FORMULARIO — Versión mejorada con manejo de CORS
// ============================================================
function enviarFormulario() {
  // Mostrar loader
  document.getElementById('loaderOverlay').style.display = 'flex';

  var datos = recopilarDatos();
  console.log('📤 Enviando datos:', JSON.stringify(datos));

  // Apps Script requiere no-cors en fetch directo
  // Usamos un iframe oculto como alternativa robusta
  enviarConFormPost(datos);
}

function enviarConFormPost(datos) {
  try {
    // Crear formulario oculto para envío POST
    var formOculto = document.createElement('form');
    formOculto.method = 'POST';
    formOculto.action = CONFIG.API_URL;
    formOculto.target = 'iframeOculto';
    formOculto.style.display = 'none';

    // Agregar datos como campo JSON
    var inputDatos = document.createElement('input');
    inputDatos.type = 'hidden';
    inputDatos.name = 'datos';
    inputDatos.value = JSON.stringify(datos);
    formOculto.appendChild(inputDatos);

    // Crear iframe oculto para recibir respuesta
    var iframe = document.getElementById('iframeOculto');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.name = 'iframeOculto';
      iframe.id = 'iframeOculto';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }

    // Evento cuando iframe carga respuesta
    iframe.onload = function () {
      document.getElementById('loaderOverlay').style.display = 'none';
      document.getElementById('modalTotal').textContent = datos.totalPuntos;
      document.getElementById('modalMensaje').textContent =
        'Evaluación de "' +
        datos.nombreEquipo +
        '" registrada correctamente.\n' +
        'Estado: ' +
        datos.estadoFinal;
      document.getElementById('modalExito').style.display = 'flex';

      // Limpiar form del DOM
      document.body.removeChild(formOculto);
    };

    document.body.appendChild(formOculto);
    formOculto.submit();
  } catch (err) {
    document.getElementById('loaderOverlay').style.display = 'none';
    document.getElementById('modalErrorMsg').textContent =
      'Error al enviar: ' + err.message + '. Intente nuevamente.';
    document.getElementById('modalError').style.display = 'flex';
    console.error('🔴 Error envío:', err);
  }
}

// ============================================================
// UTILIDADES ADICIONALES
// ============================================================

// Filtrar equipos por categoría seleccionada
document.addEventListener('DOMContentLoaded', function () {
  var selCategoria = document.getElementById('categoria');
  if (selCategoria) {
    selCategoria.addEventListener('change', function () {
      filtrarEquiposPorCategoria(this.value);
    });
  }
});

function filtrarEquiposPorCategoria(categoria) {
  var selEquipo = document.getElementById('equipo');
  var valorActual = selEquipo.value;

  // Limpiar opciones excepto la primera
  while (selEquipo.options.length > 1) {
    selEquipo.remove(1);
  }

  // Filtrar equipos por categoría
  var equiposFiltrados = categoria
    ? DATOS.equipos.filter(function (eq) {
        return eq.categoria === categoria;
      })
    : DATOS.equipos;

  equiposFiltrados.forEach(function (eq) {
    var opt = document.createElement('option');
    opt.value = eq.nombre;
    opt.textContent = eq.nombre + ' (' + eq.codigo + ')';
    selEquipo.appendChild(opt);
  });

  // Restaurar valor si sigue disponible
  if (valorActual) {
    selEquipo.value = valorActual;
  }

  // Ocultar info equipo si cambió categoría
  document.getElementById('equipoInfo').style.display = 'none';
}

// Contador de caracteres en observaciones
document.addEventListener('DOMContentLoaded', function () {
  for (var c = 1; c <= 6; c++) {
    (function (criterio) {
      var obs = document.getElementById('obs_' + criterio);
      if (!obs) return;

      // Crear contador
      var contador = document.createElement('span');
      contador.id = 'contador-obs-' + criterio;
      contador.className = 'contador-chars';
      contador.textContent = '0 / 200';
      contador.style.cssText =
        'font-size:0.78rem;color:var(--gray-600);' +
        'display:block;text-align:right;margin-top:4px;';
      obs.parentNode.insertBefore(contador, obs.nextSibling);

      obs.addEventListener('input', function () {
        var len = this.value.length;
        contador.textContent = len + ' / 200';
        contador.style.color = len > 180 ? 'var(--danger)' : 'var(--gray-600)';
      });
    })(c);
  }
});

// Prevenir envío accidental con Enter
document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('rubricaForm');
  if (form) {
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var tag = e.target.tagName.toLowerCase();
        if (tag !== 'textarea') {
          e.preventDefault();
        }
      }
    });
  }
});

// Confirmar antes de salir si hay datos ingresados
window.addEventListener('beforeunload', function (e) {
  if (seccionActual > 1) {
    e.preventDefault();
    e.returnValue =
      '¿Seguro que deseas salir? Los datos ingresados se perderán.';
  }
});

function llenarSelectJurados() {
  var sel = document.getElementById('jurado');
  DATOS.jurados.forEach(function (j) {
    var opt = document.createElement('option');
    opt.value = j;
    opt.textContent = j;
    sel.appendChild(opt);
  });
}

function llenarSelectCategorias() {
  var sel = document.getElementById('categoria');
  DATOS.categorias.forEach(function (c) {
    var opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

function llenarSelectEquipos() {
  var sel = document.getElementById('equipo');
  DATOS.equipos.forEach(function (eq) {
    var opt = document.createElement('option');
    opt.value = eq.nombre;
    opt.textContent = eq.nombre + ' (' + eq.codigo + ')';
    sel.appendChild(opt);
  });
}

// ============================================================
// EVENTOS
// ============================================================
function inicializarEventos() {
  // Mostrar integrantes al seleccionar equipo
  document.getElementById('equipo').addEventListener('change', function () {
    mostrarIntegrantes(this.value);
  });

  // Validar puntuación al cambiar nivel en cada criterio
  for (var c = 1; c <= 6; c++) {
    (function (criterio) {
      // Evento en radios de nivel
      var radios = document.querySelectorAll(
        'input[name="nivel_' + criterio + '"]',
      );
      radios.forEach(function (radio) {
        radio.addEventListener('change', function () {
          actualizarRangoHint(
            criterio,
            this.value,
            this.dataset.min,
            this.dataset.max,
          );
          validarPuntuacion(criterio);
        });
      });

      // Evento en input de puntuación
      var inputPunt = document.getElementById('punt_' + criterio);
      if (inputPunt) {
        inputPunt.addEventListener('input', function () {
          validarPuntuacion(criterio);
        });
      }
    })(c);
  }
}

function mostrarIntegrantes(nombreEquipo) {
  var equipoInfo = document.getElementById('equipoInfo');
  var lista = document.getElementById('integrantesList');

  var equipo = DATOS.equipos.find(function (eq) {
    return eq.nombre === nombreEquipo;
  });

  if (equipo) {
    var integrantes = [
      equipo.int1,
      equipo.int2,
      equipo.int3,
      equipo.int4,
      equipo.int5,
    ].filter(Boolean);
    lista.innerHTML = integrantes
      .map(function (int) {
        return '<span class="integrante-tag">👤 ' + int + '</span>';
      })
      .join('');
    equipoInfo.style.display = 'block';
  } else {
    equipoInfo.style.display = 'none';
  }
}

function actualizarRangoHint(criterio, nivel, min, max) {
  var hint = document.getElementById('rango-hint-' + criterio);
  var input = document.getElementById('punt_' + criterio);
  if (!hint || !input) return;

  hint.textContent = 'Rango válido: ' + min + ' — ' + max + ' pts';
  hint.className = 'rango-hint';
  input.min = min;
  input.max = max;
  input.placeholder = 'Entre ' + min + ' y ' + max;
}

function validarPuntuacion(criterio) {
  var radioSeleccionado = document.querySelector(
    'input[name="nivel_' + criterio + '"]:checked',
  );
  var inputPunt = document.getElementById('punt_' + criterio);
  var hint = document.getElementById('rango-hint-' + criterio);
  var errMsg = document.getElementById('err-punt-' + criterio);

  if (!radioSeleccionado || !inputPunt) return true;

  var min = parseInt(radioSeleccionado.dataset.min);
  var max = parseInt(radioSeleccionado.dataset.max);
  var punt = parseInt(inputPunt.value);

  if (isNaN(punt)) {
    hint.className = 'rango-hint';
    inputPunt.classList.remove('error');
    return false;
  }

  if (punt >= min && punt <= max) {
    hint.textContent = '✅ Puntuación válida';
    hint.className = 'rango-hint valido';
    inputPunt.classList.remove('error');
    if (errMsg) errMsg.classList.remove('visible');
    return true;
  } else {
    hint.textContent = '❌ Fuera de rango ' + min + '-' + max;
    hint.className = 'rango-hint invalido';
    inputPunt.classList.add('error');
    if (errMsg) errMsg.classList.add('visible');
    return false;
  }
}

// ============================================================
// NAVEGACIÓN ENTRE SECCIONES
// ============================================================
function navegarSeccion(direccion) {
  if (direccion === 1 && !validarSeccionActual()) return;

  var anterior = seccionActual;
  seccionActual += direccion;

  // Ocultar sección anterior
  var secAnterior = document.getElementById('seccion-' + anterior);
  if (secAnterior) {
    secAnterior.classList.remove('activa');
  }

  // Mostrar sección actual
  var secActual = document.getElementById('seccion-' + seccionActual);
  if (secActual) {
    secActual.classList.add('activa');
    secActual.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Si es la última sección generar resumen
  if (seccionActual === CONFIG.TOTAL_SECS) {
    generarResumen();
  }

  actualizarBotones();
  actualizarProgreso();
}

function actualizarBotones() {
  var btnAnterior = document.getElementById('btnAnterior');
  var btnSiguiente = document.getElementById('btnSiguiente');
  var btnEnviar = document.getElementById('btnEnviar');

  // Botón anterior
  btnAnterior.style.display = seccionActual > 1 ? 'block' : 'none';

  // Botón siguiente vs enviar
  if (seccionActual === CONFIG.TOTAL_SECS) {
    btnSiguiente.style.display = 'none';
    btnEnviar.style.display = 'block';
  } else {
    btnSiguiente.style.display = 'block';
    btnEnviar.style.display = 'none';
  }
}

function actualizarProgreso() {
  var porcentaje = (seccionActual / CONFIG.TOTAL_SECS) * 100;
  var barra = document.getElementById('progressBar');
  var texto = document.getElementById('progressText');
  if (barra) barra.style.width = porcentaje + '%';
  if (texto)
    texto.textContent = 'Paso ' + seccionActual + ' de ' + CONFIG.TOTAL_SECS;
}

// ============================================================
// VALIDACIONES POR SECCIÓN
// ============================================================
function validarSeccionActual() {
  switch (seccionActual) {
    case 1:
      return validarSeccion1();
    case 2:
      return validarCriterio(1);
    case 3:
      return validarCriterio(2);
    case 4:
      return validarCriterio(3);
    case 5:
      return validarCriterio(4);
    case 6:
      return validarCriterio(5);
    case 7:
      return validarCriterio(6);
    default:
      return true;
  }
}

function validarSeccion1() {
  var valido = true;
  var campos = ['jurado', 'categoria', 'equipo'];
  var errores = ['err-jurado', 'err-categoria', 'err-equipo'];

  campos.forEach(function (campo, idx) {
    var el = document.getElementById(campo);
    var err = document.getElementById(errores[idx]);
    if (!el.value) {
      el.classList.add('error');
      if (err) err.classList.add('visible');
      valido = false;
    } else {
      el.classList.remove('error');
      if (err) err.classList.remove('visible');
    }
  });
  return valido;
}

function validarCriterio(criterio) {
  var valido = true;

  // Validar nivel seleccionado
  var radioSel = document.querySelector(
    'input[name="nivel_' + criterio + '"]:checked',
  );
  var errNivel = document.getElementById('err-nivel-' + criterio);
  if (!radioSel) {
    if (errNivel) errNivel.classList.add('visible');
    valido = false;
  } else {
    if (errNivel) errNivel.classList.remove('visible');
  }

  // Validar puntuación
  var inputPunt = document.getElementById('punt_' + criterio);
  var errPunt = document.getElementById('err-punt-' + criterio);
  if (!inputPunt.value || !validarPuntuacion(criterio)) {
    if (errPunt) errPunt.classList.add('visible');
    valido = false;
  } else {
    if (errPunt) errPunt.classList.remove('visible');
  }

  return valido;
}

// ============================================================
// GENERAR RESUMEN
// ============================================================
function generarResumen() {
  var container = document.getElementById('resumenContainer');
  var totalEl = document.getElementById('totalPuntos');
  var estadoBox = document.getElementById('estadoBox');
  var estadoText = document.getElementById('estadoTexto');
  var total = 0;
  var hayErrores = false;
  var html = '';

  // Datos generales
  var jurado = document.getElementById('jurado').value;
  var categoria = document.getElementById('categoria').value;
  var equipo = document.getElementById('equipo').value;

  html += '<div class="resumen-datos">';
  html += '<p><strong>👤 Jurado:</strong> ' + jurado + '</p>';
  html += '<p><strong>📁 Categoría:</strong> ' + categoria + '</p>';
  html += '<p><strong>🏆 Equipo:</strong> ' + equipo + '</p>';
  html += '</div><hr style="margin:16px 0;border-color:var(--gray-200)">';

  // Criterios
  for (var c = 1; c <= 6; c++) {
    var radioSel = document.querySelector(
      'input[name="nivel_' + c + '"]:checked',
    );
    var punt = parseInt(document.getElementById('punt_' + c).value) || 0;
    var obs = document.getElementById('obs_' + c).value || '';
    var nivel = radioSel ? radioSel.value : 'Sin nivel';
    var rango = radioSel ? RANGOS[c][nivel] : null;
    var esValido = rango && punt >= rango.min && punt <= rango.max;

    if (esValido) {
      total += punt;
    } else {
      hayErrores = true;
    }

    html +=
      '<div class="resumen-item ' + (esValido ? 'valido' : 'invalido') + '">';
    html += '<div>';
    html +=
      '<div class="resumen-criterio">Criterio ' +
      c +
      ' — ' +
      NOMBRES_CRITERIOS[c] +
      '</div>';
    html +=
      '<div class="resumen-nivel">' +
      nivel +
      (obs ? ' | ' + obs : '') +
      '</div>';
    html += '</div>';
    html += '<div style="display:flex;align-items:center;gap:10px;">';
    html += '<span class="resumen-punt">' + punt + ' pts</span>';
    html +=
      '<span class="resumen-estado">' + (esValido ? '✅' : '❌') + '</span>';
    html += '</div>';
    html += '</div>';
  }

  container.innerHTML = html;

  // Actualizar total
  if (totalEl) totalEl.textContent = total;

  // Actualizar estado
  if (estadoBox && estadoText) {
    if (hayErrores) {
      estadoBox.className = 'estado-box revisar';
      estadoText.textContent = '⚠️ REVISAR ERRORES';
    } else {
      estadoBox.className = 'estado-box completo';
      estadoText.textContent = '✅ COMPLETO';
    }
  }
}

// ============================================================
// RECOPILAR DATOS DEL FORMULARIO
// ============================================================
function recopilarDatos() {
  var equipo = document.getElementById('equipo').value;
  var equipoData =
    DATOS.equipos.find(function (eq) {
      return eq.nombre === equipo;
    }) || {};

  var datos = {
    jurado: document.getElementById('jurado').value,
    categoria: document.getElementById('categoria').value,
    codEquipo: equipoData.codigo || '',
    nombreEquipo: equipoData.nombre || equipo,
    int1: equipoData.int1 || '',
    int2: equipoData.int2 || '',
    int3: equipoData.int3 || '',
    int4: equipoData.int4 || '',
    int5: equipoData.int5 || '',
    criterios: [],
  };

  for (var c = 1; c <= 6; c++) {
    var radioSel = document.querySelector(
      'input[name="nivel_' + c + '"]:checked',
    );
    var punt = parseInt(document.getElementById('punt_' + c).value) || 0;
    var obs = document.getElementById('obs_' + c).value || '';
    var nivel = radioSel ? radioSel.value : '';
    var rango = nivel && RANGOS[c][nivel] ? RANGOS[c][nivel] : null;
    var esValido = rango && punt >= rango.min && punt <= rango.max;

    datos.criterios.push({
      numero: c,
      nombre: NOMBRES_CRITERIOS[c],
      nivel: nivel,
      punt: punt,
      obs: obs,
      valido: esValido,
    });
  }

  // Calcular total
  datos.totalPuntos = datos.criterios.reduce(function (sum, cr) {
    return sum + (cr.valido ? cr.punt : 0);
  }, 0);

  datos.estadoFinal = datos.criterios.some(function (cr) {
    return !cr.valido;
  })
    ? '⚠️ REVISAR ERRORES'
    : '✅ COMPLETO';

  return datos;
}

// ============================================================
// ENVIAR FORMULARIO
// ============================================================
function enviarFormulario() {
  document.getElementById('loaderOverlay').style.display = 'flex';

  var datos = recopilarDatos();
  console.log('📤 Enviando datos:', JSON.stringify(datos, null, 2));

  if (esEntornoLocal()) {
    try {
      var totalGuardadas = guardarEvaluacionLocal(datos);
      console.log(
        '💾 Evaluación guardada en localStorage. Total:',
        totalGuardadas,
      );

      document.getElementById('loaderOverlay').style.display = 'none';
      document.getElementById('modalTotal').textContent = datos.totalPuntos;
      document.getElementById('modalMensaje').textContent =
        'Evaluación de "' +
        datos.nombreEquipo +
        '" guardada localmente para pruebas.\n' +
        'Registros locales acumulados: ' +
        totalGuardadas;
      actualizarAccionesLocales();
      document.getElementById('modalExito').style.display = 'flex';
      return;
    } catch (errLocal) {
      console.error('❌ Error guardando evaluación local:', errLocal);
      document.getElementById('loaderOverlay').style.display = 'none';
      document.getElementById('modalErrorMsg').textContent =
        'Error guardando localmente: ' + errLocal.message;
      document.getElementById('modalError').style.display = 'flex';
      return;
    }
  }

  if (!tieneApiRemotaConfigurada()) {
    document.getElementById('loaderOverlay').style.display = 'none';
    document.getElementById('modalErrorMsg').textContent =
      'No hay una API configurada en app.js para enviar la evaluación.';
    document.getElementById('modalError').style.display = 'flex';
    return;
  }

  fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
    .then(function (response) {
      console.log('📡 POST status:', response.status);
      console.log('📡 POST type  :', response.type);
      // Con no-cors el status siempre es 0 y type es "opaque"
      // Consideramos exitoso si no hay error de red
      return response.text().catch(function () {
        return '{}';
      });
    })
    .then(function (texto) {
      console.log('✅ Respuesta POST:', texto);
      document.getElementById('loaderOverlay').style.display = 'none';
      document.getElementById('modalTotal').textContent = datos.totalPuntos;
      document.getElementById('modalMensaje').textContent =
        'Evaluación de "' +
        datos.nombreEquipo +
        '" enviada.\n' +
        'Verifica la hoja EVALUACIONES en Google Sheets.';
      document.getElementById('modalExito').style.display = 'flex';
    })
    .catch(function (err) {
      console.error('❌ Error POST:', err);
      document.getElementById('loaderOverlay').style.display = 'none';
      document.getElementById('modalErrorMsg').textContent =
        'Error: ' + err.message + '\n\nVerifica la URL del API en app.js';
      document.getElementById('modalError').style.display = 'flex';
    });
}

// ============================================================
// REINICIAR FORMULARIO
// ============================================================
function reiniciarFormulario() {
  // Cerrar modal
  cerrarModal('modalExito');
  actualizarAccionesLocales();

  // Resetear form
  document.getElementById('rubricaForm').reset();

  // Limpiar clases de error
  document.querySelectorAll('.error').forEach(function (el) {
    el.classList.remove('error');
  });
  document.querySelectorAll('.error-msg').forEach(function (el) {
    el.classList.remove('visible');
  });
  document.querySelectorAll('.rango-hint').forEach(function (el) {
    el.className = 'rango-hint';
    el.textContent = 'Seleccione un nivel primero';
  });

  // Ocultar info equipo
  document.getElementById('equipoInfo').style.display = 'none';

  // Volver a sección 1
  document
    .getElementById('seccion-' + seccionActual)
    .classList.remove('activa');
  seccionActual = 1;
  document.getElementById('seccion-1').classList.add('activa');

  actualizarBotones();
  actualizarProgreso();

  // Scroll al inicio
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// CERRAR MODAL
// ============================================================
function cerrarModal(id) {
  var modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function (e) {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.style.display = 'none';
  }
});
