document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const feedback = document.getElementById('contact-feedback');
    const boton = form.querySelector('[type="submit"]');

    // Campo trampa para bots: las personas no lo ven ni lo completan.
    const trampa = document.createElement('input');
    trampa.type = 'text';
    trampa.name = 'website';
    trampa.tabIndex = -1;
    trampa.autocomplete = 'off';
    trampa.setAttribute('aria-hidden', 'true');
    trampa.style.cssText = 'position:absolute; left:-9999px; width:1px; height:1px; opacity:0;';
    form.appendChild(trampa);

    const mostrar = (texto, ok) => {
        feedback.textContent = texto;
        feedback.className = 'form-feedback ' + (ok ? 'is-success' : 'is-error');
        feedback.hidden = false;
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        feedback.hidden = true;
        if (boton) boton.disabled = true;

        const res = await Api.post('contacto.php', Object.fromEntries(new FormData(form).entries()));

        if (boton) boton.disabled = false;
        if (!res.ok) {
            mostrar(res.error, false);
            return;
        }
        mostrar('¡Gracias! Recibimos tu mensaje y te vamos a responder a la brevedad.', true);
        form.reset();
    });
});
