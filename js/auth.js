
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
            const data = Object.fromEntries(formData.entries());
            
            const role = data.role;
            // Consolidate role-specific fields based on current visibility
            // This assumes that if a section is not displayed, its inputs are not relevant
            if (role === 'faculty' || role === 'assistant') {
                 if (facultyAssistantDetailsDiv && facultyAssistantDetailsDiv.style.display !== 'none') {
                    // Only include these if the section is visible
                 } else {
                    delete data.departmentFA; // Use field name from HTML
                    delete data.employeeId;
                 }
            } else if (role === 'student') {
                if (studentDetailsDiv && studentDetailsDiv.style.display !== 'none') {
                    // Only include these if the section is visible
                } else {
                    delete data.enrollmentNumber;
                    delete data.course;
                    delete data.section;
                }
            }
            
            // Remove empty optional fields so backend doesn't try to process them if not provided
            for (const key in data) {
                if (data[key] === '' || data[key] === null) {
                    // Retain core fields even if empty, backend should validate
                    const coreFields = ['fullName', 'email', 'password', 'role'];
                    if (!coreFields.includes(key)) {
                         delete data[key];
                    }
                }
            }
             // Rename departmentFA to department for backend consistency
            if (data.departmentFA) {
                data.department = data.departmentFA;
                delete data.departmentFA;
            }


            try {
                const response = await fetch(`${window.API_BASE_URL}/auth/signup`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
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
                    
                    // Redirect based on role
                    const role = result.user.role;
                    if (role === window.USER_ROLES.ADMIN) {
                        window.location.href = 'dashboard/admin.html';
                    } else if (role === window.USER_ROLES.FACULTY) {
                        window.location.href = 'dashboard/faculty.html';
                    } else if (role === window.USER_ROLES.ASSISTANT) {
                        window.location.href = 'dashboard/assistant.html';
                    } else if (role === window.USER_ROLES.STUDENT) {
                        // For now, students go directly to their bookings page
                        window.location.href = 'dashboard/student_my_bookings.html';
                    } else {
                        // Fallback or error if role is unknown
                        showMessage('Login successful, but role is unrecognized.', 'error');
                        // window.location.href = 'index.html'; // Or a generic dashboard
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
}

// Logout function
function logout() {
    localStorage.removeItem(window.TOKEN_KEY);
    localStorage.removeItem(window.USER_INFO_KEY);
    // Redirect to login page or landing page
    // Check if current page is already index.html or signup.html to avoid loop
    const nonAuthPages = ['/index.html', '/signup.html', '/landing.html'];
    if (nonAuthPages.some(page => window.location.pathname.endsWith(page))) {
         // Already on a non-auth page, no need to redirect further for logout
    } else if (window.location.pathname.includes('/dashboard/')) {
        window.location.href = '../index.html';
    } else {
        window.location.href = 'index.html';
    }
}
