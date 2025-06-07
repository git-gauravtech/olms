
async function initializeLabAvailabilityPage() {
    const bookingsContainer = document.getElementById('labBookingsContainer');
    const bookingsMessage = document.getElementById('labBookingsMessage');

    function showMessage(message, type = 'info') {
        bookingsMessage.textContent = message;
        bookingsMessage.className = `form-message ${type}`;
        bookingsMessage.style.display = 'block';
        if (type !== 'error') { // Keep loading message if it's not an error
             setTimeout(() => { if(bookingsMessage.textContent === message) bookingsMessage.style.display = 'none';}, 3000);
        }
    }

    function hideMessage() {
        bookingsMessage.style.display = 'none';
    }
    
    async function fetchLabBookings() {
        const token = localStorage.getItem(window.TOKEN_KEY);
        if (!token) {
            showMessage('Authentication token not found. Please log in.', 'error');
            bookingsContainer.innerHTML = '<p>Please log in to view lab bookings.</p>';
            // Optionally redirect to login: window.location.href = '../index.html';
            return null;
        }

        try {
            // This endpoint currently returns all bookings if the user is an admin.
            // For other roles, permissions might need adjustment or a different endpoint.
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
            return bookings;
        } catch (error) {
            console.error('Error fetching lab bookings:', error);
            showMessage(error.message || 'Could not load lab bookings.', 'error');
            bookingsContainer.innerHTML = `<p>Error loading bookings. ${error.message || ''}</p>`;
            return null;
        }
    }

    function renderLabBookingsTable(bookings) {
        bookingsContainer.innerHTML = ''; // Clear loading message
        hideMessage();

        if (!bookings || bookings.length === 0) {
            bookingsContainer.innerHTML = '<p>No lab bookings found.</p>';
            showMessage('No lab bookings are currently scheduled.', 'info');
            return;
        }

        const table = document.createElement('table');
        table.className = 'styled-table'; // Add a class for styling

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Lab Name</th>
                <th>Room</th>
                <th>Course</th>
                <th>Section</th>
                <th>Purpose</th>
                <th>Booked By</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
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
                <td>${booking.user_name || 'N/A'}</td>
                <td>${startTime}</td>
                <td>${endTime}</td>
                <td>${booking.status || 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        bookingsContainer.appendChild(table);
    }

    // Initial fetch and render
    const bookings = await fetchLabBookings();
    if (bookings) {
        renderLabBookingsTable(bookings);
    }
}
