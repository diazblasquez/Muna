document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('login-error');
    const boton = form.querySelector('[type="submit"]');

    // Si venimos desde el checkout o el perfil (redirigen con ?next=...),
    // al loguearnos volvemos exactamente ahí. Si no, vamos al inicio.
    // Auth.destinoSeguro descarta cualquier destino que no sea una página del sitio.
    const params = new URLSearchParams(window.location.search);
    const next = Auth.destinoSeguro(params.get('next'), '../index.html');

    // El submit se engancha primero: así, si alguien envía antes de que cargue
    // todo, los datos nunca viajan por la URL.
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.hidden = true;
        if (boton) boton.disabled = true;

        const fd = new FormData(form);
        const res = await Auth.loginUser(fd.get('email'), fd.get('password'));

        if (!res.ok) {
            errorEl.textContent = res.error;
            errorEl.hidden = false;
            if (boton) boton.disabled = false;
            return;
        }
        window.location.href = next;
    });

    document.getElementById('forgot-password-link').addEventListener('click', (e) => {
        e.preventDefault();
        alert('Todavía no está implementada la recuperación de contraseña.');
    });

    const registerLink = document.querySelector('a[href="register.html"]');
    if (registerLink && params.get('next')) {
        registerLink.href = `register.html?next=${encodeURIComponent(next)}`;
    }

    await Auth.load();
    if (Auth.isLoggedIn()) window.location.href = next;
});
