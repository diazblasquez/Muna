document.addEventListener('DOMContentLoaded', () => {

    const money = (n) => '$' + n.toLocaleString('es-AR');

    const LABELS_PAGO = {
        transferencia: 'Transferencia / billetera digital',
        efectivo: 'Efectivo'
    };
    const NOTAS_PAGO = {
        transferencia: 'Te enviaremos los datos para transferir a tu email.',
        efectivo: 'Paga en efectivo en el momento de la entrega.'
    };
    const LABELS_ENVIO = {
        retiro: 'Recogida local',
        domicilio: 'Envío a domicilio'
    };

    let pedido = null;
    try { pedido = JSON.parse(localStorage.getItem('ultimoPedido')); } catch { /* noop */ }

    const layoutOk = document.getElementById('confirm-layout');

    if (!pedido) {
        // Sin pedido guardado, no hay nada que mostrar: volvemos a la tienda
        window.location.href = '../index.html';
        return;
    }

    layoutOk.hidden = false;

    const { numero, carrito, subtotal, costoEnvio, total, pago, envioMetodo, datosEnvio } = pedido;

    document.getElementById('confirm-numero').textContent = `Pedido #${numero}`;
    document.getElementById('confirm-titulo').textContent = `¡Gracias ${datosEnvio.nombre}!`;
    document.getElementById('confirm-email').textContent = datosEnvio.mail;

    document.getElementById('detalle-email').textContent = datosEnvio.mail;
    document.getElementById('detalle-telefono').textContent = datosEnvio.telefono || '—';

    const direccionTexto = envioMetodo === 'domicilio'
        ? `${datosEnvio.nombre} ${datosEnvio.apellido}, ${datosEnvio.direccion} ${datosEnvio.piso || ''}, ${datosEnvio.localidad} (CP ${datosEnvio.codigoPostal})`
        : `${datosEnvio.nombre} ${datosEnvio.apellido} — Retiro en el local`;
    document.getElementById('detalle-direccion').textContent = direccionTexto;

    document.getElementById('summary-products').innerHTML = carrito.map(p => `
        <div class="summary-item">
            <img src="${p.imagen}" alt="${p.nombre}">
            <div class="summary-item-info">
                <div class="summary-item-name">${p.nombre}</div>
                <div class="summary-item-qty">Cantidad: ${p.cantidad}</div>
            </div>
            <div class="summary-item-price">${money(p.precio * p.cantidad)}</div>
        </div>
    `).join('');

    document.getElementById('summary-subtotal').textContent = money(subtotal);
    document.getElementById('summary-envio').textContent = costoEnvio > 0 ? money(costoEnvio) : `Gratis (${LABELS_ENVIO[envioMetodo]})`;
    document.getElementById('summary-pago').textContent = LABELS_PAGO[pago];
    document.getElementById('summary-total').textContent = money(total);
    document.getElementById('summary-nota-pago').textContent = NOTAS_PAGO[pago];
});
