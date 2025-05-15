// /api/join-whitelist.js
// Ejemplo de función serverless para Vercel usando Node.js.
// Para Supabase: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase (o tu base de datos preferida)
// Estas variables de entorno deben configurarse en Vercel.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Clave pública 'anon'

let supabase;
if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn("Variables de entorno de Supabase (SUPABASE_URL, SUPABASE_ANON_KEY) no configuradas. La API no funcionará correctamente.");
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido. Solo POST.' });
    }

    if (!supabase) {
        console.error("Supabase client no inicializado. Verifica las variables de entorno.");
        return res.status(500).json({ error: 'Error de configuración del servidor.' });
    }

    try {
        const { fid, username, displayName, pfpUrl } = req.body;

        if (!fid) {
            return res.status(400).json({ error: 'El FID del usuario es requerido.' });
        }

        const userData = {
            fid: Number(fid),
            username: username || `fid:${fid}`, // Guardar un username por defecto si no viene
            display_name: displayName,
            pfp_url: pfpUrl,
            joined_at: new Date().toISOString(),
        };

        console.log("Intentando añadir a la whitelist:", userData);

        // Nombre de tu tabla en Supabase: 'whitelist_entries'
        // Columnas ejemplo: fid (integer, primary key), username (text), display_name (text), pfp_url (text), joined_at (timestamp)
        const { data, error } = await supabase
            .from('whitelist_entries')
            .insert([userData])
            .select(); // .select() es opcional, devuelve el registro insertado

        if (error) {
            console.error('Error de Supabase al insertar:', error);
            // Código '23505' es para violación de unicidad (ej. si FID ya existe y es PRIMARY KEY)
            if (error.code === '23505') {
                return res.status(200).json({ message: `¡${displayName || username}, ya estabas en la whitelist! Gracias de nuevo.` });
            }
            // Otros errores de base de datos
            return res.status(500).json({ error: `Error al guardar en la base de datos: ${error.message}` });
        }

        console.log('Usuario añadido a la whitelist en Supabase:', data);
        return res.status(200).json({ message: `¡${displayName || username}, te has unido a la whitelist de $SMILE con éxito!` });

    } catch (error) {
        console.error('Error inesperado en /api/join-whitelist:', error);
        return res.status(500).json({ error: 'Error interno del servidor al procesar la solicitud.' });
    }
}
