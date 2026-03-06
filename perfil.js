document.addEventListener('DOMContentLoaded', async () => {
    const api = window.velocityApi;
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    const card = document.getElementById('profile-card');
    if (card) card.classList.remove('hidden');

    const form = document.getElementById('perfil-form');
    const message = document.getElementById('perfil-message');
    const logoutBtn = document.getElementById('logout-btn');

    // Utility to show messages - using global notification system
    function showMessage(msg, colorClass) {
        if (msg.includes('correctamente')) {
            if (window.showToast) window.showToast(msg, 'success');
        } else if (colorClass.includes('red')) {
            if (window.showToast) window.showToast(msg, 'error');
        } else if (window.showToast) {
            window.showToast(msg, 'info');
        }
    }

    // Load user data into fields
    const fields = {
        nombres: document.getElementById('perfil-nombres'),
        apellidos: document.getElementById('perfil-apellidos'),
        email: document.getElementById('perfil-email'),
        documento: document.getElementById('perfil-documento'),
        telefono: document.getElementById('perfil-telefono'),
        direccion: document.getElementById('perfil-direccion')
    };

    if (fields.nombres) fields.nombres.value = user.nombres || '';
    if (fields.apellidos) fields.apellidos.value = user.apellidos || '';
    if (fields.email) fields.email.value = user.email || '';
    if (fields.documento) fields.documento.value = user.documento || '';
    if (fields.telefono) fields.telefono.value = user.telefono || '';
    if (fields.direccion) fields.direccion.value = user.direccion || '';

    // Handle form submission
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const updatedData = {
                nombres: fields.nombres.value.trim(),
                apellidos: fields.apellidos.value.trim(),
                documento: fields.documento.value.trim(),
                telefono: fields.telefono.value.trim(),
                direccion: fields.direccion.value.trim()
            };

            // Validation
            if (!updatedData.nombres || !updatedData.apellidos || !updatedData.documento) {
                showMessage('Campos obligatorios vacíos.', 'text-red-500');
                return;
            }

            showMessage('Guardando cambios...', 'text-primary');

            const result = await api.updateClient(user.email, updatedData);

            if (result.success) {
                const newUser = { ...user, ...updatedData };
                localStorage.setItem('user', JSON.stringify(newUser));
                showMessage('Perfil actualizado correctamente.', 'text-green-500');
            } else {
                showMessage(`No se pudo actualizar: ${result.error}`, 'text-red-500');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            showMessage('Error al guardar los cambios.', 'text-red-500');
        }
    });

    // Handle logout
    logoutBtn?.addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    });
});
