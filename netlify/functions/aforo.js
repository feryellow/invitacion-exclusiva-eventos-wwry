// Devuelve, sin contraseña, cuántas invitaciones se han solicitado por función.
// No expone nombres ni emails: solo los totales, para poder desactivar en la
// web las funciones que ya llegaron al cupo (30 invitaciones).
const CUPO = 30;

exports.handler = async () => {
  const headersOut = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
  const token = process.env.NETLIFY_API_TOKEN || process.env.NETLIFY_AUTH_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;

  // Si falta configuración, no bloqueamos el formulario: devolvemos aforo vacío.
  if (!token || !siteId) {
    return { statusCode: 200, headers: headersOut, body: JSON.stringify({ cupo: CUPO, aforo: {} }) };
  }

  const headers = { Authorization: `Bearer ${token}`, 'User-Agent': 'WWRY Invitation Aforo' };
  try {
    const formsResp = await fetch(`https://api.netlify.com/api/v1/sites/${encodeURIComponent(siteId)}/forms`, { headers });
    if (!formsResp.ok) throw new Error(`Netlify Forms API: ${formsResp.status}`);
    const forms = await formsResp.json();
    const form = forms.find(f => f.name === 'reserva-wwry');
    if (!form) {
      return { statusCode: 200, headers: headersOut, body: JSON.stringify({ cupo: CUPO, aforo: {} }) };
    }

    const subsResp = await fetch(`https://api.netlify.com/api/v1/forms/${encodeURIComponent(form.id)}/submissions?per_page=100`, { headers });
    if (!subsResp.ok) throw new Error(`Netlify Submissions API: ${subsResp.status}`);
    const subs = await subsResp.json();

    const aforo = {};
    for (const s of subs) {
      const d = s.data || {};
      const funcion = d.funcion || '';
      const invitaciones = parseInt(d.invitaciones, 10) || 0;
      if (!funcion) continue;
      aforo[funcion] = (aforo[funcion] || 0) + invitaciones;
    }

    return { statusCode: 200, headers: headersOut, body: JSON.stringify({ cupo: CUPO, aforo }) };
  } catch (err) {
    console.error(err);
    // Ante un fallo, tampoco bloqueamos el formulario.
    return { statusCode: 200, headers: headersOut, body: JSON.stringify({ cupo: CUPO, aforo: {} }) };
  }
};
