# Progress+

App para apuntar mis videojuegos: **jugando, pendientes, en pausa, terminados y abandonados**.
Se instala en el móvil desde el navegador y funciona sin conexión. Los datos se guardan solo en el móvil.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Estructura de la página |
| `styles.css` | Colores, tipografías y diseño |
| `app.js` | Todo el funcionamiento, explicado en 8 partes |
| `manifest.webmanifest` | Nombre, icono y colores para instalarla como app |
| `sw.js` | Guarda la app en el móvil para abrirla sin conexión |
| `icons/` | Iconos de la app |

## Publicar en GitHub Pages

1. Sube todos los archivos (con la carpeta `icons`) a la raíz de un repositorio público.
2. En **Settings → Pages**, elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guarda.
3. Abre la dirección en Chrome desde el móvil y, en el menú ⋮, elige **Instalar aplicación** o **Añadir a pantalla de inicio**.

## Cambios habituales

- **Añadir una plataforma:** en `app.js`, añádela a `PLATAFORMAS` y a `ORDEN_PLATAFORMAS`.
- **Cambiar el color de un estado:** en `app.js`, edita `ESTADOS` (el color y su versión `rgb`).
- **Actualizar la app:** sube los archivos cambiados. El móvil cogerá la versión nueva la próxima vez que abras la app con conexión.

## Créditos

Tipografías Chakra Petch y Manrope, de Google Fonts (licencia SIL Open Font License).
