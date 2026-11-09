window.addEventListener('DOMContentLoaded', () => {

    // 1. Scroll del Nav — el nav se inyecta de forma asíncrona (ver
    // includes.js), así que esperamos el evento 'nav:ready' en vez de
    // buscar ".nav" directamente acá, porque todavía podría no existir.
    if (document.body.classList.contains('home-page')) {
        document.addEventListener('nav:ready', () => {
            const navbar = document.querySelector('.nav');
            if (!navbar) return;

            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            });
        });

        // 2. Animación de aparición para las categorías
        // (no depende del nav, así que sigue funcionando igual que antes)
        const opcionesObserver = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15   // La animación se activa cuando se ve el 15% del cuadrado
        };

        const categoriasObserver = new IntersectionObserver((entradas, observador) => {
            entradas.forEach(entrada => {
                // Si el elemento entra en la pantalla
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('active');
                    // Dejamos de observarlo para que la animación solo ocurra una vez
                    observador.unobserve(entrada.target);
                }
            });
        }, opcionesObserver);

        // Seleccionamos todos los cuadrados que tengan las nuevas clases
        const cuadrados = document.querySelectorAll('.reveal-left, .reveal-right');
        cuadrados.forEach(cuadrado => categoriasObserver.observe(cuadrado));
    }
});
