
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
        window.location.href = '/index.html'; // Or your login page
        return false;
    }
    const rolesToCheck = Array.isArray(expectedRoles) ? expectedRoles : [expectedRoles];
    if (!rolesToCheck.includes(currentRole)) {
        alert('Access Denied. You do not have permission to view this page.');
        // Redirect to a general page or login
        const roleDashboardMap = {
            [USER_ROLES.ADMIN]: '/dashboard/admin.html',
            [USER_ROLES.FACULTY]: '/dashboard/faculty.html',
            [USER_ROLES.STUDENT]: '/dashboard/student.html',
            [USER_ROLES.CR]: '/dashboard/cr.html',
        };
        window.location.href = roleDashboardMap[currentRole] || '/index.html';
        return false;
    }
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
