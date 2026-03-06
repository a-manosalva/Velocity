document.addEventListener('DOMContentLoaded', () => {
    console.log('Auth script loaded');

    const api = window.velocityApi;
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authMessage = document.getElementById('auth-message');

    // Utility to show messages - using global notification system for relevant actions
    function showMessage(msg, colorClass) {
        if (msg.includes('éxito') || msg.includes('Bienvenido')) {
            if (window.showToast) window.showToast(msg, 'success');
        } else if (colorClass.includes('red')) {
            if (window.showToast) window.showToast(msg, 'error');
        } else {
            if (authMessage) {
                authMessage.innerText = msg;
                authMessage.className = `mt-6 text-center text-sm font-semibold ${colorClass}`;
                authMessage.classList.remove('hidden');
            }
        }
    }

    // Tab switching
    loginTab?.addEventListener('click', () => {
        loginTab.classList.add('border-primary', 'text-primary');
        loginTab.classList.remove('border-transparent', 'text-slate-400');
        registerTab.classList.remove('border-primary', 'text-primary');
        registerTab.classList.add('border-transparent', 'text-slate-400');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        authMessage?.classList.add('hidden');
    });

    registerTab?.addEventListener('click', () => {
        registerTab.classList.add('border-primary', 'text-primary');
        registerTab.classList.remove('border-transparent', 'text-slate-400');
        loginTab.classList.remove('border-primary', 'text-primary');
        loginTab.classList.add('border-transparent', 'text-slate-400');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        authMessage?.classList.add('hidden');
    });

    // Form Validation
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Handle Login
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const email = document.getElementById('login-email').value.trim();
            const documento = document.getElementById('login-documento').value.trim();

            if (!email || !documento) {
                showMessage('Por favor, completa todos los campos.', 'text-red-500');
                return;
            }

            if (!validateEmail(email)) {
                showMessage('Por favor, ingresa un correo válido.', 'text-red-500');
                return;
            }

            showMessage('Verificando...', 'text-primary');

            const client = await api.getClientByEmail(email);

            if (client) {
                if (client.documento === documento) {
                    localStorage.setItem('user', JSON.stringify(client));
                    if (window.updateUserLink) window.updateUserLink(); // Immediate update

                    window.showModal({
                        title: '¡Bienvenido!',
                        message: `Hola de nuevo, ${client.nombres}. Te redirigimos a la tienda.`,
                        type: 'success',
                        onConfirm: () => window.location.href = 'index.html'
                    });
                } else {
                    showMessage('El número de documento no coincide con el correo.', 'text-red-500');
                }
            } else {
                showMessage('Usuario no encontrado. Por favor, regístrate.', 'text-red-500');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Ocurrió un error inesperado. Inténtalo más tarde.', 'text-red-500');
        }
    });

    // Handle Registration
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const names = document.getElementById('reg-names').value.trim();
            const apellidos = document.getElementById('reg-apellidos').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const documento = document.getElementById('reg-documento').value.trim();

            if (!names || !apellidos || !email || !documento) {
                showMessage('Todos los campos son obligatorios.', 'text-red-500');
                return;
            }

            if (!validateEmail(email)) {
                showMessage('El correo electrónico no es válido.', 'text-red-500');
                return;
            }

            if (documento.length < 5) {
                showMessage('El documento debe tener al menos 5 caracteres.', 'text-red-500');
                return;
            }

            showMessage('Procesando...', 'text-primary');

            // Check if user already exists
            const existing = await api.getClientByEmail(email);
            if (existing) {
                showMessage('Este correo ya está registrado.', 'text-red-500');
                return;
            }

            const success = await api.registerClient({
                nombres: names,
                apellidos: apellidos,
                email: email,
                documento: documento
            });

            if (success) {
                const newClient = await api.getClientByEmail(email);
                localStorage.setItem('user', JSON.stringify(newClient));
                if (window.updateUserLink) window.updateUserLink(); // Immediate update

                window.showModal({
                    title: '¡Cuenta Creada!',
                    message: `Bienvenido a Velocity, ${nombres}. Tu registro ha sido exitoso.`,
                    type: 'success',
                    onConfirm: () => window.location.href = 'index.html'
                });
            } else {
                showMessage('No se pudo completar el registro. Intenta de nuevo.', 'text-red-500');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('Error en el registro. Por favor, intenta de nuevo.', 'text-red-500');
        }
    });
});
