/**
 * cart.js
 * -----------------------------------------------------------------------
 * Carrito de compras. Dos partes:
 *
 *  1) Carrito (módulo): guarda en el navegador SOLO qué se compra y cuánto
 *     ([{ v: idPresentacion, c: cantidad }]). Nombre, imagen y precio se
 *     piden siempre al servidor (api/productos.php), que es la única fuente
 *     de precios. Lo usan este mismo archivo y checkout.js.
 *
 *  2) Panel lateral: botón flotante, lista de productos, +/- y total.
 *     Solo se activa en las páginas que tienen el HTML del carrito.
 * -----------------------------------------------------------------------
 */

/* =====================================================================
   1. MÓDULO CARRITO
   ===================================================================== */
const Carrito = (() => {
    const CLAVE = 'carrito_v2';
    const MAX_POR_PRODUCTO = 99;

    // El formato anterior guardaba los precios en el navegador (se podían
    // alterar). Ya no se usa: se descarta.
    try { localStorage.removeItem('carrito'); } catch { /* sin acceso a localStorage */ }

    const valido = (i) => i && Number.isInteger(i.v) && i.v > 0 && Number.isInteger(i.c) && i.c > 0;

    const leer = () => {
        try {
            const datos = JSON.parse(localStorage.getItem(CLAVE));
            return Array.isArray(datos)
                ? datos.filter(valido).map((i) => ({ v: i.v, c: Math.min(i.c, MAX_POR_PRODUCTO) }))
                : [];
        } catch {
            return [];
        }
    };

    const guardar = (items) => {
        try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch { /* noop */ }
        document.dispatchEvent(new CustomEvent('carrito:cambio'));
    };

    const agregar = (v, c = 1) => {
        const items = leer();
        const existente = items.find((i) => i.v === v);
        if (existente) existente.c = Math.min(MAX_POR_PRODUCTO, existente.c + c);
        else items.push({ v, c: Math.min(MAX_POR_PRODUCTO, c) });
        guardar(items);
    };

    /** Suma o resta unidades; si llega a 0 el producto sale del carrito. */
    const cambiar = (v, delta) => {
        const items = leer();
        const item = items.find((i) => i.v === v);
        if (!item) return;
        item.c = Math.min(MAX_POR_PRODUCTO, item.c + delta);
        guardar(items.filter((i) => i.c > 0));
    };

    const vaciar = () => guardar([]);

    // Datos de cada presentación (nombre, precio, imagen) ya pedidos al servidor
    const info = new Map();

    /**
     * Devuelve los productos del carrito con datos y precios actuales del
     * servidor. Si algún producto ya no está disponible, se saca del carrito.
     * -> { lineas: [{ v, c, nombre, etiqueta, precio, imagen, subtotal }], subtotal, quitados }
     *    o { error } si no se pudo consultar.
     */
    const detalle = async () => {
        const items = leer();
        if (!items.length) return { lineas: [], subtotal: 0, quitados: 0 };

        const faltantes = items.filter((i) => !info.has(i.v)).map((i) => i.v);
        if (faltantes.length) {
            const r = await Api.get('productos.php?variantes=' + faltantes.join(','));
            if (!r.ok) return { error: r.error || 'No pudimos cargar tu carrito.' };
            r.variantes.forEach((v) => info.set(v.id, v));
        }

        const disponibles = items.filter((i) => info.has(i.v));
        const quitados = items.length - disponibles.length;
        if (quitados > 0) guardar(disponibles); // dispara 'carrito:cambio'

        const lineas = disponibles.map((i) => {
            const d = info.get(i.v);
            return {
                v: i.v,
                c: i.c,
                nombre: d.nombre,
                etiqueta: d.etiqueta,
                precio: d.precio,
                imagen: Rutas.recurso(d.imagen),
                subtotal: d.precio * i.c
            };
        });
        return { lineas, subtotal: lineas.reduce((acc, l) => acc + l.subtotal, 0), quitados };
    };

    return {
        items: leer,
        cantidadTotal: () => leer().reduce((acc, i) => acc + i.c, 0),
        agregar,
        cambiar,
        vaciar,
        detalle,
        CLAVE
    };
})();

/* =====================================================================
   2. PANEL LATERAL
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const cartBtn = document.getElementById('floating-cart');
    const sidebar = document.getElementById('cart-sidebar');
    const closeBtn = document.getElementById('close-cart');
    const container = document.getElementById('cart-sidebar-items');
    const totalElement = document.getElementById('cart-sidebar-total');
    const badge = document.getElementById('cart-badge');
    const addBtn = document.querySelector('.carrito');
    const checkoutBtn = document.querySelector('.btn-checkout');

    if (!cartBtn || !sidebar) return; // esta página no tiene carrito (ej: checkout)

    const { esc, money } = Api;
    const NOTA = 'text-align:center; margin-top:30px; background:transparent; color:#777;';

    // --- Abrir y cerrar ---------------------------------------------------
    cartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
    });
    if (closeBtn) closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));
    sidebar.addEventListener('click', (e) => e.stopPropagation()); // clic adentro no lo cierra
    document.addEventListener('click', () => sidebar.classList.remove('open')); // clic afuera sí

    // --- Dibujar el carrito ----------------------------------------------
    let ultimoRender = 0;

    const render = async () => {
        const miRender = ++ultimoRender;

        if (badge) badge.innerText = Carrito.cantidadTotal();
        if (!container) return;

        if (Carrito.items().length === 0) {
            container.innerHTML = `<p style="${NOTA}">Tu carrito está vacío.</p>`;
            if (totalElement) totalElement.innerText = money(0);
            return;
        }

        const d = await Carrito.detalle();
        if (miRender !== ultimoRender) return; // ya hay un render más nuevo en camino

        if (d.error) {
            container.innerHTML = `<p style="${NOTA}">${esc(d.error)}</p>`;
            return;
        }
        if (d.quitados > 0) return; // detalle() ya avisó el cambio: se vuelve a dibujar solo

        container.innerHTML = d.lineas.map((l) => `
            <div class="sidebar-item">
                <img src="${esc(l.imagen)}" alt="${esc(l.nombre)}">
                <div class="sidebar-item-info">
                    <h4>${esc(l.nombre)}${l.etiqueta ? ' · ' + esc(l.etiqueta) : ''}</h4>
                    <p>${money(l.precio)}</p>
                    <div class="sidebar-qty-controls">
                        <button class="btn-qty" data-action="restar" data-v="${l.v}" aria-label="Quitar una unidad">-</button>
                        <span class="qty-val">${l.c}</span>
                        <button class="btn-qty" data-action="sumar" data-v="${l.v}" aria-label="Agregar una unidad">+</button>
                    </div>
                </div>
            </div>
        `).join('');

        if (totalElement) totalElement.innerText = money(d.subtotal);
    };

    const aviso = (texto) => {
        if (!container) return;
        container.querySelectorAll('.cart-aviso').forEach((n) => n.remove());
        container.insertAdjacentHTML('afterbegin', `<p class="cart-aviso" style="${NOTA}">${esc(texto)}</p>`);
        setTimeout(() => container.querySelectorAll('.cart-aviso').forEach((n) => n.remove()), 4000);
    };

    // --- Botones + y - -----------------------------------------------------
    if (container) {
        container.addEventListener('click', (e) => {
            const boton = e.target.closest('.btn-qty');
            if (!boton) return;
            const v = Number(boton.dataset.v);
            Carrito.cambiar(v, boton.dataset.action === 'sumar' ? 1 : -1);
        });
    }

    // --- Botón "Agregar al carrito" (páginas de producto) -----------------
    // El producto se identifica por el nombre del archivo:
    // product-detail--keto.html  ->  slug "keto"
    const slugActual = () => {
        const m = decodeURIComponent(location.pathname).match(/product-detail--([^/]+)\.html$/);
        return m ? m[1] : null;
    };

    // En las páginas de producto hay dos formas de elegir:
    //   <select class="cantidad">        -> la PRESENTACIÓN (6u, 12u...): alfajores y cookies
    //   <input type="number" class="cantidad"> -> la CANTIDAD de unidades: tortas y boxes
    const selectorPresentacion = document.querySelector('select.cantidad');
    const inputCantidad = document.querySelector('input.cantidad');

    const presentacionElegida = (producto) => {
        const variantes = producto.variantes;
        if (selectorPresentacion) {
            const porId = variantes.find((v) => String(v.id) === selectorPresentacion.value);
            if (porId) return porId;
            const texto = selectorPresentacion.selectedOptions[0]?.textContent.trim();
            const porTexto = variantes.find((v) => v.etiqueta === texto);
            if (porTexto) return porTexto;
        }
        return variantes.length === 1 ? variantes[0] : null; // si hay dudas, no se adivina
    };

    const cantidadElegida = () => {
        const n = inputCantidad ? parseInt(inputCantidad.value, 10) : 1;
        return Number.isInteger(n) ? Math.min(99, Math.max(1, n)) : 1;
    };

    const slug = slugActual();
    if (addBtn && slug) {
        addBtn.addEventListener('click', async () => {
            addBtn.disabled = true;
            try {
                const r = await Api.producto(slug);
                if (!r.ok || !r.producto) {
                    sidebar.classList.add('open');
                    aviso(r.error || 'No pudimos agregar el producto. Probá de nuevo.');
                    return;
                }
                const variante = presentacionElegida(r.producto);
                if (!variante) {
                    sidebar.classList.add('open');
                    aviso('Elegí una presentación para agregar el producto.');
                    return;
                }
                Carrito.agregar(variante.id, cantidadElegida());
                sidebar.classList.add('open');
            } finally {
                addBtn.disabled = false;
            }
        });
    }

    // --- Ir al checkout -----------------------------------------------------
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (Carrito.items().length === 0) return;
            window.location.href = Rutas.pagina('checkout.html');
        });
    }

    // Se vuelve a dibujar cuando cambia el carrito (en esta pestaña o en otra)
    document.addEventListener('carrito:cambio', render);
    window.addEventListener('storage', (e) => { if (e.key === Carrito.CLAVE) render(); });

    render();
});
