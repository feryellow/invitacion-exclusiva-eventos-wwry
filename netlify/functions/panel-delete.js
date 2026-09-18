exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) {}

  const expected = process.env.PANEL_PASSWORD;
  if (!expected) return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Falta configurar PANEL_PASSWORD en Netlify.' }) };
  if (!body.password || body.password !== expected) return { statusCode: 401, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Contraseña incorrecta.' }) };

  if (!body.id) return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Falta el id de la solicitud a borrar.' }) };

  const token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN;
  if (!token) return { statusCode: 500, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'Falta NETLIFY_API_TOKEN.' }) };

  const headers = { Authorization: `Bearer ${token}`, 'User-Agent': 'WWRY Invitation Panel' };
  try {
    const resp = await fetch(`https://api.netlify.com/api/v1/submissions/${encodeURIComponent(body.id)}`, { method: 'DELETE', headers });
    if (!resp.ok && resp.status !== 404) throw new Error(`Netlify Submissions API: ${resp.status}`);
    return { statusCode: 200, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 502, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ error: 'No se pudo borrar la solicitud en Netlify.' }) };
  }
};
