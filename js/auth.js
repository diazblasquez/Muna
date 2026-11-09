/**
 * auth.js
 * -----------------------------------------------------------------------
 * Sesión del usuario. Los datos viven en el servidor (api/*.php): acá
 * solo se pide y se guarda una copia en memoria mientras la página está
 * abierta. Las contraseñas nunca se guardan en el navegador.
 *
 * Importante: hay que esperar a Auth.load() antes de preguntar si hay
 * sesión:
 *      await Auth.load();
 *      if (!Auth.isLoggedIn()) { ... }
 * -----------------------------------------------------------------------
 */
const Auth = (() => {
    let usuario = null;
    let cargado = false;

    /** Consulta al servidor si hay sesión iniciada. */
    const load = async () => {
        if (cargado) return usuario;
        const r = await Api.sesion();
        usuario = r.ok ? r.usuario : null;
        cargado = true;
        return usuario;
    };

    const registerUser = async ({ nombre, apellido, email, password }) => {
        const r = await Api.post('register.php', { nombre, apellido, email, password });
        if (r.ok) { usuario = r.usuario; cargado = true; }
        return r;
    };

    const loginUser = async (email, password) => {
        const r = await Api.post('login.php', { email, password });
        if (r.ok) { usuario = r.usuario; cargado = true; }
        return r;
    };

    const logoutUser = async () => {
        const r = await Api.post('logout.php');
        if (r.ok) usuario = null;
        return r;
    };

    /** Actualiza nombre, apellido, teléfono y dirección (no el email ni la contraseña). */
    const updateProfile = async (datos) => {
        const r = await Api.post('perfil.php', datos);
        if (r.ok) usuario = r.usuario;
        return r;
    };

    const changePassword = (actual, nueva) => Api.post('password.php', { actual, nueva });

    /**
     * El parámetro ?next= de login/register dice a dónde volver. Solo se
     * acepta una ruta relativa a otra página .html del sitio: así nadie puede
     * armar un link que, al iniciar sesión, mande a un sitio externo.
     */
    const destinoSeguro = (next, porDefecto) => {
        const valido = typeof next === 'string' && /^(\.\.?\/)*[\w-]+(\/[\w-]+)*\.html(\?[^#]*)?(#.*)?$/.test(next);
        return valido ? next : porDefecto;
    };

    return {
        load,
        registerUser,
        loginUser,
        logoutUser,
        updateProfile,
        changePassword,
        destinoSeguro,
        getActiveUser: () => usuario,
        isLoggedIn: () => usuario !== null
    };
})();
