document.addEventListener('DOMContentLoaded', () => {

    const money = (n) => '$' + n.toLocaleString('es-AR');
    const fecha = (iso) => new Date(iso).toLocaleDateString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });

    const LABELS_PAGO = {
        transferencia: 'Transferencia / billetera digital',
        efectivo: 'Efectivo'
    };
    const LABELS_ENVIO = {
        retiro: 'Recogida local',
        domicilio: 'Envío a domicilio'
    };
    const LABELS_ESTADO = {
        procesando: 'Procesando',
        enviado: 'Enviado',
        entregado: 'Entregado',
        cancelado: 'Cancelado'
    };

    /* =====================================================================
       1. GUARD — sin sesión no hay nada que mostrar acá
       ===================================================================== */
    if (!Auth.isLoggedIn()) {
        const next = encodeURIComponent('../pages/profile.html');
        window.location.href = `../auth/login.html?next=${next}`;
        return;
    }

    const activo = Auth.getActiveUser();
    document.getElementById('profile-greeting').textContent = `Hola, ${activo.nombre} ${activo.apellido}`;

    /* =====================================================================
       2. CERRAR SESIÓN
       ===================================================================== */
    document.getElementById('btn-logout').addEventListener('click', () => {
        const confirmado = confirm('¿Seguro que querés cerrar sesión?');
        if (!confirmado) return;
        Auth.logoutUser();
        window.location.href = '../index.html';
    });

    /* =====================================================================
       3. PESTAÑAS: PEDIDOS / PERFIL
       ===================================================================== */
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.querySelector(`.tab-panel[data-panel="${btn.dataset.tab}"]`).classList.add('active');
        });
    });

    /* =====================================================================
       4. PEDIDOS — listado + modal de detalle
       ===================================================================== */
    const getPedidosDelUsuario = () => {
        let pedidos = [];
        try { pedidos = JSON.parse(localStorage.getItem('pedidos')) || []; } catch { /* noop */ }
        return pedidos
            .filter(p => p.usuario && p.usuario.email === activo.email)
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    };

    const pedidos = getPedidosDelUsuario();
    const ordersList = document.getElementById('orders-list');

    if (pedidos.length === 0) {
        ordersList.innerHTML = `
            <div class="orders-empty">
                <p>Todavía no hiciste ningún pedido.</p>
                <a href="../index.html">Ir a la tienda →</a>
            </div>
        `;
    } else {
        ordersList.innerHTML = pedidos.map((p, i) => {
            const estadoKey = (p.estado || 'procesando').toLowerCase();
            return `
                <div class="order-card">
                    <div class="order-card-main">
                        <span class="order-card-numero">Pedido #${p.numero}</span>
                        <span class="order-card-fecha">${fecha(p.fecha)} · ${p.carrito.length} producto(s)</span>
                    </div>
                    <div class="order-card-side">
                        <span class="order-status status-${estadoKey}">${LABELS_ESTADO[estadoKey] || p.estado}</span>
                        <span class="order-card-total">${money(p.total)}</span>
                        <button class="btn-ver-detalle" data-index="${i}" type="button">Ver detalle</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    const modalOverlay = document.getElementById('order-modal-overlay');

    const abrirModal = (pedido) => {
        document.getElementById('modal-numero').textContent = `Pedido #${pedido.numero}`;
        document.getElementById('modal-fecha').textContent = fecha(pedido.fecha);

        document.getElementById('modal-productos').innerHTML = pedido.carrito.map(prod => `
            <div class="order-modal-item">
                <img src="${prod.imagen}" alt="${prod.nombre}">
                <div class="order-modal-item-info">
                    <div class="order-modal-item-name">${prod.nombre}</div>
                    <div class="order-modal-item-qty">Cantidad: ${prod.cantidad}</div>
                </div>
                <div class="order-modal-item-price">${money(prod.precio * prod.cantidad)}</div>
            </div>
        `).join('');

        document.getElementById('modal-subtotal').textContent = money(pedido.subtotal);
        document.getElementById('modal-envio').textContent = pedido.costoEnvio > 0
            ? money(pedido.costoEnvio)
            : `Gratis (${LABELS_ENVIO[pedido.envioMetodo] || pedido.envioMetodo})`;
        document.getElementById('modal-pago').textContent = LABELS_PAGO[pedido.pago] || pedido.pago;
        document.getElementById('modal-total').textContent = money(pedido.total);

        const d = pedido.datosEnvio || {};
        document.getElementById('modal-cliente-nombre').textContent = `${d.nombre || ''} ${d.apellido || ''}`.trim() || '—';
        document.getElementById('modal-cliente-email').textContent = d.mail || '—';
        document.getElementById('modal-cliente-telefono').textContent = d.telefono || '—';
        document.getElementById('modal-cliente-cp').textContent = d.codigoPostal || '—';
        document.getElementById('modal-cliente-direccion').textContent = pedido.envioMetodo === 'domicilio'
            ? `${d.direccion || ''} ${d.piso || ''}, ${d.localidad || ''}`.trim()
            : 'Retiro en el local';

        modalOverlay.classList.add('open');
    };

    ordersList.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-ver-detalle');
        if (!btn) return;
        abrirModal(pedidos[Number(btn.dataset.index)]);
    });

    const cerrarModal = () => modalOverlay.classList.remove('open');
    document.getElementById('order-modal-close').addEventListener('click', cerrarModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) cerrarModal();
    });

    /* =====================================================================
       5. PERFIL — vista resumen + formulario editable
       ===================================================================== */
    const summaryView = document.getElementById('profile-summary-view');
    const profileForm = document.getElementById('profile-form');
    const btnEditar = document.getElementById('btn-editar-perfil');
    const btnCancelar = document.getElementById('btn-cancelar-perfil');
    const profileFeedback = document.getElementById('profile-feedback');

    const dashIfEmpty = (v) => (v && v.trim() ? v : '—');

    const pintarResumen = (usuario) => {
        document.getElementById('resumen-nombre').textContent = dashIfEmpty(usuario.nombre);
        document.getElementById('resumen-apellido').textContent = dashIfEmpty(usuario.apellido);
        document.getElementById('resumen-email').textContent = dashIfEmpty(usuario.email);
        document.getElementById('resumen-telefono').textContent = dashIfEmpty(usuario.telefono);
        document.getElementById('resumen-direccion').textContent = dashIfEmpty(usuario.direccion);
        document.getElementById('resumen-piso').textContent = dashIfEmpty(usuario.piso);
        document.getElementById('resumen-localidad').textContent = dashIfEmpty(usuario.localidad);
        document.getElementById('resumen-cp').textContent = dashIfEmpty(usuario.codigoPostal);
    };

    const cargarFormulario = (usuario) => {
        profileForm.nombre.value = usuario.nombre || '';
        profileForm.apellido.value = usuario.apellido || '';
        document.getElementById('perfil-email').value = usuario.email || '';
        profileForm.telefono.value = usuario.telefono || '';
        profileForm.direccion.value = usuario.direccion || '';
        profileForm.piso.value = usuario.piso || '';
        profileForm.localidad.value = usuario.localidad || '';
        profileForm.codigoPostal.value = usuario.codigoPostal || '';
    };

    pintarResumen(activo);
    cargarFormulario(activo);

    const mostrarEdicion = () => {
        summaryView.classList.add('hidden-view');
        profileForm.classList.add('active');
        btnEditar.hidden = true;
    };

    const mostrarResumen = () => {
        summaryView.classList.remove('hidden-view');
        profileForm.classList.remove('active');
        btnEditar.hidden = false;
        profileFeedback.hidden = true;
    };

    btnEditar.addEventListener('click', mostrarEdicion);
    btnCancelar.addEventListener('click', () => {
        cargarFormulario(Auth.getActiveUser());
        mostrarResumen();
    });

    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(profileForm);
        const res = Auth.updateProfile({
            nombre: fd.get('nombre'),
            apellido: fd.get('apellido'),
            telefono: fd.get('telefono'),
            direccion: fd.get('direccion'),
            piso: fd.get('piso'),
            localidad: fd.get('localidad'),
            codigoPostal: fd.get('codigoPostal')
        });

        profileFeedback.hidden = false;
        if (!res.ok) {
            profileFeedback.textContent = res.error;
            profileFeedback.className = 'form-feedback is-error';
            return;
        }

        profileFeedback.textContent = 'Datos actualizados correctamente.';
        profileFeedback.className = 'form-feedback is-success';
        pintarResumen(res.user);
        document.getElementById('profile-greeting').textContent = `Hola, ${res.user.nombre} ${res.user.apellido}`;
        mostrarResumen();
    });

    /* =====================================================================
       6. CAMBIO DE CONTRASEÑA
       ===================================================================== */
    const passwordForm = document.getElementById('password-form');
    const passwordFeedback = document.getElementById('password-feedback');

    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(passwordForm);
        const actual = fd.get('passwordActual');
        const nueva = fd.get('passwordNueva');
        const nueva2 = fd.get('passwordNueva2');

        passwordFeedback.hidden = false;

        if (nueva !== nueva2) {
            passwordFeedback.textContent = 'Las contraseñas nuevas no coinciden.';
            passwordFeedback.className = 'form-feedback is-error';
            return;
        }

        const res = Auth.changePassword(actual, nueva);
        if (!res.ok) {
            passwordFeedback.textContent = res.error;
            passwordFeedback.className = 'form-feedback is-error';
            return;
        }

        passwordFeedback.textContent = 'Contraseña actualizada correctamente.';
        passwordFeedback.className = 'form-feedback is-success';
        passwordForm.reset();
    });
});
