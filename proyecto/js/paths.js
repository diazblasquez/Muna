/**
 * paths.js
 * -----------------------------------------------------------------------
 * Busca la ruta correcta de cada archivo según la carpeta en la que está
 * el HTML que se está viendo (html/, html/pages/, html/product-detail/...).
 *
 * Hace dos cosas:
 *   1. Expone window.Rutas para pedir una ruta desde cualquier JS:
 *        Rutas.pagina('contacto.html')              -> '../pages/contacto.html'
 *        Rutas.recurso('image/footer/logo.webp')    -> '../../image/footer/logo.webp'
 *   2. Corrige solo los <a href> y <img src> que apunten mal (por ejemplo
 *      los del nav y el footer que inyecta includes.js). Los que ya están
 *      bien no se tocan.
 *
 * Se carga en el <head> de cada HTML, antes de que se inyecte el nav/footer.
 * Cuando se agrega una página nueva, anotarla en PAGINAS.
 * -----------------------------------------------------------------------
 */
(() => {
    // Carpeta (dentro de html/) en la que está cada página
    const PAGINAS = {
        '': ['index'],
        auth: ['login', 'register'],
        categories: ['categorie-alfajores', 'categorie-box', 'categorie-otros', 'categorie-tortas'],
        checkout: ['checkout', 'checkout-confirmado'],
        pages: ['contacto', 'envios_devoluciones', 'nosotros', 'profile', 'terminos_y_condiciones'],
        'product-detail': [
            'product-detail--box-aurora', 'product-detail--box-suspiro', 'product-detail--brownie',
            'product-detail--cookies', 'product-detail--keto', 'product-detail--lemon-pie',
            'product-detail--marplatense', 'product-detail--marplatense-blanco'
        ]
    };

    // nombre de archivo -> carpeta   (ej: 'contacto.html' -> 'pages')
    const CARPETA_DE = {};
    Object.entries(PAGINAS).forEach(([carpeta, nombres]) =>
        nombres.forEach((n) => { CARPETA_DE[n + '.html'] = carpeta; }));

    const subir = (niveles) => '../'.repeat(niveles);
    const archivoActual = decodeURIComponent(location.pathname).split('/').pop() || 'index.html';

    // Niveles que hay que subir para llegar a html/
    const niveles = (() => {
        if (archivoActual in CARPETA_DE) return CARPETA_DE[archivoActual] ? 1 : 0;
        // Página que no está en la lista: lo deducimos de la URL
        const ruta = decodeURIComponent(location.pathname);
        const i = ruta.lastIndexOf('/html/');
        return i < 0 ? 0 : ruta.slice(i + 6).split('/').length - 1;
    })();

    const base = subir(niveles);   // hasta html/
    const raiz = base + '../';     // hasta la carpeta del proyecto (image/, css/, js/)

    const Rutas = {
        base,
        raiz,
        // Ruta a una página por su nombre: Rutas.pagina('nosotros.html')
        pagina(nombre) {
            const carpeta = CARPETA_DE[nombre];
            return carpeta === undefined ? nombre : base + (carpeta ? carpeta + '/' : '') + nombre;
        },
        // Ruta a image/, css/, js/ o fonts/: Rutas.recurso('image/footer/logo.webp')
        recurso(ruta) {
            return raiz + ruta.replace(/^(\.\.\/)+/, '');
        },
        // Corrige los links e imágenes que estén mal dentro de "desde"
        arreglar(desde = document) {
            const nodos = desde.querySelectorAll ? [...desde.querySelectorAll('a[href], img[src]')] : [];
            if (desde.matches && desde.matches('a[href], img[src]')) nodos.push(desde);
            nodos.forEach(corregir);
        }
    };

    const ES_EXTERNA = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i; // http:, mailto:, data:, #ancla...
    const mismaUrl = (a, b) => new URL(a, location.href).href === new URL(b, location.href).href;

    const corregir = (el) => {
        const attr = el.tagName === 'A' ? 'href' : 'src';
        const valor = el.getAttribute(attr);
        if (!valor || ES_EXTERNA.test(valor)) return;

        const corte = valor.search(/[?#]/);
        const ruta = corte < 0 ? valor : valor.slice(0, corte);
        const resto = corte < 0 ? '' : valor.slice(corte); // ?next=... o #productos

        let correcta = null;
        if (attr === 'href' && ruta.endsWith('.html')) {
            const nombre = ruta.split('/').pop();
            if (nombre in CARPETA_DE) correcta = Rutas.pagina(nombre);
        } else if (attr === 'src' && ruta.includes('image/')) {
            correcta = raiz + ruta.slice(ruta.indexOf('image/'));
        }

        // Solo se reescribe si realmente apunta a otro lugar
        if (correcta && !mismaUrl(ruta, correcta)) el.setAttribute(attr, correcta + resto);
    };

    window.Rutas = Rutas;

    // Corrige lo que se inyecte después (nav y footer de includes.js)
    new MutationObserver((cambios) => {
        cambios.forEach((c) => c.addedNodes.forEach((n) => n.nodeType === 1 && Rutas.arreglar(n)));
    }).observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener('DOMContentLoaded', () => Rutas.arreglar());
})();
