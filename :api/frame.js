// /api/frame.js
// Este archivo actúa como un endpoint que sirve el HTML con las metaetiquetas
// necesarias para que Farcaster lo interprete como un Frame.
// Está pensado para un entorno serverless como Vercel.

export default function handler(req, res) {
  // IMPORTANTE: Reemplaza esta URL con la URL base de tu aplicación desplegada.
  // Ejemplo: 'https://mi-app-sonrisas.vercel.app'
  // Usamos VERCEL_URL que Vercel provee automáticamente durante el despliegue.
  const appUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

  // Asegúrate de que estas imágenes existan en tu carpeta /public/images/
  // Puedes usar URLs de placeholders mientras desarrollas.
  const frameImageUrl = `${appUrl}/images/frame-principal.png`; // Imagen principal del Frame
  const miniAppName = "$SMILE Whitelist MVP";
  const miniAppIconUrl = `${appUrl}/images/miniapp-icono.png`; // Icono para la Mini App
  const miniAppSplashImageUrl = `${appUrl}/images/miniapp-splash.png`; // Imagen de carga (splash)
  const miniAppBackgroundColor = "#FFFBEA"; // Color de fondo para la pantalla de carga

  // URL de tu Mini App (el archivo index.html en la carpeta /public)
  const miniAppTargetUrl = `${appUrl}/index.html`; // Vercel servirá /public/index.html desde la raíz

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="og:title" content="¡Únete a la Whitelist de $SMILE!" />
        <meta property="og:image" content="${frameImageUrl}" />

        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${frameImageUrl}" />
        <meta property="fc:frame:button:1" content="👋 ¡Quiero unirme!" />
        <meta property="fc:frame:button:1:action" content="miniapp" />
        <meta property="fc:frame:button:1:target" content="${miniAppTargetUrl}" />

        <meta property="fc:frame:miniapp:name" content="${miniAppName}" />
        <meta property="fc:frame:miniapp:image" content="${miniAppIconUrl}" />
        <meta property="fc:frame:miniapp:splash_image" content="${miniAppSplashImageUrl}" />
        <meta property="fc:frame:miniapp:background_color" content="${miniAppBackgroundColor}" />

        <title>$SMILE Whitelist Frame</title>
      </head>
      <body>
        <h1>Frame para la Whitelist de $SMILE</h1>
        <p>Este es el contenido del servidor del frame. Deberías interactuar con este frame a través de un cliente de Farcaster.</p>
        <p>La Mini App se abrirá en: <a href="${miniAppTargetUrl}">${miniAppTargetUrl}</a></p>
        <p>URL base detectada: ${appUrl}</p>
      </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}
