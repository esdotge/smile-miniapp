// /public/app.js

// Intenta acceder al SDK de Farcaster Mini Apps.
// El cliente Farcaster (ej. Warpcast) debería inyectarlo en el scope global (window).
// Si usaras un bundler (como Vite, Webpack) y lo instalaras vía npm, harías:
// import { sdk } from '@farcaster/sdk'; // o el nombre del paquete oficial del SDK
const sdk = window.farcasterSDK; // Ajusta esto si el SDK se inyecta con otro nombre.

// Obtenemos referencias a los elementos del DOM con los que vamos a interactuar
const joinButton = document.getElementById('joinWhitelistButton');
// Necesitamos un elemento para mostrar mensajes de estado, asegúrate de que exista en tu HTML.
// Si seguiste el HTML que te di antes, ya existe un <p id="statusMessage" class="message"></p>
// Si no, tendrás que añadirlo o ajustar el selector aquí.
const statusMessageElement = document.getElementById('statusMessage') || document.createElement('p'); // Fallback por si no existe

/**
 * Muestra un mensaje al usuario en el elemento statusMessage.
 * @param {string} message - El mensaje a mostrar.
 * @param {'info' | 'success' | 'error'} type - El tipo de mensaje para aplicar estilos.
 */
function showMessage(message, type = 'info') {
    if (statusMessageElement) { // Solo intenta actualizar si el elemento existe
        statusMessageElement.textContent = message;
        statusMessageElement.className = `message ${type}`; // Aplica clases CSS para el estilo
        // Si el elemento fue creado dinámicamente y no está en el DOM, podrías añadirlo:
        // if (!statusMessageElement.parentNode && joinButton.parentNode) {
        //   joinButton.parentNode.insertBefore(statusMessageElement, joinButton.nextSibling);
        // }
    } else {
        console.warn("Elemento para mensajes de estado no encontrado. Mensaje:", message);
    }
}

/**
 * Notifica al cliente Farcaster que la Mini App está lista y completamente cargada.
 * Esto es importante para la experiencia de usuario, según la documentación de Farcaster.
 * Referencia: https://miniapps.farcaster.xyz/docs/guides/loading
 */
function notifyAppReady() {
    if (sdk && sdk.actions && typeof sdk.actions.ready === 'function') {
        sdk.actions.ready()
            .then(() => {
                console.log("Mini App reportada como lista al cliente Farcaster.");
            })
            .catch(error => {
                console.error("Error al reportar Mini App como lista:", error);
            });
    } else {
        // Es útil tener este log si estás desarrollando y el SDK no se carga como esperas.
        console.warn("SDK de Farcaster no detectado o 'sdk.actions.ready' no disponible. La app podría no tener la mejor experiencia de carga.");
    }
}

// Llama a notifyAppReady tan pronto como el DOM esté completamente cargado y parseado.
document.addEventListener('DOMContentLoaded', () => {
    // Si statusMessageElement fue creado dinámicamente porque no existía,
    // y quieres añadirlo al DOM, este sería un buen lugar.
    // Por ejemplo, si el HTML del Canvas no tiene el <p id="statusMessage">...</p>
    // podrías añadirlo aquí. Sin embargo, el HTML del Canvas actual SÍ lo tiene.
    if (document.body.contains(joinButton) && !document.getElementById('statusMessage') && statusMessageElement.tagName === 'P') {
        // Inserta el mensaje después del botón si no existe y fue creado
        joinButton.parentNode.insertBefore(statusMessageElement, joinButton.nextSibling);
    }
    notifyAppReady();
});

// Añadimos un event listener al botón para manejar el clic
joinButton.addEventListener('click', async () => {
    joinButton.disabled = true; // Deshabilita el botón para evitar múltiples clics
    showMessage('Procesando tu solicitud...', 'info'); // Mensaje inicial

    // Verifica si el SDK de Farcaster está disponible
    if (!sdk || !sdk.context || typeof sdk.context !== 'function') {
        showMessage('Error: El SDK de Farcaster no está disponible en este entorno.', 'error');
        console.error('Farcaster SDK o sdk.context no está disponible. Asegúrate de estar probando dentro de un cliente Farcaster compatible.');
        joinButton.disabled = false; // Rehabilita el botón si hay un error fundamental
        return;
    }

    try {
        // Obtener el contexto de la Mini App. Incluye información del usuario como el FID.
        const appContext = await sdk.context();
        console.log("Contexto de la App obtenido:", appContext); // Útil para depuración

        // Verifica que tengamos la información necesaria del usuario
        if (!appContext || !appContext.user || !appContext.user.fid) {
            throw new Error('No se pudo obtener el FID del usuario. Asegúrate de que la Mini App tiene permisos y se ejecuta en Farcaster.');
        }

        const userFid = appContext.user.fid;
        const username = appContext.user.username || `fid:${userFid}`;
        const displayName = appContext.user.displayName || username;
        const pfpUrl = appContext.user.pfpUrl || '';

        const payload = {
            fid: userFid,
            username: username,
            displayName: displayName,
            pfpUrl: pfpUrl
        };

        // Realiza la solicitud POST a tu endpoint del backend `/api/join-whitelist`
        const response = await fetch('/api/join-whitelist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
            showMessage(result.message || `¡Gracias, ${displayName}! Ya estás en la whitelist. 🎉`, 'success');
            joinButton.textContent = '🙂 ¡YA ESTÁS EN LA LISTA!'; // Actualiza el texto del botón
        } else {
            throw new Error(result.error || 'Hubo un problema al procesar tu solicitud en el servidor.');
        }

    } catch (error) {
        console.error('Error al intentar unirse a la whitelist:', error);
        showMessage(`Error: ${error.message}`, 'error');
        joinButton.disabled = false;
    }
});