/**
 * auth.js
 * -----------------------------------------------------------------------
 * Registro / login SIMULADO con localStorage, para usar mientras no haya
 * backend. Se comparte entre login.html, register.html, checkout.html y
 * a futuro la página de "cuenta".
 *
 * ⚠️ Las contraseñas quedan en texto plano en el navegador. Es aceptable
 * para maquetar y probar el flujo, pero cuando exista un backend real hay
 * que reemplazar estas funciones por llamadas a la API (fetch a /login,
 * /register) y jamás guardar la contraseña en el cliente.
 * -----------------------------------------------------------------------
 */
const Auth = (() => {
    const USERS_KEY = 'usuarios';
    const ACTIVE_USER_KEY = 'usuarioActivo';

    const getUsers = () => {
        try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
        catch { return []; }
    };
    const saveUsers = (users) => localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const normalizeEmail = (email) => (email || '').trim().toLowerCase();

    const publicUser = (user) => ({
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        direccion: user.direccion || '',
        piso: user.piso || '',
        localidad: user.localidad || '',
        codigoPostal: user.codigoPostal || '',
        telefono: user.telefono || ''
    });

    const setActiveUser = (user) => {
        localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(publicUser(user)));
    };

    const registerUser = ({ nombre, apellido, email, password }) => {
        const emailNorm = normalizeEmail(email);
        if (!nombre || !apellido || !emailNorm || !password) {
            return { ok: false, error: 'Completá todos los campos.' };
        }
        const users = getUsers();
        if (users.some(u => u.email === emailNorm)) {
            return { ok: false, error: 'Ya existe una cuenta con ese email.' };
        }
        const nuevoUsuario = {
            id: Date.now().toString(36),
            nombre: nombre.trim(),
            apellido: apellido.trim(),
            email: emailNorm,
            password,
            direccion: '',
            piso: '',
            localidad: '',
            codigoPostal: '',
            telefono: ''
        };
        users.push(nuevoUsuario);
        saveUsers(users);
        setActiveUser(nuevoUsuario);
        return { ok: true, user: publicUser(nuevoUsuario) };
    };

    const loginUser = (email, password) => {
        const emailNorm = normalizeEmail(email);
        const encontrado = getUsers().find(u => u.email === emailNorm);
        if (!encontrado || encontrado.password !== password) {
            return { ok: false, error: 'Email o contraseña incorrectos.' };
        }
        setActiveUser(encontrado);
        return { ok: true, user: publicUser(encontrado) };
    };

    /**
     * Actualiza los datos de perfil del usuario activo (no email ni password).
     * @returns {{ ok: boolean, error?: string, user?: object }}
     */
    const updateProfile = (updates) => {
        const activo = getActiveUser();
        if (!activo) return { ok: false, error: 'No hay sesión activa.' };

        const users = getUsers();
        const idx = users.findIndex(u => u.id === activo.id);
        if (idx === -1) return { ok: false, error: 'No se encontró el usuario.' };

        const CAMPOS_EDITABLES = ['nombre', 'apellido', 'direccion', 'piso', 'localidad', 'codigoPostal', 'telefono'];
        CAMPOS_EDITABLES.forEach(campo => {
            if (updates[campo] !== undefined) users[idx][campo] = updates[campo].trim();
        });

        saveUsers(users);
        setActiveUser(users[idx]);
        return { ok: true, user: publicUser(users[idx]) };
    };

    /**
     * Cambia la contraseña del usuario activo, validando la actual.
     * @returns {{ ok: boolean, error?: string }}
     */
    const changePassword = (passwordActual, passwordNueva) => {
        const activo = getActiveUser();
        if (!activo) return { ok: false, error: 'No hay sesión activa.' };

        const users = getUsers();
        const idx = users.findIndex(u => u.id === activo.id);
        if (idx === -1) return { ok: false, error: 'No se encontró el usuario.' };

        if (users[idx].password !== passwordActual) {
            return { ok: false, error: 'La contraseña actual no es correcta.' };
        }
        if (!passwordNueva || passwordNueva.length < 6) {
            return { ok: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
        }

        users[idx].password = passwordNueva;
        saveUsers(users);
        return { ok: true };
    };

    const getActiveUser = () => {
        try { return JSON.parse(localStorage.getItem(ACTIVE_USER_KEY)) || null; }
        catch { return null; }
    };

    const logoutUser = () => localStorage.removeItem(ACTIVE_USER_KEY);
    const isLoggedIn = () => getActiveUser() !== null;

    return {
        registerUser,
        loginUser,
        getActiveUser,
        logoutUser,
        isLoggedIn,
        updateProfile,
        changePassword
    };
})();
