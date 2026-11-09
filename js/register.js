document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('register-form');
    const errorEl = document.getElementById('register-error');
    const boton = form.querySelector('[type="submit"]');

    const params = new URLSearchParams(window.location.search);
    const next = Auth.destinoSeguro(params.get('next'), '../index.html');

    const mostrarError = (texto) => {
        errorEl.textContent = texto;
        errorEl.hidden = false;
        if (boton) boton.disabled = false;
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.hidden = true;

        const fd = new FormData(form);
        if (fd.get('password') !== fd.get('password2')) {
            mostrarError('Las contraseñas no coinciden.');
            return;
        }
        if (String(fd.get('password')).length < 8) {
            mostrarError('La contraseña debe tener al menos 8 caracteres.');
            return;
        }

        if (boton) boton.disabled = true;
        const res = await Auth.registerUser({
            nombre: fd.get('nombre'),
            apellido: fd.get('apellido'),
            email: fd.get('email'),
            password: fd.get('password')
        });

        if (!res.ok) {
            mostrarError(res.error);
            return;
        }
        window.location.href = next;
    });

    const loginLink = document.querySelector('a[href="login.html"]');
    if (loginLink && params.get('next')) {
        loginLink.href = `login.html?next=${encodeURIComponent(next)}`;
    }

    await Auth.load();
    if (Auth.isLoggedIn()) window.location.href = next;
});
