const SUPABASE_URL = "https://phifvjqcexcszbcshqyo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoaWZ2anFjZXhjc3piY3NocXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDM1NTYsImV4cCI6MjA4Nzc3OTU1Nn0.EKTk8qxiC7ZlnLIT4rRH4x9nqN9OnMcsV5AwZr3RGps";

// Expose API globally to work without modules in local files
window.velocityApi = {
    /**
     * Helper for fetch calls to Supabase
     */
    async _request(path, options = {}) {
        const url = `${SUPABASE_URL}/rest/v1/${path}`;
        const defaultHeaders = {
            "apikey": SUPABASE_KEY,
            "Authorization": `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json"
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers: { ...defaultHeaders, ...options.headers }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            // For HEAD requests or return=minimal, there might be no body
            if (options.method === 'DELETE' || (options.headers && options.headers['Prefer'] === 'return=minimal')) {
                return { success: true };
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error(`API Error (${path}):`, error);
            return { success: false, error: error.message };
        }
    },

    async getProducts() {
        // Fetch products with their related category name using Supabase join
        const result = await this._request('producto?select=*,tipo_producto(nombre)');
        return result.success ? result.data : [];
    },

    async getProductTypes() {
        const result = await this._request('tipo_producto?select=*');
        return result.success ? result.data : [];
    },

    async registerClient(clientData) {
        const result = await this._request('cliente', {
            method: "POST",
            headers: { "Prefer": "return=minimal" },
            body: JSON.stringify({
                ...clientData,
                fecha_registro: new Date().toISOString(),
                estado: true
            })
        });
        return result.success;
    },

    async updateClient(email, updatedData) {
        return await this._request(`cliente?email=eq.${encodeURIComponent(email)}`, {
            method: "PATCH",
            headers: { "Prefer": "return=minimal" },
            body: JSON.stringify(updatedData)
        });
    },

    async getClientByEmail(email) {
        const result = await this._request(`cliente?email=eq.${encodeURIComponent(email)}&select=*`);
        if (result.success && result.data && result.data.length > 0) {
            return result.data[0];
        }
        return null;
    },

    async insertSale(saleData) {
        return await this._request('venta', {
            method: "POST",
            headers: { "Prefer": "return=representation" }, // We want the ID back
            body: JSON.stringify({
                ...saleData,
                fecha: new Date().toISOString()
            })
        });
    },

    async insertSaleDetail(details) {
        // details can be an array for bulk insert in Supabase REST API
        return await this._request('detalle_venta', {
            method: "POST",
            headers: { "Prefer": "return=minimal" },
            body: JSON.stringify(details)
        });
    },

    async updateProductStock(id_producto, newStock) {
        return await this._request(`producto?id_producto=eq.${id_producto}`, {
            method: "PATCH",
            headers: { "Prefer": "return=minimal" },
            body: JSON.stringify({ stock: newStock })
        });
    }
};
