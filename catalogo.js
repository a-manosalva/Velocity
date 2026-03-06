let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    const api = window.velocityApi;
    const productsContainer = document.getElementById('products-grid');

    if (!productsContainer) return;

    try {
        if (!api) {
            throw new Error('API central (velocityApi) no encontrada.');
        }

        // Loading state
        productsContainer.innerHTML = `
            <div class="col-span-full py-20 text-center">
                <div class="animate-spin size-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p class="text-slate-400 font-medium italic">Sincronizando catálogo de élite...</p>
            </div>
        `;

        const products = await api.getProducts();

        if (products && Array.isArray(products)) {
            allProducts = products;

            // Update product count in header
            const countElement = document.getElementById('product-count');
            if (countElement) countElement.innerText = allProducts.length;

            await loadCategories();
            renderProducts(allProducts);
            setupFilters();
        } else {
            throw new Error('Formato de productos no válido recibido de la API.');
        }

    } catch (error) {
        console.error('Error catalogo:', error);
        productsContainer.innerHTML = `
            <div class="col-span-full py-24 text-center">
                <span class="material-symbols-outlined text-red-500 text-6xl mb-4 text-opacity-30">cloud_off</span>
                <h4 class="text-xl font-bold dark:text-white uppercase mb-2">Error de Sincronización</h4>
                <p class="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">${error.message}</p>
                <button onclick="window.location.reload()" class="bg-primary text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 transition-all">
                    Reintentar
                </button>
            </div>
        `;
    }
});

function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');

    if (!searchInput || !categoryFilter || !sortFilter) return;

    const handleFilter = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const sortBy = sortFilter.value;

        let filtered = allProducts.filter(p => {
            const nombre = (p.nombre || p.name || '').toLowerCase();
            const desc = (p.descripcion || p.description || '').toLowerCase();
            const matchesSearch = nombre.includes(searchTerm) || desc.includes(searchTerm);
            const prodCat = (p.tipo_producto && p.tipo_producto.nombre) || '';
            const matchesCategory = category === 'all' || prodCat === category;
            return matchesSearch && matchesCategory;
        });

        if (sortBy === 'price-low') filtered.sort((a, b) => (a.precio || 0) - (b.precio || 0));
        else if (sortBy === 'price-high') filtered.sort((a, b) => (b.precio || 0) - (a.precio || 0));
        else if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.fecha_creacion || 0) - new Date(a.fecha_creacion || 0));
        else if (sortBy === 'name-asc') filtered.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        else if (sortBy === 'name-desc') filtered.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));

        renderProducts(filtered);
    };

    searchInput.addEventListener('input', handleFilter);
    categoryFilter.addEventListener('change', handleFilter);
    sortFilter.addEventListener('change', handleFilter);
}

async function loadCategories() {
    const api = window.velocityApi;
    const categoryFilter = document.getElementById('category-filter');
    if (!api || !categoryFilter) return;

    try {
        const types = await api.getProductTypes();
        if (types && Array.isArray(types)) {
            // Keep the "All" option and add dynamic ones
            categoryFilter.innerHTML = '<option value="all">Todas las Categorías</option>' +
                types.map(t => `<option value="${t.nombre}">${t.nombre}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function renderProducts(products) {
    const productsContainer = document.getElementById('products-grid');
    if (!productsContainer) return;

    if (products.length === 0) {
        productsContainer.innerHTML = `
            <div class="col-span-full py-32 text-center text-slate-400">
                <span class="material-symbols-outlined text-5xl mb-4">search_off</span>
                <p class="text-lg font-medium">No hay productos que coincidan.</p>
                <p class="text-sm">Prueba ajustando los filtros de búsqueda.</p>
            </div>
        `;
        return;
    }

    productsContainer.innerHTML = products.map(product => {
        const id_producto = product.id_producto;
        const nombre = product.nombre || 'Producto';
        const descripcion = product.descripcion || 'Equipamiento de alto rendimiento.';
        const precio = product.precio || 0;
        const imagen_url = product.imagen_url || 'https://via.placeholder.com/400x500?text=Velocity';

        const displayCat = (product.tipo_producto && product.tipo_producto.nombre) || '';

        return `
            <div id="producto-${id_producto}" class="group bg-white dark:bg-white/5 rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 hover:border-primary transition-all duration-300 product-card flex flex-col" data-id="${id_producto}">
                <div class="aspect-[4/5] bg-slate-50 dark:bg-slate-900 overflow-hidden relative">
                    <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                         src="${imagen_url}" 
                         alt="${nombre}"
                         loading="lazy"
                         onerror="this.src='https://via.placeholder.com/400x500?text=Velocity'">
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6">
                        <button class="add-to-cart-btn w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                            Añadir al Carrito
                        </button>
                    </div>
                    <div class="absolute top-4 right-4 flex flex-col gap-2 items-end">
                        ${displayCat ? `<span class="bg-black/60 backdrop-blur-md text-white text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-tighter">${displayCat}</span>` : ''}
                        <span class="opacity-0 group-hover:opacity-100 transition-opacity bg-primary/90 backdrop-blur-md text-white text-[10px] uppercase font-black px-3 py-1 rounded-full tracking-tighter">Stock: ${product.stock || 0}</span>
                    </div>
                </div>
                <div class="p-6 flex flex-col flex-grow">
                    <h5 class="font-black dark:text-white uppercase tracking-tight text-lg mb-2">${nombre}</h5>
                    <p class="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed mb-4">${descripcion}</p>
                    <div class="mt-auto flex items-center justify-between">
                        <span class="font-black text-2xl text-primary font-display">$${precio.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</span>
                        <span class="text-[10px] text-slate-400 uppercase font-bold tracking-widest italic">Elite</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Global event listener for Add to Cart
document.getElementById('products-grid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (btn) {
        const card = btn.closest('.product-card');
        const id = card.dataset.id;
        const product = allProducts.find(p => (p.id_producto || '').toString() === id.toString());
        if (product && window.addToCart) {
            window.addToCart(product);
        }
    }
});
