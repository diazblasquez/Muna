document.addEventListener('DOMContentLoaded', async () => {
    const { money, esc } = Api;

    const form = document.getElementById('checkout-form');
    const errorEl = document.getElementById('datos-error');
    const botonConfirmar = document.getElementById('btn-confirmar');

    // Si alguien envía el formulario antes de que cargue todo, no se manda por la URL
    form.addEventListener('submit', (e) => e.preventDefault());

    const mostrarError = (texto) => {
        errorEl.textContent = texto;
        errorEl.hidden = false;
    };

    /* =====================================================================
       1. GUARD — sin sesión se va a login y se vuelve acá; sin carrito, al inicio
       ===================================================================== */
    await Auth.load();
    if (!Auth.isLoggedIn()) {
        const next = encodeURIComponent('../checkout/checkout.html');
        window.location.href = `../auth/login.html?next=${next}`;
        return;
    }
    if (Carrito.items().length === 0) {
        window.location.href = '../index.html';
        return;
    }

    /* =====================================================================
       2. DATOS DEL SERVIDOR: productos con precios actuales y costos de envío
       ===================================================================== */
    const [detalle, zonas] = await Promise.all([Carrito.detalle(), Api.get('envio.php')]);

    if (detalle.error) {
        mostrarError(detalle.error);
        botonConfirmar.disabled = true;
        return;
    }
    if (detalle.lineas.length === 0) {
        window.location.href = '../index.html';
        return;
    }
    if (detalle.quitados > 0) {
        mostrarError('Sacamos de tu carrito productos que ya no están disponibles.');
    }

    /* =====================================================================
       3. PRECOMPLETAR LOS DATOS DEL USUARIO
       ===================================================================== */
    const activo = Auth.getActiveUser();
    const precargar = {
        nombre: activo.nombre, apellido: activo.apellido, mail: activo.email,
        telefono: activo.telefono, direccion: activo.direccion, piso: activo.piso,
        localidad: activo.localidad, codigoPostal: activo.codigoPostal
    };
    Object.entries(precargar).forEach(([campo, valor]) => {
        if (form.elements[campo] && valor) form.elements[campo].value = valor;
    });

    /* =====================================================================
       4. RESUMEN EN VIVO (columna derecha)
       Los importes que se muestran acá son informativos: el servidor los
       vuelve a calcular al confirmar el pedido.
       ===================================================================== */
    const normalizar = (s) => (s || '').toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ');

    const tablaEnvio = new Map(zonas.ok ? zonas.zonas.map((z) => [z.clave, z.costo]) : []);
    const costoEnvio = (localidad) => {
        if (!zonas.ok) return null; // no se pudo consultar
        const clave = normalizar(localidad);
        return tablaEnvio.has(clave) ? tablaEnvio.get(clave) : zonas.default;
    };

    document.getElementById('summary-products').innerHTML = detalle.lineas.map((l) => `
        <div class="summary-item">
            <img src="${esc(l.imagen)}" alt="${esc(l.nombre)}">
            <div class="summary-item-info">
                <div class="summary-item-name">${esc(l.nombre)}${l.etiqueta ? ' · ' + esc(l.etiqueta) : ''}</div>
                <div class="summary-item-qty">Cantidad: ${l.c}</div>
            </div>
            <div class="summary-item-price">${money(l.subtotal)}</div>
        </div>
    `).join('');

    const renderTotales = () => {
        const localidad = form.localidad.value;
        const costo = costoEnvio(localidad);

        document.getElementById('precio-envio-domicilio').textContent = costo === null ? 'A confirmar' : money(costo);
        document.getElementById('envio-domicilio-desc').textContent =
            localidad ? `Costo estimado a ${localidad}.` : 'Costo según tu localidad.';

        const conEnvio = form.envio.value === 'domicilio' && costo !== null;
        const envio = conEnvio ? costo : 0;

        document.getElementById('summary-subtotal').textContent = money(detalle.subtotal);
        document.getElementById('summary-envio').textContent = envio > 0 ? money(envio) : 'Gratis';
        document.getElementById('summary-total').textContent = money(detalle.subtotal + envio);
    };

    renderTotales();
    form.localidad.addEventListener('input', renderTotales);
    form.querySelectorAll('input[name="envio"]').forEach((r) => r.addEventListener('change', renderTotales));

    /* =====================================================================
       5. VALIDACIÓN Y CONFIRMACIÓN
       ===================================================================== */
    // Identifica este intento de compra: si se hace doble clic o se reenvía,
    // el servidor devuelve el mismo pedido en lugar de crear otro.
    const claveEnvio = (window.crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.hidden = true;

        if (!form.checkValidity()) {
            mostrarError('Completá todos los campos obligatorios de envío.');
            form.reportValidity();
            return;
        }

        botonConfirmar.disabled = true;

        // Solo se envía QUÉ se compra y CUÁNTO (ids y cantidades) más los datos del cliente
        const res = await Api.post('pedidos.php', {
            ...Object.fromEntries(new FormData(form).entries()),
            items: Carrito.items(),
            clave: claveEnvio
        });

        if (!res.ok) {
            if (res.codigo === 'no_logueado') {
                window.location.href = '../auth/login.html?next=' + encodeURIComponent('../checkout/checkout.html');
                return;
            }
            mostrarError(res.error);
            if (res.codigo === 'carrito_desactualizado') {
                setTimeout(() => window.location.reload(), 2500); // al recargar se limpia el carrito
            } else {
                botonConfirmar.disabled = false;
            }
            return;
        }

        Carrito.vaciar();
        window.location.href = 'checkout-confirmado.html?n=' + encodeURIComponent(res.pedido.numero);
    });
});
