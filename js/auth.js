
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        const departmentSelect = document.getElementById('department');
        if (departmentSelect && window.DEPARTMENTS) { // Ensure window.DEPARTMENTS is used
            window.DEPARTMENTS.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                departmentSelect.appendChild(option);
            });
        }
    }
});

async function handleLogin(event) {
    event.preventDefault();
    clearErrors();
    // console.log("handleLogin triggered");

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    // Role input removed
    const loginButton = document.querySelector('#loginForm button[type="submit"]');
    const generalErrorElement = document.getElementById('generalLoginError');


    if (!emailInput || !passwordInput || !loginButton) {
        // console.error("Login form elements not found!");
        showError('generalLoginError', 'Login form elements missing. Please refresh.');
        return;
    }
    
    const originalButtonText = loginButton.innerHTML;
    loginButton.disabled = true;
    loginButton.innerHTML = '<i data-lucide="loader-2" class="button-primary-loader" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem;"></i> Logging in...';
    if (window.lucide) window.lucide.createIcons();


    const email = emailInput.value;
    const password = passwordInput.value;
    // Role from form removed

    // console.log("Login attempt:", { email }); // Role removed from log

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
    // Role validation removed

    if (!isValid) {
        // console.log("Login validation failed on frontend.");
        loginButton.disabled = false;
        loginButton.innerHTML = originalButtonText;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    if (!window.API_BASE_URL) {
        // console.error("API_BASE_URL is not defined. Cannot make API call.");
        showError('generalLoginError', "Configuration error: API URL missing.");
        loginButton.disabled = false;
        loginButton.innerHTML = originalButtonText;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    try {
        const response = await fetch(`${window.API_BASE_URL}/auth/login`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }), // Role removed from body
        });

        const data = await response.json();

        if (response.ok) {
            // console.log("Login successful from backend:", data);
            localStorage.setItem('token', data.token); 
            localStorage.setItem('userRole', data.user.role); // Role from backend response
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userDepartment', data.user.department || '');
            
            const currentUserRoleConst = window.USER_ROLES; 
            if (!currentUserRoleConst) {
                 // console.error("CRITICAL ERROR: window.USER_ROLES not defined on frontend!");
                 showError('generalLoginError', 'Frontend configuration error. Cannot redirect.');
                 loginButton.disabled = false;
                 loginButton.innerHTML = originalButtonText;
                 if (window.lucide) window.lucide.createIcons();
                 return;
            }
            // console.log("Role from backend for redirection:", data.user.role);
            // console.log("USER_ROLES for comparison:", currentUserRoleConst);

            switch (data.user.role) { // Use role from backend data
                case currentUserRoleConst.ADMIN:
                    // console.log("Redirecting to Admin dashboard...");
                    window.location.href = 'dashboard/admin.html';
                    break;
                case currentUserRoleConst.FACULTY:
                    // console.log("Redirecting to Faculty dashboard...");
                    window.location.href = 'dashboard/faculty.html';
                    break;
                case currentUserRoleConst.STUDENT:
                    // console.log("Redirecting to Student dashboard...");
                    window.location.href = 'dashboard/student.html';
                    break;
                case currentUserRoleConst.ASSISTANT:
                    // console.log("Redirecting to Assistant dashboard...");
                    window.location.href = 'dashboard/assistant.html';
                    break;
                default:
                    // console.error("Login: No matching role for redirection. Role from backend:", data.user.role);
                    showError('generalLoginError', `Invalid role (${data.user.role}) received from server. Cannot redirect.`);
            }
        } else {
            // console.error("Login failed from backend:", data);
            showError('generalLoginError', data.msg || 'Login failed. Please check your credentials.');
        }
    } catch (error) {
        // console.error('Login request failed:', error);
        showError('generalLoginError', 'An error occurred during login. Could not connect to server.');
    } finally {
        loginButton.disabled = false;
        loginButton.innerHTML = originalButtonText;
        if (window.lucide) window.lucide.createIcons(); 
    }
}

async function handleSignup(event) {
    event.preventDefault();
    clearErrors();
    const signupButton = document.getElementById('signupButton');
    const generalErrorElement = document.getElementById('generalSignupError'); // Assuming you might add this
    if (!signupButton) return;

    const originalButtonText = signupButton.innerHTML;
    signupButton.disabled = true;
    signupButton.innerHTML = '<i data-lucide="loader-2" class="button-primary-loader" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem;"></i> Creating Account...';
    if (window.lucide) window.lucide.createIcons();


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
        if (window.lucide) window.lucide.createIcons();
        return;
    }
    
    if (!window.API_BASE_URL) {
        // console.error("API_BASE_URL is not defined. Cannot make API call.");
        showError(generalErrorElement ? 'generalSignupError' : 'roleError', "Configuration error: API URL missing.");
        signupButton.disabled = false;
        signupButton.innerHTML = originalButtonText;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    try {
        const response = await fetch(`${window.API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password, role, department }),
        });
        const data = await response.json();

        if (response.status === 201) { 
            alert(`Account Created! ${data.msg || `Welcome, ${fullName}! Please login.`}`);
            window.location.href = 'index.html'; 
        } else {
            showError(generalErrorElement ? 'generalSignupError' : 'roleError', data.msg || 'Signup failed. Please try again.'); 
        }
    } catch (error) {
        // console.error('Signup request failed:', error);
        showError(generalErrorElement ? 'generalSignupError' : 'roleError', 'An error occurred during signup. Could not connect to server.');
    } finally {
        signupButton.disabled = false;
        signupButton.innerHTML = originalButtonText;
        if (window.lucide) window.lucide.createIcons();
    }
}

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


function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('visible');
    } else {
        // Fallback if specific error element isn't found
        const generalErrorArea = document.getElementById('generalLoginError') || document.getElementById('generalSignupError');
        if (generalErrorArea) {
            generalErrorArea.textContent = message;
            generalErrorArea.classList.add('visible');
        } else {
            // console.warn(`Error element with ID '${elementId}' not found. Message: ${message}`);
            alert(message); // Fallback to alert if no designated error area
        }
    }
}

function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
    });
    // Clear general error areas if they exist
    const generalLoginError = document.getElementById('generalLoginError');
    if (generalLoginError) {
        generalLoginError.textContent = '';
        generalLoginError.classList.remove('visible');
    }
    const generalSignupError = document.getElementById('generalSignupError');
     if (generalSignupError) {
        generalSignupError.textContent = '';
        generalSignupError.classList.remove('visible');
    }
}
