
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
    const forgotPasswordForm = document.getElementById('forgotPasswordForm'); // Added for forgot password page logic

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
            departmentSelect.innerHTML = '<option value="">Select your department</option>'; // Clear existing options
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

    if (forgotPasswordForm) {
        console.log('[auth.js] Forgot password form found. Attaching submit listener.');
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    } else {
        console.log('[auth.js] Forgot password form not found on this page.');
    }
});

async function handleLogin(event) {
    event.preventDefault();
    clearErrors();
    console.log("[auth.js] handleLogin triggered");

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = document.querySelector('#loginForm button[type="submit"]');
    const generalErrorElement = document.getElementById('generalLoginError');


    if (!window.API_BASE_URL || !window.USER_ROLES) {
        console.error('[auth.js] CRITICAL ERROR in handleLogin: API_BASE_URL or USER_ROLES not defined.');
        alert('Application configuration error. Please refresh.');
        return;
    }

    if (!emailInput || !passwordInput || !loginButton) {
        console.error("[auth.js] Login form elements not found!");
        alert('Login form elements missing. Please refresh.');
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
                 alert('Frontend configuration error. Cannot redirect.');
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
                    alert(`Invalid role (${data.user.role}) received from server. Cannot redirect.`);
            }
        } else {
            console.error("[auth.js] Login failed from backend:", data);
            const errorMessage = data.msg || 'Login failed. Please check your credentials or role selection.';
            if (generalErrorElement) {
                showError(null, errorMessage, generalErrorElement);
            } else {
                alert(errorMessage);
            }
        }
    } catch (error) {
        console.error('[auth.js] Login request failed:', error);
        const errorMessage = 'An error occurred during login. Could not connect to server.';
        if (generalErrorElement) {
            showError(null, errorMessage, generalErrorElement);
        } else {
            alert(errorMessage);
        }
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

    if (typeof window.API_BASE_URL === 'undefined') {
        console.error('[auth.js] CRITICAL ERROR in handleSignup: API_BASE_URL not defined.');
        alert('Application configuration error. Please refresh.');
        return;
    }

    const signupButton = document.getElementById('signupButton');
    const generalErrorElement = null; // Use alert for general signup errors for now

    if (!signupButton) {
        console.error("[auth.js] Signup button not found!");
        alert('Signup form button missing. Please refresh.');
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
    const secretWord = document.getElementById('secretWord').value; // Get secret word
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
    if (!secretWord || secretWord.length < 4) { // Add validation for secret word
        showError('secretWordError', 'Secret word must be at least 4 characters.');
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
            body: JSON.stringify({ fullName, email, password, secretWord, role, department }), // Send secretWord
        });
        const data = await response.json();
        console.log('[auth.js] Signup response status:', response.status);
        console.log('[auth.js] Signup response data:', data);

        if (response.status === 201) { 
            alert(data.msg || `Account Created! Welcome, ${fullName}! Please login.`);
            window.location.href = 'index.html'; 
        } else {
             const errorMessage = data.msg || 'Signup failed. Please try again.';
            if (generalErrorElement) {
                showError(null, errorMessage, generalErrorElement);
            } else {
                alert(errorMessage);
            }
        }
    } catch (error) {
        console.error('[auth.js] Signup request failed:', error);
        const errorMessage = 'An error occurred during signup. Could not connect to server.';
        if (generalErrorElement) {
            showError(null, errorMessage, generalErrorElement);
        } else {
            alert(errorMessage);
        }
    } finally {
        signupButton.disabled = false;
        signupButton.innerHTML = originalButtonText;
        if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    clearErrors(); // Clear previous errors
    console.log("[auth.js] handleForgotPassword triggered");

    const emailInput = document.getElementById('email');
    const secretWordInput = document.getElementById('secretWord'); // Get secret word input
    const formMessage = document.getElementById('formMessage'); // For general messages
    const submitButton = document.querySelector('#forgotPasswordForm button[type="submit"]');

    if (!emailInput || !secretWordInput || !formMessage || !submitButton) {
        console.error("[auth.js] Forgot password form elements missing!");
        alert('Page error. Please refresh.');
        return;
    }

    const email = emailInput.value.trim();
    const secretWord = secretWordInput.value.trim(); // Get secret word value

    let isValid = true;
    if (!email) {
        showError('emailError', 'Email is required.');
        isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        showError('emailError', 'Please enter a valid email address.');
        isValid = false;
    }
    if (!secretWord) { // Add validation for secret word
        showError('secretWordError', 'Secret word is required.');
        isValid = false;
    }

    if (!isValid) return;

    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i data-lucide="loader-2" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem;"></i> Sending...';
    if(window.lucide) window.lucide.createIcons();

    try {
        const response = await fetch(`${window.API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, secretWord }) // Send email and secretWord
        });
        const data = await response.json();

        if (response.ok && data.resetToken) { // Backend now returns token for auto-redirect simulation
            window.location.href = `reset_password.html?token=${data.resetToken}`;
        } else {
            // Generic message if email/secret word combo not found or other error
            showError(null, data.msg || 'Could not process request. Please check your email and secret word.', formMessage);
        }
    } catch (error) {
        console.error('Forgot password request failed:', error);
        showError(null, 'Could not connect to the server. Please try again later.', formMessage);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
        if(window.lucide) window.lucide.createIcons();
    }
}


function showError(elementId, message, elementInstance = null) {
    const errorElement = elementId ? document.getElementById(elementId) : elementInstance;
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('visible');
        if(errorElement.tagName === 'P' && errorElement.style.display === 'none') { 
             errorElement.style.display = 'block';
        }
    } else {
        console.warn(`[auth.js] Error element with ID '${elementId}' or instance not found. Message: ${message}`);
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
