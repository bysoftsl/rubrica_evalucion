# 🏆 Rúbrica de Evaluación Preliminar

Aplicación web interactiva para evaluación de proyectos con rúbrica por criterios. Ideal para procesos de selección, competencias académicas y evaluaciones estructuradas.

## ✨ Características

- **Interfaz intuitiva**: Navegación paso a paso entre secciones
- **6 criterios de evaluación** con rangos de puntuación personalizables
- **Selección dinámica**: Jurados, categorías y equipos cargados desde JSON o API remota
- **Validación en tiempo real**: Confirmación de puntuaciones dentro del rango permitido
- **Resumen visual**: Vista previa de evaluación antes de enviar
- **Modo local**: Pruebas sin backend con almacenamiento en `localStorage`
- **Exportación de datos**: Descarga de evaluaciones guardadas como JSON
- **Datos de ejemplo**: Fallback automático si el API no está disponible

## 📂 Estructura del Proyecto

```
.
├── index.html          # Página principal
├── css/
│   └── styles.css      # Estilos (mobile-friendly)
├── js/
│   └── app.js          # Lógica de la aplicación
├── data.json           # Datos maestros (jurados, categorías, equipos)
├── README.md           # Este archivo
└── .gitignore          # Archivos a ignorar en git
```

## 🚀 Inicio Rápido

### Opción 1: Servidor Local (Python)

```bash
cd HTML_Proyectos
python -m http.server 8080
```

Luego abre en el navegador: **http://localhost:8080**

### Opción 2: Archivo Directo

Simplemente abre `index.html` en tu navegador. El proyecto detectará modo local automáticamente.

### Opción 3: Servidor Node (si tienes Node instalado)

```bash
npx http-server
```

## ⚙️ Configuración

### Cargar datos desde JSON local

Por defecto, `data.json` contiene:

- **10 jurados** profesionales
- **2 categorías**: Junior, Senior
- **31 equipos** con sus integrantes

Puedes editar `data.json` directamente con tus propios datos.

### Conectar a Google Apps Script (Producción)

1. Abre tu Google Apps Script en `script.google.com`
2. **Copia esta función en tu script:**

```javascript
function doGet() {
  const datos = {
    status: 'ok',
    jurados: ['Prof. Juan Pérez', 'Prof. María López'],
    categorias: ['Junior', 'Senior'],
    equipos: [
      {
        codigo: 'T001',
        nombre: 'Mi Equipo',
        categoria: 'Junior',
        int1: 'Nombre 1',
        int2: 'Nombre 2',
        int3: null,
        int4: null,
        int5: null,
      },
    ],
  };
  return ContentService.createTextOutput(JSON.stringify(datos)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function doPost(e) {
  const datos = JSON.parse(e.postData.contents);
  // Aquí procesa los datos (guardar en Sheet, enviar email, etc.)
  return ContentService.createTextOutput('OK');
}
```

3. Publica como **Web App** → Acceso: "Cualquier usuario" sin autenticación
4. Copia la URL publicada
5. En `js/app.js`, línea 7, descomenta y reemplaza:

```javascript
var CONFIG = {
  API_URL: 'https://script.google.com/macros/s/TU_URL_AQUI/exec',
  LOCAL_DATA_URL: 'data.json',
  LOCAL_STORAGE_KEY: 'rubrica_evaluaciones_locales',
  TOTAL_SECS: 8,
};
```

## 📝 Uso

1. **Selecciona jurado, categoría y equipo** en la Sección 1
2. **Califica cada criterio** (secciones 2-6)
   - Elige un nivel: Excelente, Bueno, Básico, Insuficiente
   - Ingresa puntuación dentro del rango sugerido
   - Agrega observaciones (opcional)
3. **Revisa el resumen** en Sección 7
4. **Envía la evaluación**
   - En modo local: se guarda en `localStorage`
   - En producción: se envía a Google Apps Script

## 💾 Evaluaciones Locales

Durante pruebas, las evaluaciones se almacenan en el navegador. Puedes:

- **Exportar**: Descarge `evaluaciones-locales-FECHA.json`
- **Limpiar**: Elimine todos los registros locales
- **Inspeccionar** (consola del navegador):
  ```js
  JSON.parse(localStorage.getItem('rubrica_evaluaciones_locales'));
  ```

## 🔄 Criterios de Evaluación

### Configurados en `js/app.js` (RANGOS):

| Criterio          | Excelente | Bueno | Básico | Insuficiente |
| ----------------- | --------- | ----- | ------ | ------------ |
| 1. Comprensión    | 17–20     | 13–16 | 8–12   | 1–7          |
| 2. Coherencia     | 17–20     | 13–16 | 8–12   | 1–7          |
| 3. Integración    | 13–15     | 10–12 | 6–9    | 1–5          |
| 4. Calidad Doc    | 17–20     | 13–16 | 8–12   | 1–7          |
| 5. Viabilidad     | 13–15     | 10–12 | 6–9    | 1–5          |
| 6. Claridad Video | 8–10      | 6–7   | 4–5    | 1–3          |

**Puntuación máxima: 100 puntos**

## 🛠️ Desarrollo

Modificar comportamiento en `js/app.js`:

- **Cambiar colores**: Edita variables en `css/styles.css` (`:root`)
- **Agregar campos**: Modifica `data.json` y actualiza funciones en `app.js`
- **Timeout del servidor**: `CONFIG.TOTAL_SECS` (línea 10)

## 🚨 Troubleshooting

### "📄 Datos locales pero quiero API remota"

- Descomenta `API_URL` en `js/app.js`
- Verifica que Apps Script esté publicado y accesible

### "CORS Error"

- Esto ocurre si usas HTTP local. Es normal.
- El proyecto automáticamente carga `data.json` como fallback.
- Para producción, publica desde el mismo servidor que la API.

### "No se guardan las evaluaciones"

- Verifica que `localStorage` no esté deshabilitado en navegador
- En modo privado/incógnito, `localStorage` puede no persistir

## 📱 Compatibilidad

- ✅ Chrome, Firefox, Safari, Edge (versión reciente)
- ✅ Mobile (responsive design)
- ✅ Sin dependencias externas (vanilla JavaScript)

## 📄 Licencia

Este proyecto está disponible bajo licencia MIT. Úsalo libremente en tus evaluaciones.

## 👤 Autor

Preparado para evaluación de proyectos académicos y competencias innovadoras.

---

**¿Preguntas o sugerencias?** Abre un issue en GitHub o contacta al mantenedor.
