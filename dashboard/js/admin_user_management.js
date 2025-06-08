
async function initializeUserManagementPage() {
    const usersTableContainer = document.getElementById('usersTableContainer');
    const usersPageMessage = document.getElementById('usersPageMessage');
    const TOKEN = localStorage.getItem(window.TOKEN_KEY);

    if (!TOKEN) {
        showPageMessage(usersPageMessage, 'Authentication token not found. Please log in.', 'error', 0);
        if (usersTableContainer) usersTableContainer.innerHTML = '<p>Please log in to manage users.</p>';
        return;
    }

    async function fetchUsers() {
        if (usersTableContainer) usersTableContainer.innerHTML = '<p>Loading users...</p>';
        try {
            const response = await fetch(`${window.API_BASE_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`
                }
            });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to fetch users');
            }
            const users = await response.json();
            hideMessage(usersPageMessage);
            return users;
        } catch (error) {
            console.error('Error fetching users:', error);
            showPageMessage(usersPageMessage, `Error: ${error.message}`, 'error', 0);
            if (usersTableContainer) usersTableContainer.innerHTML = `<p>Could not load users. ${error.message}</p>`;
            return [];
        }
    }

    function renderUsersTable(users) {
        if (!usersTableContainer) return;
        usersTableContainer.innerHTML = ''; // Clear loading message

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
                    <th>Employee/Enrollment ID</th>
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
                    <button class="button button-small button-outline" disabled title="Edit User (Coming Soon)"><i data-lucide="edit-2" class="icon-small"></i> Edit</button>
                    <button class="button button-small button-danger" disabled title="Delete User (Coming Soon)"><i data-lucide="trash-2" class="icon-small"></i> Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        usersTableContainer.appendChild(table);
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    const users = await fetchUsers();
    renderUsersTable(users);
}
