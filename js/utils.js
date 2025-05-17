
const MOBILE_BREAKPOINT = 768;

function isMobile() {
    return window.innerWidth < MOBILE_BREAKPOINT;
}

function getCurrentUserRole() {
    return localStorage.getItem('userRole');
}

function roleGuard(expectedRoles) {
    const currentRole = getCurrentUserRole();
    console.log('[roleGuard] Current role from localStorage:', currentRole);
    console.log('[roleGuard] Expected roles:', expectedRoles);
    console.log('[roleGuard] window.USER_ROLES available:', window.USER_ROLES);


    if (!currentRole) {
        console.log('[roleGuard] No role found, redirecting to login.');
        window.location.href = '../index.html'; // Adjusted path for dashboard pages
        return false;
    }

    if (!window.USER_ROLES) {
        console.error('[roleGuard] CRITICAL ERROR: window.USER_ROLES is not defined. Cannot perform role check.');
        alert('Critical system error: Role definitions missing. Please contact support.');
        window.location.href = '../index.html'; // Redirect to login
        return false;
    }

    const rolesToCheck = Array.isArray(expectedRoles) ? expectedRoles : [expectedRoles];
    if (!rolesToCheck.includes(currentRole)) {
        console.log(`[roleGuard] Access Denied. Role "${currentRole}" not in expected roles. Redirecting.`);
        alert('Access Denied. You do not have permission to view this page.');
        
        const roleDashboardMap = {
            [window.USER_ROLES.ADMIN]: '../dashboard/admin.html',
            [window.USER_ROLES.FACULTY]: '../dashboard/faculty.html',
            [window.USER_ROLES.STUDENT]: '../dashboard/student.html',
            [window.USER_ROLES.ASSISTANT]: '../dashboard/assistant.html',
        };
        // Make sure to use window.USER_ROLES here if it's the source of truth.
        // The keys in roleDashboardMap should match the values in window.USER_ROLES.
        window.location.href = roleDashboardMap[currentRole] || '../index.html';
        return false;
    }
    console.log('[roleGuard] Access GRANTED for role:', currentRole);
    return true;
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}


// Expose utility functions to global scope if not using modules
window.isMobile = isMobile;
window.getCurrentUserRole = getCurrentUserRole;
window.roleGuard = roleGuard;
window.getQueryParam = getQueryParam;
