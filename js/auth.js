
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        // Populate departments on signup page
        const departmentSelect = document.getElementById('department');
        if (departmentSelect && window.DEPARTMENTS) {
            window.DEPARTMENTS.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept;
                option.textContent = dept;
                departmentSelect.appendChild(option);
            });
        }
    }
});

function handleLogin(event) {
    event.preventDefault();
    clearErrors();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

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
    } else if (password.length < 6) {
        showError('passwordError', 'Password must be at least 6 characters.');
        isValid = false;
    }
    if (!role) {
        showError('roleError', 'Please select a role.');
        isValid = false;
    }

    if (!isValid) return;

    // Simulate successful login
    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email); 
    const userName = localStorage.getItem('userName') || email.split('@')[0] || role;
    localStorage.setItem('userName', userName);
    
    alert(`Login Successful. Welcome, ${userName}! Redirecting to your dashboard...`);

    switch (role) {
        case USER_ROLES.ADMIN:
            window.location.href = 'dashboard/admin.html';
            break;
        case USER_ROLES.FACULTY:
            window.location.href = 'dashboard/faculty.html';
            break;
        case USER_ROLES.STUDENT:
            window.location.href = 'dashboard/student.html';
            break;
        case USER_ROLES.ASSISTANT: // Changed from CR
            window.location.href = 'dashboard/assistant.html'; // Changed path
            break;
        default:
            showError('roleError', 'Invalid role selected. Cannot redirect.');
            console.error("Login: Invalid role for redirection:", role);
    }
}

function handleSignup(event) {
    event.preventDefault();
    clearErrors();
    const signupButton = document.getElementById('signupButton');
    signupButton.disabled = true;
    signupButton.innerHTML = '<i data-lucide="loader-2" class="button-primary-loader" style="animation: spin 1s linear infinite; margin-right: 0.5rem;"></i> Creating Account...';
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
    if (!password || password.length < 8) {
        showError('passwordError', 'Password must be at least 8 characters.');
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
        signupButton.innerHTML = 'Create Account';
        return;
    }

    setTimeout(() => {
        localStorage.setItem('userRole', role);
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', fullName);
        if (department) localStorage.setItem('userDepartment', department);


        alert(`Account Created! Welcome, ${fullName}! Your account as ${role} has been successfully created.`);
        signupButton.disabled = false;
        signupButton.innerHTML = 'Create Account';

        switch (role) {
            case USER_ROLES.ADMIN:
                window.location.href = 'dashboard/admin.html';
                break;
            case USER_ROLES.FACULTY:
                window.location.href = 'dashboard/faculty.html';
                break;
            case USER_ROLES.STUDENT:
                window.location.href = 'dashboard/student.html';
                break;
            case USER_ROLES.ASSISTANT: // Changed from CR
                window.location.href = 'dashboard/assistant.html'; // Changed path
                break;
            default:
                window.location.href = 'index.html'; 
        }
    }, 1500);
}

function togglePasswordVisibility(fieldId, buttonElement) {
    const passwordInput = document.getElementById(fieldId);
    const icon = buttonElement.querySelector('i');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.setAttribute('data-lucide', 'eye-off');
    } else {
        passwordInput.type = 'password';
        icon.setAttribute('data-lucide', 'eye');
    }
    if (window.lucide) { 
      window.lucide.createIcons();
    }
}


function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('visible');
    }
}

function clearErrors() {
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
    });
}
