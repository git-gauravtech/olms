
function initializeSignupPage() {
    const signupForm = document.getElementById('signupForm');
    const roleSelect = document.getElementById('role');
    const facultyAssistantDetailsDiv = document.getElementById('facultyAssistantDetails');
    const studentDetailsDiv = document.getElementById('studentDetails');
    const formMessageDiv = document.getElementById('formMessage');

    function showMessage(message, type) {
        formMessageDiv.textContent = message;
        formMessageDiv.className = `form-message ${type}`; // success or error
        formMessageDiv.style.display = 'block';
    }

    function hideMessage() {
        formMessageDiv.style.display = 'none';
    }

    if (roleSelect) {
        roleSelect.addEventListener('change', function() {
            const selectedRole = this.value;
            facultyAssistantDetailsDiv.style.display = 'none';
            studentDetailsDiv.style.display = 'none';

            if (selectedRole === 'faculty' || selectedRole === 'assistant') {
                facultyAssistantDetailsDiv.style.display = 'block';
            } else if (selectedRole === 'student') {
                studentDetailsDiv.style.display = 'block';
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            hideMessage();

            const formData = new FormData(signupForm);
            const data = Object.fromEntries(formData.entries());

            // Consolidate role-specific fields
            const role = data.role;
            if (role === 'faculty' || role === 'assistant') {
                data.department = data.departmentFA; // Use the correct name from HTML
                delete data.departmentFA; 
                // employeeId is already correctly named
            } else if (role === 'student') {
                // enrollmentNumber, course, section are already correctly named
            }
            
            // Remove empty optional fields so backend doesn't try to process them if not provided
            for (const key in data) {
                if (data[key] === '') {
                    delete data[key];
                }
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

// Could add login functions here later e.g. initializeLoginPage()
// Logout function
function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    // Redirect to login page or landing page
    if (window.location.pathname.includes('dashboard')) {
        window.location.href = '../index.html';
    } else {
        window.location.href = 'index.html';
    }
}
