// /api/join-whitelist.js
// Ejemplo de función serverless para Vercel usando Node.js.
// Para Supabase: asegúrate de haber ejecutado `npm install @supabase/supabase-js` en tu proyecto.

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase (o tu base de datos preferida)
// Estas variables de entorno deben configurarse en Vercel (o tu plataforma de despliegue).
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Clave pública 'anon'

let supabase;
// Solo intenta crear el cliente de Supabase si las variables de entorno están presentes.
if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    // Este mensaje se verá en los logs de la función serverless si las variables no están configuradas.
    console.warn("Variables de entorno de Supabase (SUPABASE_URL, SUPABASE_ANON_KEY) no configuradas. La API para unirse a la whitelist no funcionará correctamente con la base de datos.");
}

export default async function handler(req, res) {
    // Solo permitir solicitudes POST a este endpoint.
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']); // Informa al cliente qué métodos son permitidos.
        return res.status(405).json({ error: 'Método no permitido. Solo se aceptan solicitudes POST.' });
    }

    // Verifica si el cliente de Supabase se inicializó correctamente.
    if (!supabase) {
        console.error("El cliente de Supabase no está inicializado. Verifica la configuración de las variables de entorno en tu plataforma de despliegue.");
        return res.status(500).json({ error: 'Error de configuración del servidor. No se pudo conectar a la base de datos.' });
    }

    try {
        // Extrae los datos del cuerpo de la solicitud.
        // app.js envía: fid, username, displayName, pfpUrl
        const { fid, username, displayName, pfpUrl } = req.body;

        // Validación básica: el FID es esencial.
        if (!fid) {
            return res.status(400).json({ error: 'El FID del usuario es requerido para unirse a la whitelist.' });
        }

        // Prepara el objeto de datos que se insertará en la base de datos.
        const userData = {
            fid: Number(fid), // Asegúrate de que el FID se guarde como número si así está definido en tu DB.
            username: username || `fid:${fid}`, // Guarda un username por defecto si no se proporciona.
            display_name: displayName,
            pfp_url: pfpUrl,
            joined_at: new Date().toISOString(), // Registra cuándo se unió el usuario.
        };

        console.log("Intentando añadir el siguiente usuario a la whitelist:", userData);

        // Inserta los datos en tu tabla de Supabase.
        // Reemplaza 'whitelist_entries' con el nombre real de tu tabla si es diferente.
        // Columnas de ejemplo en tu tabla: fid (integer, primary key), username (text), display_name (text), pfp_url (text), joined_at (timestamp with time zone)
        const { data, error } = await supabase
            .from('whitelist_entries') // Nombre de tu tabla
            .insert([userData])
            .select(); // .select() es opcional, pero útil para confirmar la inserción o obtener el ID generado.

        if (error) {
            console.error('Error de Supabase al intentar insertar el registro:', error);
            // El código '23505' en PostgreSQL (usado por Supabase) indica una violación de unicidad.
            // Esto ocurrirá si intentas insertar un FID que ya existe y 'fid' es tu clave primaria o tiene una constraint de unicidad.
            if (error.code === '23505') {
                // Es una buena experiencia de usuario informar que ya estaban en la lista.
                return res.status(200).json({ message: `¡${displayName || username}, ya estabas en la whitelist! Gracias de nuevo.` });
            }
            // Para otros errores de base de datos, devuelve un error genérico.
            return res.status(500).json({ error: `Error al guardar los datos en la base de datos: ${error.message}` });
        }

        console.log('Usuario añadido exitosamente a la whitelist en Supabase:', data);
        return res.status(200).json({ message: `¡${displayName || username}, te has unido a la whitelist de $MILE con éxito!` });

    } catch (error) {
        // Captura cualquier otro error inesperado durante el proceso.
        console.error('Error inesperado en el endpoint /api/join-whitelist:', error);
        return res.status(500).json({ error: 'Ocurrió un error interno en el servidor al procesar tu solicitud.' });
    }
}