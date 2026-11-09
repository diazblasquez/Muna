document.addEventListener('DOMContentLoaded', async () => {
    const { money, esc } = Api;

    const LABELS_PAGO = {
        transferencia: 'Transferencia / billetera digital',
        efectivo: 'Efectivo'
    };
    const NOTAS_PAGO = {
        transferencia: 'Te enviamos los datos para transferir a tu email.',
        efectivo: 'Pagás en efectivo en el momento de la entrega.'
    };
    const LABELS_ENVIO = {
        retiro: 'Recogida local',
        domicilio: 'Envío a domicilio'
    };

    // El número de pedido viene en la URL (?n=...). El servidor solo lo
    // devuelve si el pedido es de la persona que tiene la sesión iniciada.
    const numero = new URLSearchParams(window.location.search).get('n');
    if (!numero) {
        window.location.href = '../index.html';
        return;
    }

    const res = await Api.get('pedidos.php?numero=' + encodeURIComponent(numero));
    if (!res.ok) {
        window.location.href = res.codigo === 'no_logueado'
            ? '../auth/login.html?next=' + encodeURIComponent('../checkout/checkout-confirmado.html?n=' + numero)
            : '../index.html';
        return;
    }

    const { items, subtotal, costoEnvio, total, pago, envioMetodo, datosEnvio } = res.pedido;

    document.getElementById('confirm-layout').hidden = false;

    document.getElementById('confirm-numero').textContent = `Pedido #${res.pedido.numero}`;
    document.getElementById('confirm-titulo').textContent = `¡Gracias ${datosEnvio.nombre}!`;
    document.getElementById('confirm-email').textContent = datosEnvio.mail;

    document.getElementById('detalle-email').textContent = datosEnvio.mail;
    document.getElementById('detalle-telefono').textContent = datosEnvio.telefono || '—';

    document.getElementById('detalle-direccion').textContent = envioMetodo === 'domicilio'
        ? `${datosEnvio.nombre} ${datosEnvio.apellido}, ${datosEnvio.direccion} ${datosEnvio.piso || ''}, ${datosEnvio.localidad} (CP ${datosEnvio.codigoPostal})`
        : `${datosEnvio.nombre} ${datosEnvio.apellido} — Retiro en el local`;

    document.getElementById('summary-products').innerHTML = items.map((p) => `
        <div class="summary-item">
            <img src="${esc(Rutas.recurso(p.imagen))}" alt="${esc(p.nombre)}">
            <div class="summary-item-info">
                <div class="summary-item-name">${esc(p.nombre)}${p.etiqueta ? ' · ' + esc(p.etiqueta) : ''}</div>
                <div class="summary-item-qty">Cantidad: ${p.cantidad}</div>
            </div>
            <div class="summary-item-price">${money(p.subtotal)}</div>
        </div>
    `).join('');

    document.getElementById('summary-subtotal').textContent = money(subtotal);
    document.getElementById('summary-envio').textContent = costoEnvio > 0 ? money(costoEnvio) : `Gratis (${LABELS_ENVIO[envioMetodo]})`;
    document.getElementById('summary-pago').textContent = LABELS_PAGO[pago];
    document.getElementById('summary-total').textContent = money(total);
    document.getElementById('summary-nota-pago').textContent = NOTAS_PAGO[pago];
});
