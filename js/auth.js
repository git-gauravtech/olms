
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        const departmentSelect = document.getElementById('department');
        if (departmentSelect && window.DEPARTMENTS_CONST) {
            window.DEPARTMENTS_CONST.forEach(dept => {
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
    const roleInput = document.getElementById('role');
    const loginButton = document.querySelector('#loginForm button[type="submit"]'); 

    if (!emailInput || !passwordInput || !roleInput || !loginButton) {
        // console.error("Login form elements not found!");
        showError('roleError', 'Login form elements missing. Please refresh.');
        return;
    }
    
    const originalButtonText = loginButton.innerHTML;
    loginButton.disabled = true;
    loginButton.innerHTML = '<i data-lucide="loader-2" class="button-primary-loader" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem;"></i> Logging in...';
    if (window.lucide) window.lucide.createIcons();


    const email = emailInput.value;
    const password = passwordInput.value;
    const role = roleInput.value;

    // console.log("Login attempt:", { email, role });

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
    if (!role) {
        showError('roleError', 'Please select a role.');
        isValid = false;
    }

    if (!isValid) {
        // console.log("Login validation failed on frontend.");
        loginButton.disabled = false;
        loginButton.innerHTML = originalButtonText;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    try {
        const response = await fetch('/api/auth/login', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, role }),
        });

        const data = await response.json();

        if (response.ok) {
            // console.log("Login successful from backend:", data);
            localStorage.setItem('token', data.token); 
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userDepartment', data.user.department || '');

            // alert(`Login Successful. Welcome, ${data.user.name}! Redirecting to your dashboard...`);
            
            const currentUserRoleConst = window.USER_ROLES_OBJ; 
            if (!currentUserRoleConst) {
                //  console.error("CRITICAL ERROR: window.USER_ROLES_OBJ not defined on frontend!");
                 showError('roleError', 'Frontend configuration error. Cannot redirect.');
                 loginButton.disabled = false;
                 loginButton.innerHTML = originalButtonText;
                 if (window.lucide) window.lucide.createIcons();
                 return;
            }
            // console.log("Alert shown. Current role for switch:", data.user.role);
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
                    showError('roleError', 'Invalid role received from server. Cannot redirect.');
            }
        } else {
            // console.error("Login failed from backend:", data);
            showError('roleError', data.msg || 'Login failed. Please check your credentials and role.');
        }
    } catch (error) {
        // console.error('Login request failed:', error);
        showError('roleError', 'An error occurred during login. Could not connect to server.');
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
    
    try {
        const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password, role, department }),
        });
        const data = await response.json();

        if (response.status === 201) { 
            alert(`Account Created! ${data.msg || `Welcome, ${fullName}! Please login.`}`);
            window.location.href = 'index.html'; 
        } else {
            showError('roleError', data.msg || 'Signup failed. Please try again.'); 
        }
    } catch (error) {
        // console.error('Signup request failed:', error);
        showError('roleError', 'An error occurred during signup. Could not connect to server.');
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
    let newIconName;
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        newIconName = 'eye-off';
    } else {
        passwordInput.type = 'password';
        newIconName = 'eye';
    }
    buttonElement.innerHTML = `<i data-lucide="${newIconName}"></i>`; // Recreate the <i> tag
    if (window.lucide) {
        window.lucide.createIcons(); // Tell Lucide to process the new icon
    }
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('visible');
    } else {
        const generalErrorArea = document.getElementById('generalAuthError'); 
        if (generalErrorArea) {
            generalErrorArea.textContent = message;
            generalErrorArea.classList.add('visible');
        } else {
            // alert(message); // Last resort
        }
    }
}

function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
    });
    const generalErrorArea = document.getElementById('generalAuthError');
    if (generalErrorArea) {
        generalErrorArea.textContent = '';
        generalErrorArea.classList.remove('visible');
    }
}
