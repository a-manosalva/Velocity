document.addEventListener('DOMContentLoaded', async () => {
    const api = window.velocityApi;

    // Initial calls for header status - MUST RUN ON ALL PAGES
    updateCartCounter();
    updateUserLink();

    try {
        const productsContainer = document.getElementById('products-grid');
        // Prevent double rendering on Catalog page where catalogo.js takes over
        const isCatalogPage = window.location.pathname.includes('catalogo.html');

        if (!productsContainer || isCatalogPage) return;

        if (!api) {
            throw new Error('API central no encontrada');
        }

        const products = await api.getProducts();

        if (products.length === 0) {
            productsContainer.innerHTML = '<div class="col-span-full py-20 text-center text-slate-500">No se encontraron productos disponibles.</div>';
            return;
        }

        renderProducts(products, api);
    } catch (error) {
        console.error('Error inicializando la app:', error);
        const container = document.getElementById('products-grid');
        if (container) {
            container.innerHTML = '<div class="col-span-full py-20 text-center text-red-500">Error al cargar productos. Por favor intenta de nuevo más tarde.</div>';
        }
    }
});

function renderProducts(products, api) {
    const productsContainer = document.getElementById('products-grid');
    if (!productsContainer) return;

    productsContainer.innerHTML = products.map(product => {
        const id = product.id_producto || product.id;
        const nombre = product.nombre || 'Producto';
        const precio = product.precio || 0;
        const descripcion = product.descripcion || 'Sin descripción.';
        const imagen_url = product.imagen_url || 'https://via.placeholder.com/400';

        return `
            <div id="producto-${id}" class="group product-card" data-id="${id}">
                <div class="aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden mb-4 relative">
                    <img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                         src="${imagen_url}" 
                         alt="${nombre}"
                         loading="lazy">
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6">
                        <button class="add-to-cart-btn w-full bg-white text-black py-2 rounded-lg font-bold text-sm shadow-lg hover:bg-primary hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300">
                            Añadir al Carrito
                        </button>
                    </div>
                </div>
                <h5 class="font-bold dark:text-white">${nombre}</h5>
                <p class="text-slate-500 text-sm line-clamp-2">${descripcion}</p>
                <p class="font-bold text-primary mt-1 text-lg">$${precio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
            </div>
        `;
    }).join('');

    productsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.add-to-cart-btn');
        if (btn) {
            const card = btn.closest('.product-card');
            const id = card.dataset.id;
            const product = products.find(p => (p.id_producto || p.id).toString() === id.toString());
            if (product) addToCart(product);
        }
    });
}

function addToCart(product) {
    try {
        let cart = [];
        try {
            const storedCart = localStorage.getItem('cart');
            cart = JSON.parse(storedCart);
            if (!Array.isArray(cart)) cart = [];
        } catch (e) {
            cart = [];
        }
        const id_producto = product.id_producto || product.id;
        const nombre = product.nombre || product.name || 'Producto';
        const precio = product.precio || product.price || 0;

        const existingItem = cart.find(i => (i.id_producto || i.id) === id_producto);

        if (existingItem) {
            existingItem.cantidad++;
        } else {
            cart.push({
                id_producto: id_producto,
                nombre: nombre,
                precio: precio,
                imagen_url: product.imagen_url || product.image_url,
                cantidad: 1
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCounter();
        if (window.showToast) {
            window.showToast(`¡${nombre} añadido al carrito!`, 'success');
        }
    } catch (error) {
        console.error('Error al añadir al carrito:', error);
        if (window.showToast) window.showToast('Error al añadir al carrito', 'error');
    }
}

function updateCartCounter() {
    let cart = [];
    try {
        const storedCart = localStorage.getItem('cart');
        cart = JSON.parse(storedCart);
        if (!Array.isArray(cart)) cart = [];
    } catch (e) {
        cart = [];
    }
    const count = cart.reduce((acc, item) => acc + (parseInt(item.cantidad || item.quantity) || 0), 0);
    const counterElement = document.getElementById('cart-count');
    if (counterElement) counterElement.innerText = count;
}

function updateUserLink() {
    const user = JSON.parse(localStorage.getItem('user'));
    const userLink = document.getElementById('user-link');
    const userLabel = document.getElementById('user-name-label');

    if (user && userLink) {
        userLink.href = 'perfil.html';
        if (userLabel) {
            const name = user.nombres || 'Mi Perfil';
            userLabel.innerText = name;
        }
    } else if (userLabel) {
        userLabel.innerText = 'Iniciar sesión';
    }
}

window.addToCart = addToCart;
window.updateCartCounter = updateCartCounter;
window.updateUserLink = updateUserLink;

/**
 * Velocity Notification System
 */
window.showToast = function (message, type = 'success') {
    const toast = document.getElementById('velocity-toast');
    if (!toast) return;

    const colors = {
        success: 'bg-primary',
        error: 'bg-red-500',
        info: 'bg-slate-700'
    };

    toast.className = `fixed bottom-6 right-6 z-[100] px-6 py-3 rounded-xl text-white font-bold shadow-2xl transform transition-all duration-300 translate-y-20 opacity-0 ${colors[type] || colors.info}`;
    toast.innerText = message;

    // Show
    setTimeout(() => {
        toast.classList.remove('translate-y-20', 'opacity-0');
    }, 100);

    // Hide
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
};

window.showModal = function ({ title, message, type = 'info', confirmText = 'Aceptar', onConfirm }) {
    const modalOverlay = document.getElementById('velocity-modal-overlay');
    const modalTitle = document.getElementById('velocity-modal-title');
    const modalMessage = document.getElementById('velocity-modal-message');
    const modalBtn = document.getElementById('velocity-modal-btn');

    if (!modalOverlay || !modalTitle || !modalMessage || !modalBtn) return;

    modalTitle.innerText = title;
    modalMessage.innerText = message;
    modalBtn.innerText = confirmText;

    const typeColors = {
        success: 'bg-primary hover:bg-primary/90',
        error: 'bg-red-500 hover:bg-red-600',
        info: 'bg-slate-700 hover:bg-slate-800'
    };

    modalBtn.className = `w-full py-4 rounded-xl text-white font-bold uppercase tracking-widest transition-all ${typeColors[type] || typeColors.info}`;

    modalOverlay.classList.remove('hidden');
    setTimeout(() => {
        modalOverlay.classList.add('opacity-100');
        modalOverlay.firstElementChild.classList.add('scale-100', 'opacity-100');
    }, 10);

    window.closeVelocityModal = () => {
        modalOverlay.classList.remove('opacity-100');
        modalOverlay.firstElementChild.classList.remove('scale-100', 'opacity-100');
        setTimeout(() => {
            modalOverlay.classList.add('hidden');
            if (onConfirm) onConfirm();
        }, 300);
    };

    modalBtn.onclick = window.closeVelocityModal;
};

// Inject Notification UI
function injectNotificationUI() {
    if (document.getElementById('velocity-toast')) return;

    const container = document.createElement('div');
    container.innerHTML = `
        <div id="velocity-toast" class="hidden"></div>
        <div id="velocity-modal-overlay" class="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 hidden opacity-0 transition-opacity duration-300">
            <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-8 transform scale-90 opacity-0 transition-all duration-300">
                <h4 id="velocity-modal-title" class="text-2xl font-black uppercase tracking-tighter mb-4 dark:text-white"></h4>
                <p id="velocity-modal-message" class="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed"></p>
                <button id="velocity-modal-btn" class="w-full"></button>
            </div>
        </div>
    `;
    document.body.appendChild(container);
}

// Ensure UI is injected
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNotificationUI);
} else {
    injectNotificationUI();
}
