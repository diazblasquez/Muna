/**
 * catalogo.js
 * -----------------------------------------------------------------------
 * Mantiene los precios que se ven en las páginas iguales a los de la base
 * de datos (que son los que se cobran):
 *   - Listados (inicio y categorías): "$ 14.000 - $ 28.000"
 *   - Página de producto: precio y opciones del selector de presentación
 *
 * Si el servidor no responde, se dejan los textos que ya trae el HTML.
 * -----------------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', async () => {
    const enlaces = document.querySelectorAll('a[href*="product-detail--"]');
    const precioDetalle = document.querySelector('.product-info .price');
    if (!enlaces.length && !precioDetalle) return;

    const r = await Api.catalogo();
    if (!r.ok) return;

    const porSlug = new Map(r.productos.map((p) => [p.slug, p]));
    const slugDe = (href) => (href.match(/product-detail--([^/?#]+)\.html/) || [])[1];
    const numero = (n) => Number(n).toLocaleString('es-AR');

    // --- Listados ----------------------------------------------------------
    enlaces.forEach((a) => {
        const producto = porSlug.get(slugDe(a.getAttribute('href')));
        const etiquetaPrecio = a.querySelector('.product--price');
        if (!producto || !etiquetaPrecio) return;

        const precios = producto.variantes.map((v) => v.precio);
        const min = Math.min(...precios);
        const max = Math.max(...precios);
        etiquetaPrecio.textContent = min === max ? `$ ${numero(min)}` : `$ ${numero(min)} - $ ${numero(max)}`;
    });

    // --- Página de producto ------------------------------------------------
    const slug = slugDe(location.pathname);
    const producto = slug && porSlug.get(slug);
    if (!precioDetalle || !producto) return;

    const select = document.querySelector('select.cantidad'); // presentaciones (los boxes y tortas usan un input numérico)
    if (select) {
        // Las opciones salen de la base (cada una con su id y su precio)
        select.innerHTML = producto.variantes
            .map((v) => `<option value="${v.id}">${Api.esc(v.etiqueta || 'Único')}</option>`)
            .join('');
    }

    const mostrarPrecio = () => {
        const elegida = producto.variantes.find((v) => select && String(v.id) === select.value) || producto.variantes[0];
        precioDetalle.textContent = Api.money(elegida.precio);
    };
    if (select) select.addEventListener('change', mostrarPrecio);
    mostrarPrecio();
});
