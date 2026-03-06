document.addEventListener('DOMContentLoaded', () => {
    renderCart();

    const checkoutBtn = document.querySelector('button.bg-primary');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', processCheckout);
    }
});

const formatCurrency = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
};

function renderCart() {
    console.log('Rendering cart...');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    if (!cartItemsContainer || !cartTotalElement) return;

    let cart = [];
    try {
        cart = JSON.parse(localStorage.getItem('cart')) || [];
    } catch (e) {
        console.error('Error parsing cart from localStorage:', e);
        cart = [];
    }

    console.log('Cart content:', cart);

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="text-center py-20 px-4">
                <span class="material-symbols-outlined text-6xl text-slate-300 mb-4">shopping_cart</span>
                <p class="text-slate-500 text-lg">Tu carrito está esperando por equipo de élite.</p>
                <a href="catalogo.html" class="inline-block mt-6 text-primary font-bold hover:underline">Ir a la tienda</a>
            </div>
        `;
        cartTotalElement.innerText = '$0.00';
        return;
    }

    let total = 0;
    cartItemsContainer.innerHTML = cart.map(item => {
        const id_producto = item.id_producto;
        const nombre = item.nombre || 'Producto';
        const precio = parseFloat(item.precio) || 0;
        const cantidad = parseInt(item.cantidad) || 0;
        const subtotal = precio * cantidad;
        total += subtotal;

        return `
            <div class="flex flex-col md:flex-row items-center gap-6 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                <a href="catalogo.html#producto-${id_producto}" class="size-24 overflow-hidden rounded-lg flex-shrink-0 bg-slate-100">
                    <img src="${item.imagen_url || 'https://via.placeholder.com/400'}" 
                         class="w-full h-full object-cover transition-transform hover:scale-110" 
                         alt="${nombre}"
                         onerror="this.src='https://via.placeholder.com/400'">
                </a>
                <div class="flex-1 text-center md:text-left">
                    <a href="catalogo.html#producto-${id_producto}" class="hover:text-primary transition-colors inline-block">
                        <h5 class="font-bold text-lg dark:text-white">${nombre}</h5>
                    </a>
                    <p class="text-slate-500 text-sm">Precio: ${formatCurrency(precio)}</p>
                    <p class="font-bold text-primary mt-1">Subtotal: ${formatCurrency(subtotal)}</p>
                </div>
                <div class="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-full">
                    <button class="qty-btn text-primary hover:bg-primary/10 size-8 rounded-full flex items-center justify-center transition-colors" 
                            onclick="updateQty('${id_producto}', -1)" title="Disminuir">
                        <span class="material-symbols-outlined text-lg">remove</span>
                    </button>
                    <span class="font-black w-6 text-center dark:text-white">${cantidad}</span>
                    <button class="qty-btn text-primary hover:bg-primary/10 size-8 rounded-full flex items-center justify-center transition-colors" 
                            onclick="updateQty('${id_producto}', 1)" title="Aumentar">
                        <span class="material-symbols-outlined text-lg">add</span>
                    </button>
                </div>
                <button class="text-slate-300 hover:text-red-500 transition-colors p-2" 
                        onclick="removeFromCart('${id_producto}')" title="Eliminar del carrito">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            </div>
        `;
    }).join('');

    cartTotalElement.innerText = formatCurrency(total);
}

window.updateQty = (id, change) => {
    try {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const item = cart.find(i => i.id_producto == id);
        if (item) {
            item.cantidad = (parseInt(item.cantidad) || 0) + change;
            if (item.cantidad <= 0) {
                cart = cart.filter(i => i.id_producto != id);
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();
            if (window.updateCartCounter) window.updateCartCounter();
        }
    } catch (e) {
        console.error('Error updating quantity:', e);
    }
};

window.removeFromCart = (id) => {
    try {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart = cart.filter(product => product.id_producto != id);
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        if (window.updateCartCounter) window.updateCartCounter();
    } catch (e) {
        console.error('Error removing item:', e);
    }
};

async function processCheckout() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        window.showModal({
            title: 'Inicio de Sesión Requerido',
            message: 'Por favor, inicia sesión para finalizar tu compra.',
            type: 'info',
            onConfirm: () => window.location.href = 'login.html'
        });
        return;
    }

    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        window.showModal({
            title: 'Carrito Vacío',
            message: 'Tu carrito no tiene productos aún.',
            type: 'info'
        });
        return;
    }

    const paymentMethod = document.getElementById('payment-method')?.value;
    if (!paymentMethod) {
        window.showModal({
            title: 'Método de Pago',
            message: 'Por favor, selecciona un método de pago para continuar.',
            type: 'info'
        });
        return;
    }

    // Mandatory Address Validation for ALL payment methods
    if (!user.direccion || user.direccion.trim() === '') {
        window.showModal({
            title: 'Dirección Requerida',
            message: 'Para completar cualquier compra en Velocity, es necesario que registres tu dirección en tu perfil.',
            type: 'error',
            confirmText: 'Ir a mi perfil',
            onConfirm: () => window.location.href = 'perfil.html'
        });
        return;
    }

    const checkoutBtn = document.querySelector('button.bg-primary');
    if (checkoutBtn) {
        checkoutBtn.disabled = true;
        checkoutBtn.innerText = 'Verificando stock...';
    }

    try {
        // 0. Stock Validation
        const products = await window.velocityApi.getProducts();
        const insufficientStockItems = [];

        for (const item of cart) {
            const dbProduct = products.find(p => p.id_producto === item.id_producto);
            if (!dbProduct || dbProduct.stock < item.cantidad) {
                insufficientStockItems.push({
                    nombre: item.nombre,
                    disponible: dbProduct ? dbProduct.stock : 0
                });
            }
        }

        if (insufficientStockItems.length > 0) {
            const itemNames = insufficientStockItems.map(i => `- ${i.nombre} (Disponible: ${i.disponible})`).join('\n');
            window.showModal({
                title: 'Stock Insuficiente',
                message: `No hay suficiente stock para los siguientes productos:\n${itemNames}`,
                type: 'error'
            });
            if (checkoutBtn) {
                checkoutBtn.disabled = false;
                checkoutBtn.innerText = 'Finalizar Compra';
            }
            return;
        }

        if (checkoutBtn) checkoutBtn.innerText = 'Procesando...';

        const total = cart.reduce((acc, item) => {
            const precio = parseFloat(item.precio) || 0;
            const cantidad = parseInt(item.cantidad) || 0;
            return acc + (precio * cantidad);
        }, 0);

        // 1. Insert into 'venta'
        const saleResult = await window.velocityApi.insertSale({
            id_cliente: user.id_cliente || user.id,
            total: total,
            estado: 'PAGADA',
            metodo_pago: paymentMethod
        });

        if (!saleResult.success) {
            throw new Error(saleResult.error || 'Error al crear la venta');
        }

        const saleId = saleResult.data[0].id_venta;

        // 2. Insert into 'detalle_venta'
        const details = cart.map(item => ({
            id_venta: saleId,
            id_producto: item.id_producto,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
            subtotal: (item.cantidad * item.precio)
        }));

        const detailResult = await window.velocityApi.insertSaleDetail(details);

        if (!detailResult.success) {
            throw new Error(detailResult.error || 'Error al registrar los detalles de la venta');
        }

        // 3. Update Stock for each product
        for (const item of cart) {
            const dbProduct = products.find(p => p.id_producto === item.id_producto);
            if (dbProduct) {
                const newStock = dbProduct.stock - item.cantidad;
                await window.velocityApi.updateProductStock(item.id_producto, newStock);
            }
        }

        // 4. Success!
        window.showModal({
            title: '¡Compra Exitosa!',
            message: 'Tu pedido ha sido registrado exitosamente. Serás redirigido al catálogo.',
            type: 'success',
            onConfirm: () => {
                localStorage.removeItem('cart');
                window.location.href = 'catalogo.html';
            }
        });

    } catch (error) {
        console.error('Checkout error:', error);
        window.showModal({
            title: 'Error en la Compra',
            message: 'Hubo un problema al procesar tu compra: ' + error.message,
            type: 'error'
        });

        if (checkoutBtn) {
            checkoutBtn.disabled = false;
            checkoutBtn.innerText = 'Finalizar Compra';
        }
    }
}
