document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('login-form');
    const errorEl = document.getElementById('login-error');

    // Si venimos desde el checkout (checkout.html redirige con ?next=...),
    // al loguearnos volvemos exactamente ahí. Si no, vamos al inicio.
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || '../index.html';

    if (Auth.isLoggedIn()) {
        window.location.href = next;
        return;
    }

    const registerLink = document.querySelector('a[href="register.html"]');
    if (registerLink && params.get('next')) {
        registerLink.href = `register.html?next=${encodeURIComponent(next)}`;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorEl.hidden = true;

        const fd = new FormData(form);
        const res = Auth.loginUser(fd.get('email'), fd.get('password'));

        if (!res.ok) {
            errorEl.textContent = res.error;
            errorEl.hidden = false;
            return;
        }
        window.location.href = next;
    });

    document.getElementById('forgot-password-link').addEventListener('click', (e) => {
        e.preventDefault();
        alert('Todavía no está implementada la recuperación de contraseña.');
    });
});
