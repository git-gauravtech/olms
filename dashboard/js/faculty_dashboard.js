
async function initializeFacultyBookingsPage() {
    const bookingsContainer = document.getElementById('facultyBookingsContainer');
    const bookingsMessage = document.getElementById('facultyBookingsMessage');
    const TOKEN = localStorage.getItem(window.TOKEN_KEY);
    const userInfo = JSON.parse(localStorage.getItem(window.USER_INFO_KEY));

    function showMessage(element, message, type = 'info') {
        if (!element) return;
        element.textContent = message;
        element.className = `form-message ${type}`;
        element.style.display = 'block';
        if (type !== 'error' && type !== 'loading') { // Persist error/loading messages
             setTimeout(() => { if(element.textContent === message) element.style.display = 'none';}, 3000);
        }
    }
    
    function hideMessage(element) {
        if (!element) return;
        element.style.display = 'none';
    }

    if (!TOKEN || !userInfo || !userInfo.userId) {
        showMessage(bookingsMessage, 'Authentication error. Please log in again.', 'error');
        if(bookingsContainer) bookingsContainer.innerHTML = '<p>Unable to load bookings due to authentication issues.</p>';
        return;
    }

    async function fetchMyBookings() {
        showMessage(bookingsMessage, 'Loading your bookings...', 'loading');
        try {
            const response = await fetch(`${window.API_BASE_URL}/bookings/my`, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`
                }
            });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to fetch your bookings');
            }
            const bookings = await response.json();
            hideMessage(bookingsMessage);
            return bookings;
        } catch (error) {
            console.error('Error fetching faculty bookings:', error);
            showMessage(bookingsMessage, `Error: ${error.message}`, 'error');
            if(bookingsContainer) bookingsContainer.innerHTML = `<p>Could not load your bookings. ${error.message}</p>`;
            return [];
        }
    }

    function renderBookingsTable(bookings) {
        if (!bookingsContainer) return;
        bookingsContainer.innerHTML = ''; // Clear loading message

        if (!bookings || bookings.length === 0) {
            showMessage(bookingsMessage, 'You have no bookings scheduled at the moment.', 'info');
            bookingsContainer.innerHTML = '<p>No bookings found.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'styled-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Lab Name</th>
                    <th>Room</th>
                    <th>Course</th>
                    <th>Section</th>
                    <th>Purpose</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        bookings.forEach(booking => {
            const tr = document.createElement('tr');
            const startTime = new Date(booking.start_time).toLocaleString();
            const endTime = new Date(booking.end_time).toLocaleString();
            
            tr.innerHTML = `
                <td>${booking.lab_name || 'N/A'}</td>
                <td>${booking.room_number || 'N/A'}</td>
                <td>${booking.course_name || 'N/A'}</td>
                <td>${booking.section_name || 'N/A'}</td>
                <td>${booking.purpose || 'N/A'}</td>
                <td>${startTime}</td>
                <td>${endTime}</td>
                <td>${booking.status || 'Scheduled'}</td>
                <td>
                    <button class="button button-small button-outline" disabled title="Request change (coming soon)">
                        <i data-lucide="edit-3" class="icon-small"></i> Request Change
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        bookingsContainer.appendChild(table);
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    const myBookings = await fetchMyBookings();
    if (myBookings) {
        renderBookingsTable(myBookings);
    }
}
