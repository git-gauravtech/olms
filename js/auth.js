
document.addEventListener('DOMContentLoaded', () => {
    console.log('[auth.js] DOMContentLoaded event fired.');

    if (typeof window.API_BASE_URL === 'undefined' || typeof window.USER_ROLES === 'undefined') {
        console.error('[auth.js] CRITICAL ERROR: API_BASE_URL or USER_ROLES not defined. constants.js might not have loaded correctly or has errors.');
        alert('Critical application error: Configuration missing. Please contact support. (auth.js)');
        return; // Halt further execution if critical constants are missing
    }
    console.log('[auth.js] API_BASE_URL:', window.API_BASE_URL);
    console.log('[auth.js] USER_ROLES:', window.USER_ROLES);


    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        console.log('[auth.js] Login form found. Attaching submit listener.');
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.log('[auth.js] Login form not found on this page.');
    }

    if (signupForm) {
        console.log('[auth.js] Signup form found. Attaching submit listener and populating departments.');
        signupForm.addEventListener('submit', handleSignup);
        const departmentSelect = document.getElementById('department');
        if (departmentSelect && window.DEPARTMENTS) {
            window.DEPARTMENTS.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                departmentSelect.appendChild(option);
            });
        }
    } else {
        console.log('[auth.js] Signup form not found on this page.');
    }
});

async function handleLogin(event) {
    event.preventDefault();
    clearErrors();
    console.log("[auth.js] handleLogin triggered");

    // Defensive check again, in case DOMContentLoaded fires before constants.js is fully processed by browser.
    if (typeof window.API_BASE_URL === 'undefined' || typeof window.USER_ROLES === 'undefined') {
        console.error('[auth.js] CRITICAL ERROR in handleLogin: API_BASE_URL or USER_ROLES not defined.');
        showError('generalLoginError', 'Application configuration error. Please refresh.', document.getElementById('generalLoginError'));
        return;
    }

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.querySelector('#loginForm button[type="submit"]');
    const generalErrorElement = document.getElementById('generalLoginError');


    if (!emailInput || !passwordInput || !loginButton) {
        console.error("[auth.js] Login form elements not found!");
        if(generalErrorElement) showError('generalLoginError', 'Login form elements missing. Please refresh.', generalErrorElement);
        return;
    }
    
    const originalButtonText = loginButton.innerHTML;
    loginButton.disabled = true;
    loginButton.innerHTML = '<i data-lucide="loader-2" class="button-primary-loader" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem;"></i> Logging in...';
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();


    const email = emailInput.value;
    const password = passwordInput.value;

    console.log("[auth.js] Login attempt:", { email });

    let isValid = true;
    if (!email) {
        showError('emailError', 'Email is required.');
        isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        showError('emailError', 'Invalid email address.');
        isValid = false;
    }
    if (!password) {
        showError('passwordError', 'Password is required.');
        isValid = false;
    }

    if (!isValid) {
        console.log("[auth.js] Login validation failed on frontend.");
        loginButton.disabled = false;
        loginButton.innerHTML = originalButtonText;
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
        return;
    }

    console.log(`[auth.js] Attempting to fetch from: ${window.API_BASE_URL}/auth/login`);
    try {
        const response = await fetch(`${window.API_BASE_URL}/auth/login`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        console.log('[auth.js] Login response status:', response.status);
        console.log('[auth.js] Login response data:', data);


        if (response.ok && data.user && data.user.role) {
            console.log("[auth.js] Login successful from backend:", data);
            localStorage.setItem('token', data.token); 
            localStorage.setItem('userRole', data.user.role); 
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userDepartment', data.user.department || '');
            
            const currentUserRoleConst = window.USER_ROLES; 
            if (!currentUserRoleConst) {
                 console.error("[auth.js] CRITICAL ERROR: window.USER_ROLES not defined on frontend post-login!");
                 if(generalErrorElement) showError('generalLoginError', 'Frontend configuration error. Cannot redirect.', generalErrorElement);
                 loginButton.disabled = false;
                 loginButton.innerHTML = originalButtonText;
                 if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
                 return;
            }
            console.log("[auth.js] Role from backend for redirection:", data.user.role);
            console.log("[auth.js] USER_ROLES for comparison:", currentUserRoleConst);

            switch (data.user.role) { 
                case currentUserRoleConst.ADMIN:
                    console.log("[auth.js] Redirecting to Admin dashboard...");
                    window.location.href = 'dashboard/admin.html';
                    break;
                case currentUserRoleConst.FACULTY:
                    console.log("[auth.js] Redirecting to Faculty dashboard...");
                    window.location.href = 'dashboard/faculty.html';
                    break;
                case currentUserRoleConst.STUDENT:
                    console.log("[auth.js] Redirecting to Student dashboard...");
                    window.location.href = 'dashboard/student.html';
                    break;
                case currentUserRoleConst.ASSISTANT:
                    console.log("[auth.js] Redirecting to Assistant dashboard...");
                    window.location.href = 'dashboard/assistant.html';
                    break;
                default:
                    console.error("[auth.js] Login: No matching role for redirection. Role from backend:", data.user.role);
                    if(generalErrorElement) showError('generalLoginError', `Invalid role (${data.user.role}) received from server. Cannot redirect.`, generalErrorElement);
            }
        } else {
            console.error("[auth.js] Login failed from backend:", data);
            if(generalErrorElement) showError('generalLoginError', data.msg || 'Login failed. Please check your credentials.', generalErrorElement);
        }
    } catch (error) {
        console.error('[auth.js] Login request failed:', error);
        if(generalErrorElement) showError('generalLoginError', 'An error occurred during login. Could not connect to server.', generalErrorElement);
    } finally {
        loginButton.disabled = false;
        loginButton.innerHTML = originalButtonText;
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons(); 
    }
}

async function handleSignup(event) {
    event.preventDefault();
    clearErrors();
    console.log("[auth.js] handleSignup triggered");

    // Defensive check
    if (typeof window.API_BASE_URL === 'undefined') {
        console.error('[auth.js] CRITICAL ERROR in handleSignup: API_BASE_URL not defined.');
        showError('generalSignupError', 'Application configuration error. Please refresh.', document.getElementById('generalSignupError'));
        return;
    }

    const signupButton = document.getElementById('signupButton'); // Corrected ID
    const generalErrorElement = document.getElementById('generalSignupError'); 
    if (!signupButton) {
        console.error("[auth.js] Signup button not found!");
        return;
    }

    const originalButtonText = signupButton.innerHTML;
    signupButton.disabled = true;
    signupButton.innerHTML = '<i data-lucide="loader-2" class="button-primary-loader" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem;"></i> Creating Account...';
    if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();


    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;
    const department = document.getElementById('department').value;

    let isValid = true;
    if (!fullName || fullName.length < 3) {
        showError('fullNameError', 'Full name must be at least 3 characters.');
        isValid = false;
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        showError('emailError', 'Invalid email address.');
        isValid = false;
    }
    if (!password || password.length < 6) { 
        showError('passwordError', 'Password must be at least 6 characters.');
        isValid = false;
    }
    if (password !== confirmPassword) {
        showError('confirmPasswordError', 'Passwords do not match.');
        isValid = false;
    }
    if (!role) {
        showError('roleError', 'Please select a role.');
        isValid = false;
    }
     if (!isValid) {
        signupButton.disabled = false;
        signupButton.innerHTML = originalButtonText;
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
        return;
    }
    
    console.log(`[auth.js] Attempting to fetch (signup) from: ${window.API_BASE_URL}/auth/signup`);
    try {
        const response = await fetch(`${window.API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password, role, department }),
        });
        const data = await response.json();
        console.log('[auth.js] Signup response status:', response.status);
        console.log('[auth.js] Signup response data:', data);

        if (response.status === 201) { 
            alert(`Account Created! ${data.msg || `Welcome, ${fullName}! Please login.`}`);
            window.location.href = 'index.html'; 
        } else {
            const targetErrorElement = generalErrorElement || document.getElementById('roleError'); 
            showError(targetErrorElement ? targetErrorElement.id : 'roleError', data.msg || 'Signup failed. Please try again.', targetErrorElement); 
        }
    } catch (error) {
        console.error('[auth.js] Signup request failed:', error);
        const targetErrorElement = generalErrorElement || document.getElementById('roleError'); 
        showError(targetErrorElement ? targetErrorElement.id : 'roleError', 'An error occurred during signup. Could not connect to server.', targetErrorElement);
    } finally {
        signupButton.disabled = false;
        signupButton.innerHTML = originalButtonText;
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    }
}

function showError(elementId, message, elementInstance = null) {
    const errorElement = elementInstance || document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('visible');
        if(errorElement.tagName === 'P' && errorElement.style.display === 'none') { 
             errorElement.style.display = 'block';
        }
    } else {
        console.warn(`[auth.js] Error element with ID '${elementId}' not found. Message: ${message}`);
        // alert(message); // Avoid alert if specific element not found, rely on general error area
        const generalErrorArea = document.getElementById('generalLoginError') || document.getElementById('generalSignupError');
        if (generalErrorArea) {
            generalErrorArea.textContent = message;
            generalErrorArea.classList.add('visible');
            if(generalErrorArea.style.display === 'none') generalErrorArea.style.display = 'block';
        } else {
            alert(message); // Ultimate fallback
        }
    }
}

function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
         if(el.tagName === 'P' && el.style.display !== 'none') { 
            el.style.display = 'none';
        }
    });
}
