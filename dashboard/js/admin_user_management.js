
async function initializeUserManagementPage() {
    const usersTableContainer = document.getElementById('usersTableContainer');
    const usersPageMessage = document.getElementById('usersPageMessage');
    const TOKEN = localStorage.getItem(window.TOKEN_KEY);
    const currentUserInfo = JSON.parse(localStorage.getItem(window.USER_INFO_KEY));


    // Modal elements
    const userModal = document.getElementById('userModal');
    const userModalTitle = document.getElementById('userModalTitle');
    const closeUserModalBtn = document.getElementById('closeUserModalBtn');
    const cancelUserModalBtn = document.getElementById('cancelUserModalBtn');
    const userForm = document.getElementById('userForm');
    const userFormMessage = document.getElementById('userFormMessage');
    const saveUserBtn = document.getElementById('saveUserBtn');

    // Modal form fields
    const userIdInput = document.getElementById('userId');
    const userFullNameInput = document.getElementById('userFullName');
    const userEmailInput = document.getElementById('userEmail');
    const userRoleSelect = document.getElementById('userRole');
    const userContactNumberInput = document.getElementById('userContactNumber');
    
    const facultyAssistantDetailsDiv = document.getElementById('userFacultyAssistantDetails');
    const userDepartmentFAInput = document.getElementById('userDepartmentFA');
    const userEmployeeIdInput = document.getElementById('userEmployeeId');

    const studentDetailsDiv = document.getElementById('userStudentDetails');
    const userEnrollmentNumberInput = document.getElementById('userEnrollmentNumber');
    const userCourseInput = document.getElementById('userCourse');
    const userSectionInput = document.getElementById('userSection');

    let allUsersData = []; // To store fetched users for editing

    if (!TOKEN) {
        showPageMessage(usersPageMessage, 'Authentication token not found. Please log in.', 'error', 0);
        if (usersTableContainer) usersTableContainer.innerHTML = '<p>Please log in to manage users.</p>';
        return;
    }
    if (!usersTableContainer || !userModal || !userForm) {
        console.error("Required elements for user management page are missing.");
        return;
    }

    async function fetchUsers() {
        if (usersTableContainer) usersTableContainer.innerHTML = '<p>Loading users...</p>';
        try {
            const response = await fetch(`${window.API_BASE_URL}/users`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to fetch users');
            }
            allUsersData = await response.json();
            hideMessage(usersPageMessage);
            return allUsersData;
        } catch (error) {
            console.error('Error fetching users:', error);
            showPageMessage(usersPageMessage, `Error: ${error.message}`, 'error', 0);
            if (usersTableContainer) usersTableContainer.innerHTML = `<p>Could not load users. ${error.message}</p>`;
            return [];
        }
    }

    function toggleRoleSpecificFields(role) {
        facultyAssistantDetailsDiv.style.display = 'none';
        studentDetailsDiv.style.display = 'none';

        if (role === 'faculty' || role === 'assistant') {
            facultyAssistantDetailsDiv.style.display = 'block';
        } else if (role === 'student') {
            studentDetailsDiv.style.display = 'block';
        }
    }

    userRoleSelect.addEventListener('change', function() {
        toggleRoleSpecificFields(this.value);
    });
    
    function openUserModal(user = null) {
        hideMessage(userFormMessage);
        userForm.reset(); // Clear previous form data
        
        if (user) {
            userModalTitle.textContent = 'Edit User';
            userIdInput.value = user.user_id;
            userFullNameInput.value = user.full_name || '';
            userEmailInput.value = user.email || ''; // Email is read-only
            userRoleSelect.value = user.role || '';
            userContactNumberInput.value = user.contact_number || '';

            toggleRoleSpecificFields(user.role); // Show correct fields based on current role

            if (user.role === 'faculty' || user.role === 'assistant') {
                userDepartmentFAInput.value = user.department || '';
                userEmployeeIdInput.value = user.employee_id || '';
            } else if (user.role === 'student') {
                userEnrollmentNumberInput.value = user.enrollment_number || '';
                userCourseInput.value = user.course || '';
                userSectionInput.value = user.section || '';
            }
            saveUserBtn.textContent = 'Save Changes';
        } else {
            // This modal is only for editing, not creating new users via admin UI
            // New users are expected to register via signup.html
            console.error("User modal opened without user data; this modal is for editing only.");
            showPageMessage(usersPageMessage, 'Error: Cannot open edit modal without user data.', 'error');
            return;
        }
        userModal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons();
    }

    function closeUserModal() {
        userModal.style.display = 'none';
    }

    async function handleUserFormSubmit(event) {
        event.preventDefault();
        hideMessage(userFormMessage);
        saveUserBtn.disabled = true;
        saveUserBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin mr-2"></i> Saving...';
        if(window.lucide) window.lucide.createIcons();

        const userId = userIdInput.value;
        const selectedRole = userRoleSelect.value;

        const userData = {
            fullName: userFullNameInput.value.trim(),
            role: selectedRole,
            contactNumber: userContactNumberInput.value.trim() || null,
            // Role-specific fields are added based on selectedRole
            department: (selectedRole === 'faculty' || selectedRole === 'assistant') ? userDepartmentFAInput.value.trim() || null : null,
            employeeId: (selectedRole === 'faculty' || selectedRole === 'assistant') ? userEmployeeIdInput.value.trim() || null : null,
            enrollmentNumber: (selectedRole === 'student') ? userEnrollmentNumberInput.value.trim() || null : null,
            course: (selectedRole === 'student') ? userCourseInput.value.trim() || null : null,
            section: (selectedRole === 'student') ? userSectionInput.value.trim() || null : null,
        };

        if (!userData.fullName || !userData.role) {
            showFormMessage(userFormMessage, 'Full Name and Role are required.', 'error');
            saveUserBtn.disabled = false;
            saveUserBtn.textContent = 'Save Changes';
            return;
        }

        try {
            const response = await fetch(`${window.API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify(userData)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to update user.');
            }
            showPageMessage(usersPageMessage, 'User updated successfully!', 'success');
            closeUserModal();
            loadAndRenderUsers(); // Refresh the table
        } catch (error) {
            console.error('Error updating user:', error);
            showFormMessage(userFormMessage, error.message, 'error');
        } finally {
            saveUserBtn.disabled = false;
            saveUserBtn.textContent = 'Save Changes';
        }
    }

    async function deleteUser(userIdToDelete) {
        if (currentUserInfo && currentUserInfo.userId == userIdToDelete) {
            showPageMessage(usersPageMessage, 'You cannot delete your own account.', 'error', 0);
            return;
        }
        const userToDelete = allUsersData.find(u => u.user_id == userIdToDelete);
        if (userToDelete && confirm(`Are you sure you want to delete user "${userToDelete.full_name}" (${userToDelete.email})? This action cannot be undone.`)) {
            showPageMessage(usersPageMessage, 'Deleting user...', 'loading', 0);
            try {
                const response = await fetch(`${window.API_BASE_URL}/users/${userIdToDelete}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${TOKEN}` }
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || 'Failed to delete user.');
                }
                showPageMessage(usersPageMessage, 'User deleted successfully!', 'success');
                loadAndRenderUsers(); // Refresh table
            } catch (error) {
                console.error('Error deleting user:', error);
                showPageMessage(usersPageMessage, `Error: ${error.message}`, 'error', 0);
            }
        }
    }

    function renderUsersTable(users) {
        if (!usersTableContainer) return;
        usersTableContainer.innerHTML = ''; 

        if (!users || users.length === 0) {
            usersTableContainer.innerHTML = '<p>No users found in the system.</p>';
            showPageMessage(usersPageMessage, 'No users registered yet.', 'info');
            return;
        }

        const table = document.createElement('table');
        table.className = 'styled-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Contact</th>
                    <th>Department</th>
                    <th>Emp/Enroll ID</th>
                    <th>Course/Section</th>
                    <th>Actions</th> 
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.full_name || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${user.role || 'N/A'}</td>
                <td>${user.contact_number || 'N/A'}</td>
                <td>${user.department || 'N/A'}</td>
                <td>${user.employee_id || user.enrollment_number || 'N/A'}</td>
                <td>${(user.course || '') + (user.course && user.section ? ' / ' : '') + (user.section || '') || 'N/A'}</td>
                <td>
                    <button class="button button-small button-outline edit-user-btn" data-id="${user.user_id}" title="Edit User"><i data-lucide="edit-2" class="icon-small"></i> Edit</button>
                    <button class="button button-small button-danger delete-user-btn" data-id="${user.user_id}" title="Delete User" ${currentUserInfo && currentUserInfo.userId == user.user_id ? 'disabled' : ''}><i data-lucide="trash-2" class="icon-small"></i> Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        usersTableContainer.appendChild(table);
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Attach event listeners for edit and delete buttons
        document.querySelectorAll('.edit-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userIdToEdit = e.currentTarget.dataset.id;
                const userToEdit = allUsersData.find(u => u.user_id == userIdToEdit);
                if (userToEdit) openUserModal(userToEdit);
            });
        });

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const userIdToDelete = e.currentTarget.dataset.id;
                deleteUser(userIdToDelete);
            });
        });
    }

    // Event listeners for modal controls
    if (closeUserModalBtn) closeUserModalBtn.addEventListener('click', closeUserModal);
    if (cancelUserModalBtn) cancelUserModalBtn.addEventListener('click', closeUserModal);
    if (userForm) userForm.addEventListener('submit', handleUserFormSubmit);
    if (userModal) {
        userModal.addEventListener('click', (event) => {
            if (event.target === userModal) closeUserModal(); // Close if overlay is clicked
        });
    }
    
    async function loadAndRenderUsers() {
        const users = await fetchUsers();
        renderUsersTable(users);
    }

    // Initial load
    loadAndRenderUsers();
}
