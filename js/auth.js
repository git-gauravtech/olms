
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
    const loginButton = document.querySelector('#loginForm button[type="submit"]');
    const generalErrorElement = document.getElementById('generalLoginError');


    if (!emailInput || !passwordInput || !loginButton) {
        // console.error("Login form elements not found!");
        if(generalErrorElement) showError('generalLoginError', 'Login form elements missing. Please refresh.', generalErrorElement);
        return;
    }
    
    const originalButtonText = loginButton.innerHTML;
    loginButton.disabled = true;
    loginButton.innerHTML = '<i data-lucide="loader-2" class="button-primary-loader" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem;"></i> Logging in...';
    if (window.lucide) window.lucide.createIcons();


    const email = emailInput.value;
    const password = passwordInput.value;

    // console.log("Login attempt:", { email });

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
        // console.log("Login validation failed on frontend.");
        loginButton.disabled = false;
        loginButton.innerHTML = originalButtonText;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    if (!window.API_BASE_URL) {
        // console.error("API_BASE_URL is not defined. Cannot make API call.");
        if(generalErrorElement) showError('generalLoginError', "Configuration error: API URL missing.", generalErrorElement);
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
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // console.log("Login successful from backend:", data);
            localStorage.setItem('token', data.token); 
            localStorage.setItem('userRole', data.user.role); 
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userDepartment', data.user.department || '');
            
            const currentUserRoleConst = window.USER_ROLES; 
            if (!currentUserRoleConst) {
                 // console.error("CRITICAL ERROR: window.USER_ROLES not defined on frontend!");
                 if(generalErrorElement) showError('generalLoginError', 'Frontend configuration error. Cannot redirect.', generalErrorElement);
                 loginButton.disabled = false;
                 loginButton.innerHTML = originalButtonText;
                 if (window.lucide) window.lucide.createIcons();
                 return;
            }
            // console.log("Role from backend for redirection:", data.user.role);
            // console.log("USER_ROLES for comparison:", currentUserRoleConst);

            switch (data.user.role) { 
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
                    if(generalErrorElement) showError('generalLoginError', `Invalid role (${data.user.role}) received from server. Cannot redirect.`, generalErrorElement);
            }
        } else {
            // console.error("Login failed from backend:", data);
            if(generalErrorElement) showError('generalLoginError', data.msg || 'Login failed. Please check your credentials.', generalErrorElement);
        }
    } catch (error) {
        // console.error('Login request failed:', error);
        if(generalErrorElement) showError('generalLoginError', 'An error occurred during login. Could not connect to server.', generalErrorElement);
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
    const generalErrorElement = document.getElementById('generalSignupError'); 
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
        const targetErrorElement = generalErrorElement || document.getElementById('roleError'); // Fallback
        showError(targetErrorElement ? targetErrorElement.id : 'roleError', "Configuration error: API URL missing.", targetErrorElement);
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
            const targetErrorElement = generalErrorElement || document.getElementById('roleError'); // Fallback
            showError(targetErrorElement ? targetErrorElement.id : 'roleError', data.msg || 'Signup failed. Please try again.', targetErrorElement); 
        }
    } catch (error) {
        // console.error('Signup request failed:', error);
        const targetErrorElement = generalErrorElement || document.getElementById('roleError'); // Fallback
        showError(targetErrorElement ? targetErrorElement.id : 'roleError', 'An error occurred during signup. Could not connect to server.', targetErrorElement);
    } finally {
        signupButton.disabled = false;
        signupButton.innerHTML = originalButtonText;
        if (window.lucide) window.lucide.createIcons();
    }
}

function showError(elementId, message, elementInstance = null) {
    const errorElement = elementInstance || document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('visible');
        if(errorElement.tagName !== 'P' && errorElement.style.display === 'none') { // For generalLoginError which might be a P tag
             errorElement.style.display = 'block'; // Ensure it's visible if it was hidden P
        }
    } else {
        // Fallback if specific error element isn't found
        const generalErrorArea = document.getElementById('generalLoginError') || document.getElementById('generalSignupError');
        if (generalErrorArea) {
            generalErrorArea.textContent = message;
            generalErrorArea.classList.add('visible');
            if(generalErrorArea.style.display === 'none') generalErrorArea.style.display = 'block';
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
         if(el.tagName === 'P' && el.style.display !== 'none') { // If it's one of the general P tag errors
            el.style.display = 'none';
        }
    });
}
