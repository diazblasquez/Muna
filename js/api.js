/**
 * api.js
 * -----------------------------------------------------------------------
 * Cliente de la API en PHP (carpeta api/) y utilidades que usan varios JS.
 * Se carga en el <head> de cada página, justo después de paths.js.
 *
 *   const r = await Api.get('productos.php');
 *   const r = await Api.post('login.php', { email, password });
 *   // r siempre tiene r.ok; si r.ok es false, el mensaje está en r.error
 *
 *   Api.money(40000)  -> "$40.000"
 *   Api.esc(texto)    -> texto seguro para meter dentro de innerHTML
 * -----------------------------------------------------------------------
 */
const Api = (() => {
    const urlDe = (ruta) => Rutas.recurso('api/' + ruta);
    const ERROR_RED = 'No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.';

    let csrf = null;
    let sesionPromesa = null;

    // El servidor entrega un token en cada sesión; hay que devolverlo en cada POST
    const sesion = () => {
        if (!sesionPromesa) {
            sesionPromesa = pedir('GET', 'sesion.php').then((r) => {
                if (!r.ok) sesionPromesa = null; // reintenta la próxima vez
                return r;
            });
        }
        return sesionPromesa;
    };

    const pedir = async (metodo, ruta, cuerpo, reintento = true) => {
        const opciones = {
            method: metodo,
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        };

        if (metodo !== 'GET') {
            if (!csrf && ruta !== 'sesion.php') await sesion();
            opciones.headers['Content-Type'] = 'application/json';
            opciones.headers['X-CSRF-Token'] = csrf || '';
            opciones.body = JSON.stringify(cuerpo || {});
        }

        let res, datos;
        try {
            res = await fetch(urlDe(ruta), opciones);
            datos = await res.json();
        } catch (err) {
            console.warn('[Api]', metodo, ruta, err); // warn: también salta si se cambia de página mientras carga
            return { ok: false, error: ERROR_RED, red: true };
        }

        if (datos.csrf) csrf = datos.csrf;

        // Token vencido: se pide uno nuevo y se reintenta una sola vez
        if (res.status === 403 && datos.codigo === 'csrf' && reintento) {
            sesionPromesa = null;
            csrf = null;
            await sesion();
            return pedir(metodo, ruta, cuerpo, false);
        }
        return datos;
    };

    // Respuestas de catálogo que se piden una sola vez por página
    const memoria = {};
    const recordar = (clave, ruta) => {
        if (!memoria[clave]) {
            memoria[clave] = pedir('GET', ruta).then((r) => {
                if (!r.ok) delete memoria[clave];
                return r;
            });
        }
        return memoria[clave];
    };

    const money = (n) => '$' + Number(n).toLocaleString('es-AR');

    const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    const esc = (texto) => String(texto ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

    return {
        get: (ruta) => pedir('GET', ruta),
        post: (ruta, cuerpo) => pedir('POST', ruta, cuerpo),
        sesion,
        catalogo: () => recordar('catalogo', 'productos.php'),
        producto: (slug) => recordar('p:' + slug, 'productos.php?slug=' + encodeURIComponent(slug)),
        money,
        esc
    };
})();
