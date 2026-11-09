document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const feedback = document.getElementById('contact-feedback');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // No hay backend todavía: simulamos el envío. Cuando exista un
        // servidor, reemplazar este bloque por un fetch a tu endpoint
        // (por ejemplo POST /api/contacto con los mismos campos).
        feedback.textContent = '¡Gracias! Recibimos tu mensaje y te vamos a responder a la brevedad.';
        feedback.className = 'form-feedback is-success';
        feedback.hidden = false;
        form.reset();
    });
});
