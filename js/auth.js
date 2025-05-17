
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

    console.log("Login attempt:", { email, role }); 

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
        console.log("Login validation failed."); 
        return;
    }

    const currentUserRoles = window.USER_ROLES;
    if (!currentUserRoles) {
        console.error("CRITICAL ERROR: USER_ROLES object is not defined in window. Make sure constants.js is loaded before auth.js and defines window.USER_ROLES.");
        showError('roleError', 'System error: Roles not defined. Please contact support.');
        return;
    }
    console.log("USER_ROLES for comparison in login:", currentUserRoles); 

    localStorage.setItem('userRole', role);
    localStorage.setItem('userEmail', email);
    const userNameFromStorage = localStorage.getItem('userName');
    const userName = userNameFromStorage && userNameFromStorage !== "null" && userNameFromStorage !== "undefined" ? userNameFromStorage : email.split('@')[0] || role;
    localStorage.setItem('userName', userName);


    alert(`Login Successful. Welcome, ${userName}! Redirecting to your dashboard...`);
    console.log(`Alert shown. Current role for switch: "${role}"`); 

    let redirected = false;
    switch (role) {
        case currentUserRoles.ADMIN:
            console.log("Redirecting to Admin dashboard...");
            window.location.href = 'dashboard/admin.html';
            redirected = true;
            break;
        case currentUserRoles.FACULTY:
            console.log("Redirecting to Faculty dashboard...");
            window.location.href = 'dashboard/faculty.html';
            redirected = true;
            break;
        case currentUserRoles.STUDENT:
            console.log("Redirecting to Student dashboard...");
            window.location.href = 'dashboard/student.html';
            redirected = true;
            break;
        case currentUserRoles.ASSISTANT:
            console.log("Redirecting to Assistant dashboard...");
            window.location.href = 'dashboard/assistant.html';
            redirected = true;
            break;
        default:
            console.error("Login: No matching role for redirection. Role provided:", role, "Expected roles:", currentUserRoles);
            showError('roleError', 'Invalid role selected. Cannot redirect.');
    }

    if(redirected){
        console.log("Redirection was attempted to:", window.location.href);
    } else {
        console.error("Redirection was NOT attempted. Check switch/case logic and role value. Role was:", role);
    }
}

function handleSignup(event) {
    event.preventDefault();
    clearErrors();
    const signupButton = document.getElementById('signupButton');
    if (!signupButton) return;

    signupButton.disabled = true;
    // Correctly set innerHTML for loader icon
    signupButton.innerHTML = '<i data-lucide="loader-2" class="button-primary-loader" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem;"></i> Creating Account...';
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons(); // Re-render icons to show the loader
    }


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
        // If Lucide was used, ensure the original button content is restored or icons re-rendered if needed
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
           // window.lucide.createIcons(); // Could be called if button had static icons to restore
        }
        return;
    }

    const currentUserRoles = window.USER_ROLES;
    if (!currentUserRoles) {
        console.error("CRITICAL ERROR: USER_ROLES object is not defined for signup. Make sure constants.js is loaded before auth.js.");
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
                console.error("Signup: No matching role for redirection. Role was:", role);
                window.location.href = 'index.html'; 
        }
    }, 1500);
}

function togglePasswordVisibility(fieldId, buttonElement) {
    console.log('togglePasswordVisibility called for field:', fieldId);
    const passwordInput = document.getElementById(fieldId);

    if (!passwordInput) {
        console.error('Password input field not found:', fieldId);
        return;
    }
    if (!buttonElement) {
        console.error('Button element not provided to togglePasswordVisibility');
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

    // Recreate the icon element inside the button
    buttonElement.innerHTML = `<i data-lucide="${newIconName}"></i>`;

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        // Lucide will process the new <i> tag within the buttonElement
        window.lucide.createIcons(); 
        console.log(`Lucide icons re-rendered. New icon: ${newIconName}`);
    } else {
        console.warn('Lucide library or createIcons function not available for re-rendering.');
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
