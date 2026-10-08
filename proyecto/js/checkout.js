document.addEventListener('DOMContentLoaded', () => {

    /* =====================================================================
       0. CONFIG — costo de envío a domicilio por localidad.
       Editá esta tabla con tus zonas reales. "default" cubre cualquier
       localidad que no esté en la lista.
       ===================================================================== */
    const COSTOS_ENVIO = {
        'default': 3500,
        'caba': 2000,
        'villa sarmiento': 2500,
        'moron': 2500,
        'la matanza': 3000
    };
    const getCostoEnvio = (localidad) => {
        const key = (localidad || '').trim().toLowerCase();
        return COSTOS_ENVIO[key] ?? COSTOS_ENVIO['default'];
    };
    const money = (n) => '$' + n.toLocaleString('es-AR');

    /* =====================================================================
       1. GUARD — si no hay sesión activa, mandamos a login y volvemos acá
       ===================================================================== */
    if (!Auth.isLoggedIn()) {
        const next = encodeURIComponent('../checkout/checkout.html');
        window.location.href = `../auth/login.html?next=${next}`;
        return;
    }

    /* =====================================================================
       2. CARRITO
       ===================================================================== */
    const getCart = () => {
        try { return JSON.parse(localStorage.getItem('carrito')) || []; }
        catch { return []; }
    };
    const clearCart = () => localStorage.removeItem('carrito');

    const cart = getCart();
    if (cart.length === 0) {
        window.location.href = '../index.html';
        return;
    }

    /* =====================================================================
       3. PRECOMPLETAR DATOS DEL USUARIO
       ===================================================================== */
    const activo = Auth.getActiveUser();
    const form = document.getElementById('checkout-form');
    if (activo) {
        form.nombre.value = activo.nombre;
        form.apellido.value = activo.apellido;
        form.mail.value = activo.email;
    }

    /* =====================================================================
       4. RESUMEN EN VIVO (columna derecha)
       ===================================================================== */
    const subtotal = cart.reduce((acc, p) => acc + p.precio * p.cantidad, 0);

    const renderProductos = () => {
        document.getElementById('summary-products').innerHTML = cart.map(p => `
            <div class="summary-item">
                <img src="${p.imagen}" alt="${p.nombre}">
                <div class="summary-item-info">
                    <div class="summary-item-name">${p.nombre}</div>
                    <div class="summary-item-qty">Cantidad: ${p.cantidad}</div>
                </div>
                <div class="summary-item-price">${money(p.precio * p.cantidad)}</div>
            </div>
        `).join('');
    };

    const actualizarCostoEnvio = () => {
        const localidad = form.localidad.value;
        const costo = getCostoEnvio(localidad);
        document.getElementById('precio-envio-domicilio').textContent = money(costo);
        document.getElementById('envio-domicilio-desc').textContent =
            localidad ? `Costo estimado a ${localidad}.` : 'Costo según tu localidad.';
        return costo;
    };

    const renderTotales = () => {
        const envioSeleccionado = form.envio.value; // 'retiro' | 'domicilio'
        const costoEnvioEstimado = actualizarCostoEnvio(); // refresca el precio mostrado en la opción
        const costoEnvio = envioSeleccionado === 'domicilio' ? costoEnvioEstimado : 0;
        const total = subtotal + costoEnvio;

        document.getElementById('summary-subtotal').textContent = money(subtotal);
        document.getElementById('summary-envio').textContent = costoEnvio > 0 ? money(costoEnvio) : 'Gratis';
        document.getElementById('summary-total').textContent = money(total);
    };

    renderProductos();
    renderTotales();

    form.localidad.addEventListener('input', renderTotales);
    form.querySelectorAll('input[name="envio"]').forEach(r => r.addEventListener('change', renderTotales));

    /* =====================================================================
       5. VALIDACIÓN Y CONFIRMACIÓN
       ===================================================================== */
    const errorEl = document.getElementById('datos-error');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        errorEl.hidden = true;

        if (!form.checkValidity()) {
            errorEl.textContent = 'Completá todos los campos obligatorios de envío.';
            errorEl.hidden = false;
            form.reportValidity();
            return;
        }

        const fd = new FormData(form);
        const datosEnvio = Object.fromEntries(fd.entries());
        const envioSeleccionado = datosEnvio.envio;
        const costoEnvio = envioSeleccionado === 'domicilio' ? getCostoEnvio(datosEnvio.localidad) : 0;
        const total = subtotal + costoEnvio;

        const pedido = {
            numero: Date.now().toString(36).toUpperCase(),
            fecha: new Date().toISOString(),
            estado: 'Procesando',
            usuario: activo,
            carrito: cart,
            subtotal,
            costoEnvio,
            total,
            pago: datosEnvio.pago,
            envioMetodo: envioSeleccionado,
            datosEnvio
        };

        // Guardamos también estos datos en el perfil, para que "Mi cuenta"
        // ya los tenga precargados la próxima vez.
        Auth.updateProfile({
            direccion: datosEnvio.direccion || '',
            piso: datosEnvio.piso || '',
            localidad: datosEnvio.localidad || '',
            codigoPostal: datosEnvio.codigoPostal || '',
            telefono: datosEnvio.telefono || ''
        });

        // Historial simple de pedidos (útil para la futura página de "cuenta")
        const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
        pedidos.push(pedido);
        localStorage.setItem('pedidos', JSON.stringify(pedidos));

        // El pedido recién confirmado, para que lo lea checkout-confirmado.html
        localStorage.setItem('ultimoPedido', JSON.stringify(pedido));

        clearCart();
        window.location.href = 'checkout-confirmado.html';
    });
});
