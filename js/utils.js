
const MOBILE_BREAKPOINT = 768;

function isMobile() {
    return window.innerWidth < MOBILE_BREAKPOINT;
}

function getCurrentUserRole() {
    return localStorage.getItem('userRole');
}

function roleGuard(expectedRoles) {
    const currentRole = getCurrentUserRole();
    // console.log('[roleGuard] Current role from localStorage:', currentRole);
    // console.log('[roleGuard] Expected roles:', expectedRoles);
    // console.log('[roleGuard] window.USER_ROLES_OBJ available:', window.USER_ROLES_OBJ);


    if (!currentRole) {
        // console.log('[roleGuard] No role found, redirecting to login.');
        window.location.href = '../index.html'; 
        return false;
    }

    if (!window.USER_ROLES_OBJ) {
        // console.error('[roleGuard] CRITICAL ERROR: window.USER_ROLES_OBJ is not defined. Cannot perform role check.');
        alert('Critical system error: Role definitions missing. Please contact support.');
        window.location.href = '../index.html'; 
        return false;
    }

    const rolesToCheck = Array.isArray(expectedRoles) ? expectedRoles : [expectedRoles];
    if (!rolesToCheck.includes(currentRole)) {
        // console.log(`[roleGuard] Access Denied. Role "${currentRole}" not in expected roles. Redirecting.`);
        alert('Access Denied. You do not have permission to view this page.');
        
        const roleDashboardMap = {
            [window.USER_ROLES_OBJ.ADMIN]: '../dashboard/admin.html',
            [window.USER_ROLES_OBJ.FACULTY]: '../dashboard/faculty.html',
            [window.USER_ROLES_OBJ.STUDENT]: '../dashboard/student.html',
            [window.USER_ROLES_OBJ.ASSISTANT]: '../dashboard/assistant.html',
        };
        window.location.href = roleDashboardMap[currentRole] || '../index.html';
        return false;
    }
    // console.log('[roleGuard] Access GRANTED for role:', currentRole);
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
