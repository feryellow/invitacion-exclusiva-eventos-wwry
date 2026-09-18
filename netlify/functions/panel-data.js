exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) {}

  const expected = process.env.PANEL_PASSWORD;
  if (!expected) return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Falta configurar PANEL_PASSWORD en Netlify.' }) };
  if (!body.password || body.password !== expected) return { statusCode: 401, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Contraseña incorrecta.' }) };

  const token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  if (!token || !siteId) return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Falta NETLIFY_API_TOKEN o NETLIFY_SITE_ID.' }) };

  const headers = { Authorization: `Bearer ${token}`, 'User-Agent': 'WWRY Invitation Panel' };
  try {
    const formsResp = await fetch(`https://api.netlify.com/api/v1/sites/${encodeURIComponent(siteId)}/forms`, { headers });
    if (!formsResp.ok) throw new Error(`Netlify Forms API: ${formsResp.status}`);
    const forms = await formsResp.json();
    const form = forms.find(f => f.name === 'reserva-wwry');
    if (!form) return { statusCode: 404, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'No existe todavía el formulario reserva-wwry en Netlify. Comprueba Form detection y vuelve a desplegar.' }) };

    const subsResp = await fetch(`https://api.netlify.com/api/v1/forms/${encodeURIComponent(form.id)}/submissions?per_page=100`, { headers });
    if (!subsResp.ok) throw new Error(`Netlify Submissions API: ${subsResp.status}`);
    const subs = await subsResp.json();

    const clean = subs.map(s => {
      const d = s.data || {};
      return {
        id: s.id,
        created_at: s.created_at ? new Date(s.created_at).toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }) : '',
        funcion: d.funcion || '',
        invitaciones: d.invitaciones || '',
        nombre: d.nombre || s.name || '',
        email: d.email || s.email || '',
        empresa: d.empresa || '',
        ha_trabajado_antes: d.ha_trabajado_antes || '',
        evento_anterior: d.evento_anterior || ''
      };
    });

    return { statusCode: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, body: JSON.stringify({ formName: form.name, submissionCount: form.submission_count, submissions: clean }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 502, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'No se pudieron cargar las solicitudes desde Netlify.' }) };
  }
};
