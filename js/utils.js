
const MOBILE_BREAKPOINT = 768;

function isMobile() {
    return window.innerWidth < MOBILE_BREAKPOINT;
}

function getCurrentUserRole() {
    return localStorage.getItem('userRole');
}

function roleGuard(expectedRoles) {
    const currentRole = getCurrentUserRole();
    if (!currentRole) {
        window.location.href = '../index.html'; // Redirect to login if no role (adjust path if needed)
        return false;
    }
    if (!window.USER_ROLES) { 
        console.error('[roleGuard] CRITICAL ERROR: window.USER_ROLES is not defined.');
        alert('Critical system error: Role definitions missing.');
        window.location.href = '../index.html'; 
        return false;
    }
    const rolesToCheck = Array.isArray(expectedRoles) ? expectedRoles : [expectedRoles];
    if (!rolesToCheck.includes(currentRole)) {
        alert('Access Denied. You do not have permission to view this page.');
        const roleDashboardMap = {
            [window.USER_ROLES.ADMIN]: '../dashboard/admin.html',
            [window.USER_ROLES.FACULTY]: '../dashboard/faculty.html',
            [window.USER_ROLES.STUDENT]: '../dashboard/student.html',
            [window.USER_ROLES.ASSISTANT]: '../dashboard/assistant.html',
        };
        window.location.href = roleDashboardMap[currentRole] || '../index.html';
        return false;
    }
    return true;
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function togglePasswordVisibility(fieldId, buttonElement) {
    const passwordInput = document.getElementById(fieldId);
    if (!passwordInput || !buttonElement) return;
    const currentType = passwordInput.getAttribute('type');
    let newIconName;
    if (currentType === 'password') {
        passwordInput.setAttribute('type', 'text');
        newIconName = 'eye-off';
    } else {
        passwordInput.setAttribute('type', 'password');
        newIconName = 'eye';
    }
    buttonElement.innerHTML = `<i data-lucide="${newIconName}"></i>`;
    if (window.lucide) window.lucide.createIcons();
}


// Expose utility functions to global scope
if (typeof window !== 'undefined') {
    window.isMobile = isMobile;
    window.getCurrentUserRole = getCurrentUserRole;
    window.roleGuard = roleGuard;
    window.getQueryParam = getQueryParam;
    window.togglePasswordVisibility = togglePasswordVisibility;
}
