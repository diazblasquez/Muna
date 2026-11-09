document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.accordion-item').forEach(item => {
        const header = item.querySelector('.accordion-header');
        header.addEventListener('click', () => {
            const yaEstabaAbierto = item.classList.contains('open');

            // Cerramos los demás para que se lea uno a la vez
            item.parentElement.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));

            if (!yaEstabaAbierto) item.classList.add('open');
        });
    });
});
