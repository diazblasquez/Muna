document.addEventListener('DOMContentLoaded', () => {
    //Evita que el script se ejecute más de una vez si queda duplicado
    if (window.cartInitialized) return;
    window.cartInitialized = true;

    const cartBtn = document.getElementById('floating-cart');
    const sidebar = document.getElementById('cart-sidebar');
    const closeBtn = document.getElementById('close-cart');
    const container = document.getElementById('cart-sidebar-items');
    const totalElement = document.getElementById('cart-sidebar-total');
    const badge = document.getElementById('cart-badge');
    const addBtn = document.querySelector('.carrito');
    const checkoutBtn = document.querySelector('.btn-checkout');

    if (!cartBtn || !sidebar) return;

    // Calcula cuántos niveles hay que subir para llegar a la carpeta html/
    // (index.html está en html/, product-detail está en html/product-detail/, etc.)
    const rutaBaseHtml = () => {
        const path = window.location.pathname;
        const idx = path.indexOf('/html/');
        if (idx === -1) return '';
        const despuesDeHtml = path.slice(idx + '/html/'.length);
        const profundidad = despuesDeHtml.split('/').length - 1;
        return '../'.repeat(profundidad);
    };

    // --- MANEJO DE APERTURA Y CIERRE DE LA COLUMNA ---
    cartBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        sidebar.classList.toggle('open');
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));
    }

    sidebar.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que hacer clic dentro del contenedor lo cierre
    });

    document.addEventListener('click', () => {
        sidebar.classList.remove('open'); // Cierre inteligente al hacer clic en el fondo
    });

    // --- ACCESO A LOCALSTORAGE Y RENDERIZADO ---
    const getCart = () => JSON.parse(localStorage.getItem('carrito')) || [];
    
    const saveCart = (cart) => {
        localStorage.setItem('carrito', JSON.stringify(cart));
        render();
    };

    const render = () => {
        const cart = getCart();
        
        if (badge) {
            badge.innerText = cart.reduce((acc, item) => acc + item.cantidad, 0);
        }
        
        if (container) {
            if (cart.length === 0) {
                container.innerHTML = '<p style="text-align:center; margin-top:30px; background:transparent; color:#777;">Tu carrito está vacío.</p>';
            } else {
                container.innerHTML = cart.map((p, i) => `
                    <div class="sidebar-item">
                        <img src="${p.imagen}">
                        <div class="sidebar-item-info">
                            <h4>${p.nombre}</h4>
                            <p>$${p.precio}</p>
                            <div class="sidebar-qty-controls">
                                <button class="btn-qty" data-action="restar" data-index="${i}">-</button>
                                <span class="qty-val">${p.cantidad}</span>
                                <button class="btn-qty" data-action="sumar" data-index="${i}">+</button>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }

        if (totalElement) {
            const total = cart.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
            totalElement.innerText = '$' + total;
        }
    };

    // --- DELEGACIÓN DE EVENTOS PARA BOTONES INTERNOS ---
    if (container) {
        container.addEventListener('click', (e) => {
            const button = e.target.closest('.btn-qty');
            if (!button) return;

            const index = parseInt(button.getAttribute('data-index'));
            const action = button.getAttribute('data-action');
            let cart = getCart();

            if (action === 'sumar') {
                cart[index].cantidad += 1;
            } else if (action === 'restar') {
                cart[index].cantidad -= 1;
                if (cart[index].cantidad <= 0) cart.splice(index, 1);
            }
            saveCart(cart);
        });
    }

    // --- ACCIÓN DEL BOTÓN AGREGAR ---
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const nameEl = document.querySelector('.product-info h2');
            const priceEl = document.querySelector('.price');
            const qtyEl = document.querySelector('.cantidad');
            const imgEl = document.querySelector('.product');

            if (!nameEl || !priceEl || !imgEl) return;

            const item = {
                nombre: nameEl.innerText,
                precio: parseFloat(priceEl.innerText.replace(/[^0-9.]/g, '')),
                cantidad: qtyEl ? (parseInt(qtyEl.value) || 1) : 1,
                imagen: imgEl.src
            };

            let cart = getCart();
            const ext = cart.find(i => i.nombre === item.nombre);
            
            if (ext) {
                ext.cantidad += item.cantidad;
            } else {
                cart.push(item);
            }
            
            saveCart(cart);
            sidebar.classList.add('open');
        });
    }

    // --- IR AL CHECKOUT ---
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (getCart().length === 0) return;
            window.location.href = rutaBaseHtml() + 'checkout/checkout.html';
        });
    }

    render();
});