
document.addEventListener('DOMContentLoaded', () => {
    // console.log('[auth.js] DOMContentLoaded event fired.');

    if (typeof window.API_BASE_URL === 'undefined' || typeof window.USER_ROLES === 'undefined') {
        console.error('[auth.js] CRITICAL ERROR: API_BASE_URL or USER_ROLES not defined.');
        alert('Critical application error: Configuration missing. Please contact support. (auth.js)');
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    // const resetPasswordForm = document.getElementById('resetPasswordForm'); // Handled in reset_password.html directly

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        populateRoleDropdown(document.getElementById('role'), window.USER_ROLE_VALUES);
        populateDepartmentDropdown(document.getElementById('department'), window.DEPARTMENTS);
    }
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
    }
});

function populateRoleDropdown(selectElement, roles) {
    if (selectElement && roles) {
        selectElement.innerHTML = '<option value="">Select Role</option>';
        roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role;
            option.textContent = role;
            selectElement.appendChild(option);
        });
    }
}
function populateDepartmentDropdown(selectElement, departments) {
    if (selectElement && departments) {
        selectElement.innerHTML = '<option value="">Select Department (Optional)</option>';
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            selectElement.appendChild(option);
        });
    }
}


async function handleLogin(event) {
    event.preventDefault();
    clearErrors();
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginButton = event.target.querySelector('button[type="submit"]');
    const generalErrorElement = document.getElementById('generalLoginError');

    if (!emailInput || !passwordInput || !loginButton) {
        alert('Login form elements missing. Please refresh.'); return;
    }
    
    const originalButtonText = loginButton.innerHTML;
    loginButton.disabled = true;
    loginButton.innerHTML = '<i data-lucide="loader-2" class="button-primary-loader" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem;"></i> Logging in...';
    if (window.lucide) window.lucide.createIcons();

    const email = emailInput.value;
    const password = passwordInput.value;

    let isValid = true;
    if (!email) { showError('emailError', 'Email is required.'); isValid = false; }
    if (!password) { showError('passwordError', 'Password is required.'); isValid = false; }
    if (!isValid) {
        loginButton.disabled = false; loginButton.innerHTML = originalButtonText; if (window.lucide) window.lucide.createIcons();
        return;
    }

    try {
        const response = await fetch(`${window.API_BASE_URL}/auth/login`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (response.ok && data.user && data.user.role) {
            localStorage.setItem('token', data.token); 
            localStorage.setItem('userRole', data.user.role); 
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userDepartment', data.user.department || '');
            
            const roleDashboardMap = {
                [window.USER_ROLES.ADMIN]: 'dashboard/admin.html',
                [window.USER_ROLES.FACULTY]: 'dashboard/faculty.html',
                [window.USER_ROLES.STUDENT]: 'dashboard/student.html',
                [window.USER_ROLES.ASSISTANT]: 'dashboard/assistant.html',
            };
            window.location.href = roleDashboardMap[data.user.role] || 'index.html'; // Fallback to login
        } else {
            const errorMessage = data.msg || 'Login failed. Please check your credentials.';
            showError('generalLoginError', errorMessage);
        }
    } catch (error) {
        showError('generalLoginError', 'An error occurred. Could not connect to server.');
    } finally {
        loginButton.disabled = false; loginButton.innerHTML = originalButtonText; if (window.lucide) window.lucide.createIcons(); 
    }
}

async function handleSignup(event) {
    event.preventDefault();
    clearErrors();
    const signupButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = signupButton.innerHTML;
    signupButton.disabled = true;
    signupButton.innerHTML = '<i data-lucide="loader-2" class="button-primary-loader" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem;"></i> Creating...';
    if (window.lucide) window.lucide.createIcons();

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const secretWord = document.getElementById('secretWord').value; 
    const role = document.getElementById('role').value;
    const department = document.getElementById('department').value;

    let isValid = true;
    if (!fullName) { showError('fullNameError', 'Full name is required.'); isValid = false; }
    if (!email) { showError('emailError', 'Email is required.'); isValid = false; }
    if (!password || password.length < 6) { showError('passwordError', 'Password must be at least 6 characters.'); isValid = false; }
    if (password !== confirmPassword) { showError('confirmPasswordError', 'Passwords do not match.'); isValid = false; }
    if (!secretWord || secretWord.length < 4) { showError('secretWordError', 'Secret word must be at least 4 characters.'); isValid = false; }
    if (!role) { showError('roleError', 'Role is required.'); isValid = false; }
    if (!isValid) {
        signupButton.disabled = false; signupButton.innerHTML = originalButtonText; if (window.lucide) window.lucide.createIcons();
        return;
    }
    
    try {
        const response = await fetch(`${window.API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password, secretWord, role, department }), 
        });
        const data = await response.json();
        if (response.status === 201) { 
            alert(data.msg || `Account Created! Please login.`);
            window.location.href = 'index.html'; 
        } else {
            showError('generalSignupError', data.msg || 'Signup failed. Please try again.'); // Assuming a general error display element
        }
    } catch (error) {
        showError('generalSignupError', 'An error occurred during signup.');
    } finally {
        signupButton.disabled = false; signupButton.innerHTML = originalButtonText; if (window.lucide) window.lucide.createIcons();
    }
}

async function handleForgotPassword(event) {
    event.preventDefault();
    clearErrors(); 
    const emailInput = document.getElementById('email');
    const secretWordInput = document.getElementById('secretWord'); 
    const formMessage = document.getElementById('formMessage'); 
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<i data-lucide="loader-2" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem;"></i> Sending...';
    if(window.lucide) window.lucide.createIcons();

    const email = emailInput.value.trim();
    const secretWord = secretWordInput.value.trim(); 

    let isValid = true;
    if (!email) { showError('emailError', 'Email is required.'); isValid = false; }
    if (!secretWord) { showError('secretWordError', 'Secret word is required.'); isValid = false; }
    if (!isValid) {
        submitButton.disabled = false; submitButton.innerHTML = originalButtonText; if(window.lucide) window.lucide.createIcons();
        return;
    }

    try {
        const response = await fetch(`${window.API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, secretWord }) 
        });
        const data = await response.json();
        if (response.ok && data.resetToken) { 
            window.location.href = `reset_password.html?token=${data.resetToken}`;
        } else {
            showError(null, data.msg || 'Could not process request.', formMessage);
        }
    } catch (error) {
        showError(null, 'Could not connect to the server.', formMessage);
    } finally {
        submitButton.disabled = false; submitButton.innerHTML = originalButtonText; if(window.lucide) window.lucide.createIcons();
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
