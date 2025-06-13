
function initializeSignupPage() {
    const signupForm = document.getElementById('signupForm');
    const roleSelect = document.getElementById('role');
    const facultyAssistantDetailsDiv = document.getElementById('facultyAssistantDetails');
    const studentDetailsDiv = document.getElementById('studentDetails');
    const formMessageDiv = document.getElementById('formMessage');

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

    if (signupForm) {
        signupForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            hideMessage();

            const formData = new FormData(signupForm);
            
            // Prepare data explicitly, sending null for empty optional fields
            const signupData = {
                fullName: formData.get('fullName').trim(),
                email: formData.get('email').trim(),
                password: formData.get('password'), // Passwords should not be trimmed by frontend
                role: formData.get('role'),
                contactNumber: formData.get('contactNumber').trim() || null,
            };

            const selectedRole = signupData.role;
            if (selectedRole === 'faculty' || selectedRole === 'assistant') {
                signupData.department = formData.get('departmentFA').trim() || null;
                signupData.employeeId = formData.get('employeeId').trim() || null;
            } else if (selectedRole === 'student') {
                signupData.enrollmentNumber = formData.get('enrollmentNumber').trim() || null;
                signupData.course = formData.get('course').trim() || null;
                signupData.section = formData.get('section').trim() || null;
            }
            
            // Basic client-side validation for required fields
            if (!signupData.fullName || !signupData.email || !signupData.password || !signupData.role) {
                showMessage('Full Name, Email, Password, and Role are required.', 'error');
                return;
            }
            if (signupData.password.length < 6) {
                 showMessage('Password must be at least 6 characters long.', 'error');
                 return;
            }


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
            }
        });
    }
}

function initializeLoginPage() {
    const loginForm = document.getElementById('loginForm');
    const formMessageDiv = document.getElementById('formMessage');
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

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            hideMessage();

            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

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
                        window.location.href = 'dashboard/student_my_bookings.html';
                    } else {
                        showMessage('Login successful, but role is unrecognized.', 'error');
                    }
                } else {
                    showMessage(result.message || 'Login failed. Please check your credentials.', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessage('An error occurred during login. Please try again.', 'error');
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
    if (nonAuthPages.some(page => window.location.pathname.endsWith(page))) {
    } else if (window.location.pathname.includes('/dashboard/')) {
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

    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            hideMessage();
            if (!emailInput.value) {
                showMessage('Please enter your email address.', 'error');
                return;
            }
            
            requestResetBtn.disabled = true;
            requestResetBtn.textContent = 'Processing...';

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
                    requestResetBtn.textContent = 'Request Sent';
                } else {
                     requestResetBtn.textContent = 'Request Password Reset';
                }

            } catch (error) {
                console.error('Request password reset error:', error);
                showMessage('An error occurred. Please try again.', 'error');
                requestResetBtn.textContent = 'Request Password Reset';
            } finally {
                if(!responseOk) requestResetBtn.disabled = false;
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


    if (resetPasswordForm) {
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

            if(submitResetBtn) {
                submitResetBtn.disabled = true;
                submitResetBtn.textContent = 'Processing...';
            }
            
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
                    if(submitResetBtn) submitResetBtn.textContent = 'Password Reset!';
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 3000);
                } else {
                    showMessage(result.message || 'Failed to reset password. The token might be invalid or expired.', 'error');
                    if(submitResetBtn) {
                        submitResetBtn.disabled = false;
                        submitResetBtn.textContent = 'Reset Password';
                    }
                }
            } catch (error) {
                console.error('Reset password error:', error);
                showMessage('An error occurred. Please try again.', 'error');
                if(submitResetBtn) {
                    submitResetBtn.disabled = false;
                    submitResetBtn.textContent = 'Reset Password';
                }
            }
        });
    }
}
