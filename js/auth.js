
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

    console.log("Login attempt:", { email, role }); // Debug log

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

    if (!isValid) {
        console.log("Login validation failed."); // Debug log
        return;
    }

    // Ensure USER_ROLES is available
    const currentUserRoles = window.USER_ROLES || USER_ROLES; // Fallback if window.USER_ROLES isn't set, though it should be
    if (!currentUserRoles) {
        console.error("USER_ROLES object is not defined. Make sure constants.js is loaded before auth.js.");
        showError('roleError', 'System error: Roles not defined. Please contact support.');
        return;
    }
    console.log("USER_ROLES for comparison:", currentUserRoles); // Debug log

    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email);
    const userName = localStorage.getItem('userName') || email.split('@')[0] || role;
    localStorage.setItem('userName', userName);

    alert(`Login Successful. Welcome, ${userName}! Redirecting to your dashboard...`);
    console.log(`Alert shown. Current role for switch: "${role}"`); // Debug log

    let redirected = false;
    switch (role) {
        case currentUserRoles.ADMIN:
            console.log("Redirecting to Admin dashboard..."); // Debug log
            window.location.href = 'dashboard/admin.html';
            redirected = true;
            break;
        case currentUserRoles.FACULTY:
            console.log("Redirecting to Faculty dashboard..."); // Debug log
            window.location.href = 'dashboard/faculty.html';
            redirected = true;
            break;
        case currentUserRoles.STUDENT:
            console.log("Redirecting to Student dashboard..."); // Debug log
            window.location.href = 'dashboard/student.html';
            redirected = true;
            break;
        case currentUserRoles.ASSISTANT:
            console.log("Redirecting to Assistant dashboard..."); // Debug log
            window.location.href = 'dashboard/assistant.html';
            redirected = true;
            break;
        default:
            console.error("Login: No matching role for redirection. Role provided:", role); // Debug log
            showError('roleError', 'Invalid role selected. Cannot redirect.');
    }
    if(redirected){
        console.log("Redirection was attempted to:", window.location.href);
    } else {
        console.error("Redirection was NOT attempted. Check switch/case logic and role value.");
    }
}

function handleSignup(event) {
    event.preventDefault();
    clearErrors();
    const signupButton = document.getElementById('signupButton');
    if (!signupButton) return;

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
        if (window.lucide) window.lucide.createIcons(); // Ensure icon is removed if loader was there
        return;
    }
    // Ensure USER_ROLES is available for signup redirection logic too
    const currentUserRoles = window.USER_ROLES || USER_ROLES;
    if (!currentUserRoles) {
        console.error("USER_ROLES object is not defined for signup. Make sure constants.js is loaded before auth.js.");
        signupButton.disabled = false;
        signupButton.innerHTML = 'Create Account';
        if (window.lucide) window.lucide.createIcons();
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
        if (window.lucide) window.lucide.createIcons();


        switch (role) {
            case currentUserRoles.ADMIN:
                window.location.href = 'dashboard/admin.html';
                break;
            case currentUserRoles.FACULTY:
                window.location.href = 'dashboard/faculty.html';
                break;
            case currentUserRoles.STUDENT:
                window.location.href = 'dashboard/student.html';
                break;
            case currentUserRoles.ASSISTANT:
                window.location.href = 'dashboard/assistant.html';
                break;
            default:
                window.location.href = 'index.html';
        }
    }, 1500);
}

function togglePasswordVisibility(fieldId, buttonElement) {
    const passwordInput = document.getElementById(fieldId);
    const icon = buttonElement.querySelector('i'); // Assuming the icon is an <i> tag
    if (!passwordInput || !icon) return;

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
