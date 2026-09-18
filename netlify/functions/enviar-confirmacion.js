// Envía el correo de "hemos recibido tu solicitud" al invitado, en HTML, vía Resend.
// Se dispara desde una notificación "Outgoing webhook" del formulario reserva-wwry
// (Site settings > Forms > Form notifications > Add notification > Outgoing webhook).
//
// Variables de entorno necesarias en Netlify (Site settings > Environment variables):
//   RESEND_API_KEY  -> API key de Resend
//   RESEND_FROM     -> remitente verificado en Resend, p.ej. "We Will Rock You <invitaciones@laestacion.com>"

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    console.error('JSON inválido recibido:', err);
    return { statusCode: 400, body: 'JSON inválido' };
  }

  // Netlify envía el payload como { payload: { data: {...}, email, name, ... } }
  // en algunos formatos y como { data: {...} } directamente en otros; cubrimos ambos.
  const payload = body.payload || body;
  const data = payload.data || payload;

  const email = data.email || payload.email;
  const nombre = data.nombre || payload.name || 'de nuevo';
  const funcion = data.funcion || 'la función seleccionada';
  const invitaciones = String(data.invitaciones || '1');

  if (!email) {
    console.error('Solicitud sin email, no se envía confirmación:', data);
    return { statusCode: 200, body: 'Sin email, no se envía correo' };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('Falta RESEND_API_KEY en las variables de entorno del site.');
    return { statusCode: 500, body: 'Falta configurar RESEND_API_KEY' };
  }

  const html = `
  <div style="background:#000;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#070809;border:1px solid rgba(215,173,85,.35);color:#f6f2e9;">
      <div style="padding:32px 32px 8px;text-align:center;">
        <span style="display:inline-block;padding:10px 24px;border-radius:999px;background:linear-gradient(180deg,#fff3cf,#efcc73 45%,#c29435);color:#241a08;font-family:Georgia,serif;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Invitación exclusiva</span>
      </div>
      <div style="padding:24px 32px 8px;">
        <h1 style="margin:0 0 16px;color:#ffe3a0;font-family:Georgia,serif;font-size:22px;">We Will Rock You</h1>
        <p style="line-height:1.6;font-size:15px;margin:0 0 16px;">Hola ${nombre},</p>
        <p style="line-height:1.6;font-size:15px;margin:0 0 16px;">Hemos recibido tu solicitud de <strong>${invitaciones} invitación${invitaciones === '2' ? 'es' : ''}</strong> para la función del <strong>${funcion}</strong> en el Gran Teatro CaixaBank Príncipe Pío.</p>
        <p style="line-height:1.6;font-size:15px;margin:0 0 16px;">Nuestra compañera Ariana Ojeda se pondrá en contacto contigo en breve para confirmarte la disponibilidad y enviarte las instrucciones. Una vez confirmada, tus entradas estarán en la taquilla del teatro el mismo día de la función, a tu nombre.</p>
      </div>
      <div style="padding:16px 32px 32px;border-top:1px solid rgba(215,173,85,.24);margin-top:16px;">
        <p style="margin:0;color:#a9a69d;font-size:12px;line-height:1.6;">Cuesta de San Vicente, 44 · 28008 Madrid</p>
      </div>
    </div>
  </div>`;

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'We Will Rock You <invitaciones@laestacion.com>',
      to: [email],
      subject: 'Hemos recibido tu solicitud · We Will Rock You',
      html,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error('Error de Resend:', resp.status, errText);
    return { statusCode: 502, body: 'Error al enviar el correo' };
  }

  return { statusCode: 200, body: 'Correo enviado' };
};
