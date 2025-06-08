
async function initializeLabAvailabilityPage() {
    const bookingsContainer = document.getElementById('labBookingsContainer');
    const bookingsMessage = document.getElementById('labBookingsMessage');
    
    async function fetchLabBookings() {
        const token = localStorage.getItem(window.TOKEN_KEY);
        if (!token) {
            showPageMessage(bookingsMessage, 'Authentication token not found. Please log in.', 'error', 0);
            if(bookingsContainer) bookingsContainer.innerHTML = '<p>Please log in to view lab bookings.</p>';
            return null;
        }
        showPageMessage(bookingsMessage, 'Loading lab bookings...', 'loading');
        try {
            // Admin view gets all bookings by default from this endpoint
            const response = await fetch(`${window.API_BASE_URL}/bookings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || `Failed to fetch lab bookings: ${response.statusText}`);
            }
            const bookings = await response.json();
            hideMessage(bookingsMessage);
            return bookings;
        } catch (error) {
            console.error('Error fetching lab bookings:', error);
            showPageMessage(bookingsMessage, error.message || 'Could not load lab bookings.', 'error', 0);
            if(bookingsContainer) bookingsContainer.innerHTML = `<p>Error loading bookings. ${error.message || ''}</p>`;
            return null;
        }
    }

    function renderLabBookingsTable(bookings) {
        if(!bookingsContainer) return;
        bookingsContainer.innerHTML = ''; 
        hideMessage(bookingsMessage);

        if (!bookings || bookings.length === 0) {
            bookingsContainer.innerHTML = '<p>No lab bookings found.</p>';
            showPageMessage(bookingsMessage, 'No lab bookings are currently scheduled.', 'info');
            return;
        }

        const table = document.createElement('table');
        table.className = 'styled-table'; 

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Lab Name</th>
                <th>Room</th>
                <th>Course</th>
                <th>Section</th>
                <th>Purpose</th>
                <th>Booked By (Faculty)</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        bookings.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)); // Show newest first

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
                <td>${booking.user_name || 'N/A (System/Admin Booking)'}</td>
                <td>${startTime}</td>
                <td>${endTime}</td>
                <td>${booking.status || 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        bookingsContainer.appendChild(table);
        if(window.lucide) window.lucide.createIcons();
    }

    // Ensure this page is only for admins as it fetches ALL bookings
    const userInfo = JSON.parse(localStorage.getItem(window.USER_INFO_KEY));
    if (!userInfo || userInfo.role !== window.USER_ROLES.ADMIN) {
        if(bookingsContainer) bookingsContainer.innerHTML = '<p>Access Denied. This view is for Admins only.</p>';
        showPageMessage(bookingsMessage, 'Access Denied.', 'error', 0);
        // Redirect or further lock down UI if necessary
        return;
    }

    const bookings = await fetchLabBookings();
    if (bookings) {
        renderLabBookingsTable(bookings);
    }
}
