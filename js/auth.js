
function initializeSignupPage() {
    const signupForm = document.getElementById('signupForm');
    const roleSelect = document.getElementById('role');
    const facultyAssistantDetailsDiv = document.getElementById('facultyAssistantDetails');
    const studentDetailsDiv = document.getElementById('studentDetails');
    const formMessageDiv = document.getElementById('formMessage');
    const signupButton = signupForm ? signupForm.querySelector('button[type="submit"]') : null;

    function showMessage(message, type) {
        if (formMessageDiv) {
            formMessageDiv.textContent = message;
            formMessageDiv.className = `form-message ${type}`; // success or error
            formMessageDiv.style.display = 'block';
        }
    }

    function hideMessage() {
        if (formMessageDiv) {
            formMessageDiv.style.display = 'none';
        }
    }

    if (roleSelect) {
        roleSelect.addEventListener('change', function() {
            const selectedRole = this.value;
            if (facultyAssistantDetailsDiv) facultyAssistantDetailsDiv.style.display = 'none';
            if (studentDetailsDiv) studentDetailsDiv.style.display = 'none';

            if (selectedRole === 'faculty' || selectedRole === 'assistant') {
                if (facultyAssistantDetailsDiv) facultyAssistantDetailsDiv.style.display = 'block';
            } else if (selectedRole === 'student') {
                if (studentDetailsDiv) studentDetailsDiv.style.display = 'block';
            }
        });
        // Trigger change event on load if a role is pre-selected (e.g., due to browser back)
        if(roleSelect.value) roleSelect.dispatchEvent(new Event('change'));
    }

    if (signupForm && signupButton) {
        signupForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            hideMessage();

            // Explicitly get each field, using .trim() for strings and || null for optional empty strings
            const fullName = signupForm.elements.fullName ? signupForm.elements.fullName.value.trim() : '';
            const email = signupForm.elements.email ? signupForm.elements.email.value.trim() : '';
            const password = signupForm.elements.password ? signupForm.elements.password.value : '';
            const role = signupForm.elements.role ? signupForm.elements.role.value : '';
            const contactNumber = signupForm.elements.contactNumber ? (signupForm.elements.contactNumber.value.trim() || null) : null;
            
            let department = null;
            let employeeId = null;
            if (role === 'faculty' || role === 'assistant') {
                department = signupForm.elements.departmentFA ? (signupForm.elements.departmentFA.value.trim() || null) : null;
                employeeId = signupForm.elements.employeeId ? (signupForm.elements.employeeId.value.trim() || null) : null;
            }

            let enrollmentNumber = null;
            let course = null;
            let section = null;
            if (role === 'student') {
                enrollmentNumber = signupForm.elements.enrollmentNumber ? (signupForm.elements.enrollmentNumber.value.trim() || null) : null;
                course = signupForm.elements.course ? (signupForm.elements.course.value.trim() || null) : null;
                section = signupForm.elements.section ? (signupForm.elements.section.value.trim() || null) : null;
            }
            
            const signupData = {
                fullName, email, password, role, contactNumber,
                department, employeeId, enrollmentNumber, course, section
            };
            
            if (!signupData.fullName || !signupData.email || !signupData.password || !signupData.role) {
                showMessage('Full Name, Email, Password, and Role are required.', 'error');
                return;
            }
            if (signupData.password.length < 6) {
                 showMessage('Password must be at least 6 characters long.', 'error');
                 return;
            }
            
            const originalButtonText = signupButton.textContent; // Use textContent for buttons without HTML
            signupButton.disabled = true;
            signupButton.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="margin-right: 0.5em; vertical-align: middle;"></i> Signing up...';
            if (window.lucide) window.lucide.createIcons();


            try {
                const response = await fetch(`${window.API_BASE_URL}/auth/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(signupData),
                });

                const result = await response.json();

                if (response.ok) {
                    showMessage(result.message || 'Signup successful! Redirecting to login...', 'success');
                    setTimeout(() => {
                        window.location.href = 'index.html'; // Redirect to login page
                    }, 2000);
                } else {
                    showMessage(result.message || 'Signup failed. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Signup error:', error);
                showMessage('An error occurred during signup. Please try again.', 'error');
            } finally {
                signupButton.disabled = false;
                signupButton.textContent = originalButtonText; // Restore original text
                 // No need to call createIcons again if only text is restored
            }
        });
    }
}

function initializeLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const formMessageDiv = document.getElementById('formMessage');
    const loginButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
    const forgotPasswordLinkExists = document.querySelector('a[href="forgot_password.html"]');


    function showMessage(message, type) {
        if (formMessageDiv) {
            formMessageDiv.textContent = message;
            formMessageDiv.className = `form-message ${type}`;
            formMessageDiv.style.display = 'block';
        }
    }

    function hideMessage() {
        if (formMessageDiv) {
            formMessageDiv.style.display = 'none';
        }
    }

    if (loginForm && loginButton) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            hideMessage();

            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            const originalButtonText = loginButton.textContent;
            loginButton.disabled = true;
            loginButton.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="margin-right: 0.5em; vertical-align: middle;"></i> Logging in...';
            if (window.lucide) window.lucide.createIcons();

            try {
                const response = await fetch(`${window.API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (response.ok && result.token && result.user) {
                    localStorage.setItem(window.TOKEN_KEY, result.token);
                    localStorage.setItem(window.USER_INFO_KEY, JSON.stringify(result.user));
                    
                    const role = result.user.role;
                    if (role === window.USER_ROLES.ADMIN) {
                        window.location.href = 'dashboard/admin.html';
                    } else if (role === window.USER_ROLES.FACULTY) {
                        window.location.href = 'dashboard/faculty.html';
                    } else if (role === window.USER_ROLES.ASSISTANT) {
                        window.location.href = 'dashboard/assistant.html';
                    } else if (role === window.USER_ROLES.STUDENT) {
                        window.location.href = 'dashboard/student.html'; // Changed redirect
                    } else {
                        showMessage('Login successful, but role is unrecognized.', 'error');
                    }
                } else {
                    showMessage(result.message || 'Login failed. Please check your credentials.', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessage('An error occurred during login. Please try again.', 'error');
            } finally {
                loginButton.disabled = false;
                loginButton.textContent = originalButtonText;
            }
        });
    }
    if (loginForm && !forgotPasswordLinkExists) {
        const authSwitchElements = loginForm.parentElement.querySelectorAll('.auth-switch');
        if (authSwitchElements.length > 0) {
            const lastAuthSwitch = authSwitchElements[authSwitchElements.length -1];
            const forgotPasswordP = document.createElement('p');
            forgotPasswordP.className = 'auth-switch';
            forgotPasswordP.style.marginTop = '10px';
            forgotPasswordP.innerHTML = '<a href="forgot_password.html">Forgot Password?</a>';
            lastAuthSwitch.parentNode.insertBefore(forgotPasswordP, lastAuthSwitch.nextSibling);
        }
    }
}

function logout() {
    localStorage.removeItem(window.TOKEN_KEY);
    localStorage.removeItem(window.USER_INFO_KEY);
    const nonAuthPages = ['/index.html', '/signup.html', '/landing.html', '/forgot_password.html', '/reset_password.html'];
    const currentPath = window.location.pathname;
    const onNonAuthPage = nonAuthPages.some(page => currentPath.endsWith(page)) || currentPath === '/' || currentPath === '/index.htm';

    if (onNonAuthPage) {
        // If on root (e.g. "localhost:8080/") and it's not already landing, redirect to landing.
        // Otherwise, if already on a non-auth page, no redirect is strictly needed.
        if ((currentPath === '/' || currentPath === '/index.htm') && !currentPath.endsWith('landing.html')) {
             // window.location.href = '/landing.html'; // Or '/index.html' based on desired public root
        }
    } else if (currentPath.includes('/dashboard/')) {
        window.location.href = '../index.html'; 
    } else {
        window.location.href = 'index.html'; 
    }
}


function initializeForgotPasswordPage() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const emailInput = document.getElementById('email');
    const formMessageDiv = document.getElementById('formMessage');
    const requestResetBtn = document.getElementById('requestResetBtn');

    function showMessage(message, type) {
        if (formMessageDiv) {
            formMessageDiv.textContent = message;
            formMessageDiv.className = `form-message ${type}`;
            formMessageDiv.style.display = 'block';
        }
    }
    function hideMessage() {
        if (formMessageDiv) {
            formMessageDiv.style.display = 'none';
        }
    }

    if (forgotPasswordForm && requestResetBtn) {
        forgotPasswordForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            hideMessage();
            if (!emailInput.value) {
                showMessage('Please enter your email address.', 'error');
                return;
            }
            
            const originalButtonText = requestResetBtn.textContent;
            requestResetBtn.disabled = true;
            requestResetBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="margin-right: 0.5em; vertical-align: middle;"></i> Processing...';
            if (window.lucide) window.lucide.createIcons();

            let responseOk = false;
            try {
                const response = await fetch(`${window.API_BASE_URL}/auth/request-password-reset`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emailInput.value })
                });
                responseOk = response.ok;
                const result = await response.json();
                showMessage(result.message, responseOk ? 'success' : 'error');
                if (responseOk) {
                    forgotPasswordForm.reset();
                    // requestResetBtn.textContent = 'Request Sent'; // Keep disabled as it's sent
                } else {
                     requestResetBtn.disabled = false;
                     requestResetBtn.textContent = originalButtonText;
                }

            } catch (error) {
                console.error('Request password reset error:', error);
                showMessage('An error occurred. Please try again.', 'error');
                requestResetBtn.disabled = false;
                requestResetBtn.textContent = originalButtonText;
            }
        });
    }
}


function initializeResetPasswordPage() {
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    const tokenInput = document.getElementById('resetToken');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
    const formMessageDiv = document.getElementById('formMessage');
    const submitResetBtn = document.getElementById('submitResetBtn');

    function showMessage(message, type) {
        if (formMessageDiv) {
            formMessageDiv.textContent = message;
            formMessageDiv.className = `form-message ${type}`;
            formMessageDiv.style.display = 'block';
        }
    }
     function hideMessage() {
        if (formMessageDiv) {
            formMessageDiv.style.display = 'none';
        }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    if (tokenInput && tokenFromUrl) {
        tokenInput.value = tokenFromUrl;
    } else if (tokenInput && !tokenFromUrl) {
        showMessage('Password reset token not found in URL. Please use the link from your email.', 'error');
        if(submitResetBtn) submitResetBtn.disabled = true;
    }


    if (resetPasswordForm && submitResetBtn) {
        resetPasswordForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            hideMessage();

            const token = tokenInput.value;
            const newPassword = newPasswordInput.value;
            const confirmNewPassword = confirmNewPasswordInput.value;

            if (!token) {
                showMessage('Invalid reset token. Please use the link from your email.', 'error');
                return;
            }
            if (newPassword.length < 6) {
                showMessage('New password must be at least 6 characters long.', 'error');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                showMessage('Passwords do not match.', 'error');
                return;
            }

            const originalButtonText = submitResetBtn.textContent;
            submitResetBtn.disabled = true;
            submitResetBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="margin-right: 0.5em; vertical-align: middle;"></i> Processing...';
            if (window.lucide) window.lucide.createIcons();
            
            try {
                const response = await fetch(`${window.API_BASE_URL}/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, newPassword })
                });
                const result = await response.json();

                if (response.ok) {
                    showMessage(result.message || 'Password reset successfully! You can now login.', 'success');
                    resetPasswordForm.reset(); 
                    // submitResetBtn.textContent = 'Password Reset!'; // Keep disabled
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 3000);
                } else {
                    showMessage(result.message || 'Failed to reset password. The token might be invalid or expired.', 'error');
                    submitResetBtn.disabled = false;
                    submitResetBtn.textContent = originalButtonText;
                }
            } catch (error) {
                console.error('Reset password error:', error);
                showMessage('An error occurred. Please try again.', 'error');
                submitResetBtn.disabled = false;
                submitResetBtn.textContent = originalButtonText;
            }
        });
    }
}
