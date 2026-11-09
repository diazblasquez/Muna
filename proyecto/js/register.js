document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('register-form');
    const errorEl = document.getElementById('register-error');

    const params = new URLSearchParams(window.location.search);
    const next = params.get('next') || '../index.html';

    if (Auth.isLoggedIn()) {
        window.location.href = next;
        return;
    }

    const loginLink = document.querySelector('a[href="login.html"]');
    if (loginLink && params.get('next')) {
        loginLink.href = `login.html?next=${encodeURIComponent(next)}`;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorEl.hidden = true;

        const fd = new FormData(form);
        if (fd.get('password') !== fd.get('password2')) {
            errorEl.textContent = 'Las contraseñas no coinciden.';
            errorEl.hidden = false;
            return;
        }

        const res = Auth.registerUser({
            nombre: fd.get('nombre'),
            apellido: fd.get('apellido'),
            email: fd.get('email'),
            password: fd.get('password')
        });

        if (!res.ok) {
            errorEl.textContent = res.error;
            errorEl.hidden = false;
            return;
        }
        window.location.href = next;
    });
});
