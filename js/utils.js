

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
    // console.log('[roleGuard] window.USER_ROLES available:', window.USER_ROLES);


    if (!currentRole) {
        // console.log('[roleGuard] No role found, redirecting to login.');
        window.location.href = '../index.html'; 
        return false;
    }

    if (!window.USER_ROLES) { 
        console.error('[roleGuard] CRITICAL ERROR: window.USER_ROLES is not defined. Cannot perform role check. Ensure constants.js is loaded first.');
        alert('Critical system error: Role definitions missing. Please contact support.');
        window.location.href = '../index.html'; 
        return false;
    }

    const rolesToCheck = Array.isArray(expectedRoles) ? expectedRoles : [expectedRoles];
    if (!rolesToCheck.includes(currentRole)) {
        // console.log(`[roleGuard] Access Denied. Role "${currentRole}" not in expected roles. Redirecting.`);
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
    // console.log('[roleGuard] Access GRANTED for role:', currentRole);
    return true;
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Moved from auth.js to be a general utility
function togglePasswordVisibility(fieldId, buttonElement) {
    const passwordInput = document.getElementById(fieldId);
    if (!passwordInput || !buttonElement) {
        // console.error('Password input field or toggle button not found:', fieldId);
        return;
    }
    const currentType = passwordInput.getAttribute('type');
    let newIconName;
    if (currentType === 'password') {
        passwordInput.setAttribute('type', 'text');
        newIconName = 'eye-off';
    } else {
        passwordInput.setAttribute('type', 'password');
        newIconName = 'eye';
    }
    // Re-create the <i> tag to ensure Lucide processes it correctly
    buttonElement.innerHTML = `<i data-lucide="${newIconName}"></i>`;
    if (window.lucide) {
        window.lucide.createIcons();
    }
}


// Expose utility functions to global scope if not using modules
window.isMobile = isMobile;
window.getCurrentUserRole = getCurrentUserRole;
window.roleGuard = roleGuard;
window.getQueryParam = getQueryParam;
window.togglePasswordVisibility = togglePasswordVisibility; // Expose globally
    
