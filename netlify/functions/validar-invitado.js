// Comprueba que el email de la solicitud está en la base de contactos a la
// que se envió la invitación. No expone la lista al navegador: solo
// responde sí/no para ese email concreto.
const invitados = require('./invitados.json');
const set = new Set(invitados.map(e => String(e).trim().toLowerCase()));

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (_) {}

  const email = String(body.email || '').trim().toLowerCase();
  if (!email) {
    return { statusCode: 400, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ valid: false, error: 'Falta el email.' }) };
  }

  const valid = set.has(email);
  return { statusCode: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, body: JSON.stringify({ valid }) };
};
