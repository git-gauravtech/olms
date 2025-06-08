
function initializeProfileManagementPage() {
    const changePasswordForm = document.getElementById('changePasswordForm');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const formMessage = document.getElementById('changePasswordFormMessage');
    const changePasswordBtn = document.getElementById('changePasswordBtn');

    if (!changePasswordForm || !currentPasswordInput || !newPasswordInput || !confirmNewPasswordInput || !formMessage || !changePasswordBtn) {
        console.error('One or more elements for profile management are missing from the DOM.');
        if (formMessage) showFormMessage(formMessage, 'Page could not be initialized correctly.', 'error');
        return;
    }

    changePasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        hideMessage(formMessage);

        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;

        if (newPassword.length < 6) {
            showFormMessage(formMessage, 'New password must be at least 6 characters long.', 'error');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            showFormMessage(formMessage, 'New passwords do not match.', 'error');
            return;
        }

        changePasswordBtn.disabled = true;
        changePasswordBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin mr-2"></i> Changing...';
        if (window.lucide) window.lucide.createIcons();

        const TOKEN = localStorage.getItem(window.TOKEN_KEY);
        if (!TOKEN) {
            showFormMessage(formMessage, 'Authentication error. Please log in again.', 'error');
            changePasswordBtn.disabled = false;
            changePasswordBtn.innerHTML = '<i data-lucide="save" class="mr-2"></i> Change Password';
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        try {
            const response = await fetch(`${window.API_BASE_URL}/users/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const result = await response.json();

            if (response.ok) {
                showFormMessage(formMessage, 'Password changed successfully!', 'success');
                changePasswordForm.reset();
                // Optionally, redirect or inform user to log in again if token invalidation is strict
            } else {
                showFormMessage(formMessage, result.message || 'Failed to change password.', 'error');
            }
        } catch (error) {
            console.error('Change password error:', error);
            showFormMessage(formMessage, 'An unexpected error occurred. Please try again.', 'error');
        } finally {
            changePasswordBtn.disabled = false;
            changePasswordBtn.innerHTML = '<i data-lucide="save" class="mr-2"></i> Change Password';
            if (window.lucide) window.lucide.createIcons();
        }
    });
}
