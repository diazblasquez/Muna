/**
 * includes.js
 * -----------------------------------------------------------------------
 * Inyecta el nav y el footer compartidos en cada pagina, asi se editan en
 * un solo lugar en vez de repetirlos en todos los archivos.
 *
 * El HTML esta incluido en este mismo archivo (no usa fetch), por lo que
 * funciona igual abriendo la pagina con doble clic (file://), con Live
 * Server o en un hosting.
 *
 * Uso en cada pagina:
 *   <div id="nav-placeholder"></div>
 *   ...
 *   <div id="footer-placeholder"></div>
 *   ...
 *   <script src="RUTA/js/includes.js"></script>
 * -----------------------------------------------------------------------
 */

const NAV_HTML = `
<header>
    <nav>
        <div class="nav">
            <a href="{{BASE}}index.html" class="logo">
            <span>MÜNA</span>
            </a>

            <!-- Checkbox invisible para controlar el menú -->
            <input type="checkbox" id="menu-toggle" class="menu-checkbox">

            <ul class="nav-links">
                <li class="options dropdown">
                    <a class="options" href="{{BASE}}index.html#productos">
                        Productos
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </a>
                    <ul class="dropdown-menu">
                        <li><a href="{{BASE}}categories/categorie-alfajores.html">Alfajores</a></li>
                        <li><a href="{{BASE}}categories/categorie-tortas.html">Tortas</a></li>
                        <li><a href="{{BASE}}categories/categorie-box.html">Boxs</a></li>
                        <li><a href="{{BASE}}categories/categorie-otros.html">Otros</a></li>
                    </ul>
                </li>
                <li class="options">
                    <a class="options" href="{{BASE}}pages/contacto.html">Contacto</a>
                </li>
                <li class="options">
                    <a class="options" href="{{BASE}}pages/nosotros.html">Nosotros</a>
                </li>
            </ul>

            <div class="nav-right">
                <a class="account-link" href="{{BASE}}pages/profile.html" aria-label="Cuenta">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </a>

                <label for="menu-toggle" class="hamburger-menu" aria-label="Abrir menú">
                    <span></span>
                    <span></span>
                    <span></span>
                </label>
            </div>
        </div>
    </nav>
</header>
`;

const FOOTER_HTML = `
<footer class="site-footer">
    <div class="footer-grid">

        <div class="footer-brand">
            <h4>Müna</h4>
            <p>El arte de la pastelería artesanal, en cada detalle.</p>
        </div>

        <div>
            <h5>Explorar</h5>
            <ul>
                <li><a href="{{BASE}}index.html#productos">Productos</a></li>
                <li><a href="{{BASE}}pages/nosotros.html">Nosotros</a></li>
                <li><a href="{{BASE}}pages/contacto.html">Contacto</a></li>
            </ul>
        </div>

        <div>
            <h5>Soporte</h5>
            <ul>
                <li><a href="{{BASE}}pages/envios_devoluciones.html">Envíos</a></li>
                <li><a href="{{BASE}}pages/envios_devoluciones.html">Devoluciones</a></li>
            </ul>
        </div>

        <div>
            <h5>Seguinos</h5>
            <ul>
                <li>
                    <a href="https://www.instagram.com/muna_arg/" class="social-link" aria-label="Instagram">
                        <img src="../../image/footer/logo_instagram.webp" alt="logo_instagram">
                        Instagram
                    </a>
                </li>
                <li>
                    <a href="https://www.tiktok.com/@muna_arg" class="social-link" aria-label="Tik Tok">
                        <img src="../../image/footer/logo_tik_tok.webp" alt="logo_tik_tok">
                        Tik Tok
                    </a>
                </li>
                <li>
                    <a href="https://wa.me/5491140931553" class="social-link" aria-label="WhatsApp" target="_blank" rel="noopener">
                        <img src="../../image/footer/logo_whatsapp.webp" alt="logo_whatsapp">
                        WhatsApp
                    </a>
                </li>
            </ul>
        </div>
    </div>

    <div class="footer-bottom">
        <p>© 2026 Muna. Todos los derechos reservados.</p>
        <div>
            <a href="{{BASE}}pages/terminos_y_condiciones.html">Términos y Condiciones</a>
        </div>
    </div>

</footer>
`;

(function () {

    // Cuantos niveles hay que subir para llegar a la carpeta html/
    const calcularBase = () => {
        const path = decodeURIComponent(window.location.pathname);
        const idx = path.lastIndexOf('/html/');
        if (idx === -1) return '';
        const despuesDeHtml = path.slice(idx + '/html/'.length);
        const profundidad = despuesDeHtml.split('/').length - 1;
        return '../'.repeat(profundidad);
    };

    const inyectar = (selector, plantilla, eventoListo, base) => {
        const contenedor = document.querySelector(selector);
        if (!contenedor) return;
        contenedor.innerHTML = plantilla.split('{{BASE}}').join(base);
        // setTimeout: deja que nav.js registre su listener de 'nav:ready'
        // (lo hace dentro de DOMContentLoaded) antes de avisar.
        setTimeout(() => document.dispatchEvent(new CustomEvent(eventoListo)), 0);
    };

    const iniciar = () => {
        const base = calcularBase();
        inyectar('#nav-placeholder', NAV_HTML, 'nav:ready', base);
        inyectar('#footer-placeholder', FOOTER_HTML, 'footer:ready', base);
    };

    // nav.js escucha 'nav:ready' dentro de DOMContentLoaded, asi que
    // inyectamos tambien en ese momento (despues de registrar su listener).
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();