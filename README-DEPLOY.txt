WWRY · PAQUETE CORREGIDO

CAMBIOS URGENTES
1. Se añade /gracias/index.html para que el formulario ya no termine en 404.
2. Se añade /panel.html.
3. Se añade /.netlify/functions/panel-data para cargar solicitudes verificadas de Netlify Forms de forma privada.
4. La función existente de Resend NO se ha modificado en esta corrección.

CONFIGURACIÓN DEL PANEL EN NETLIFY
- PANEL_PASSWORD: contraseña privada para acceder a /panel.html
- NETLIFY_API_TOKEN: token de acceso a la API de Netlify. Se usa solo en la Function; nunca se envía al navegador.
- NETLIFY_SITE_ID: Project ID / Site ID del proyecto. Netlify puede exponerlo automáticamente; si no, configúralo manualmente.

FORMULARIO
- Mantener Form detection activado en Netlify.
- El formulario se llama reserva-wwry.
- Tras desplegar, hacer una solicitud real de prueba y comprobar Forms.

RUTAS A COMPROBAR DESPUÉS DEL DEPLOY
- /                  -> landing
- /gracias/          -> confirmación
- /panel.html        -> panel privado
- /.netlify/functions/panel-data -> debe responder 405 con GET; el panel usa POST

NOTA DE SEGURIDAD
El panel no incorpora el token de Netlify en el HTML. El navegador solo envía la contraseña a una Function por HTTPS; la Function consulta la API de Netlify desde servidor.
