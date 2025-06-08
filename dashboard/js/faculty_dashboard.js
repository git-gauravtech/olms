
async function initializeFacultyBookingsPage() {
    const bookingsContainer = document.getElementById('facultyBookingsContainer');
    const bookingsMessage = document.getElementById('facultyBookingsMessage');
    const TOKEN = localStorage.getItem(window.TOKEN_KEY);
    const userInfo = JSON.parse(localStorage.getItem(window.USER_INFO_KEY));

    // Modal elements for faculty request
    const facultyRequestModal = document.getElementById('facultyRequestChangeModal');
    const closeFacultyRequestModalBtn = document.getElementById('closeFacultyRequestModalBtn');
    const cancelFacultyRequestModalBtn = document.getElementById('cancelFacultyRequestModalBtn');
    const facultyRequestForm = document.getElementById('facultyRequestChangeForm');
    const originalBookingDetailsSpan = document.getElementById('originalBookingDetails');
    const requestBookingIdInput = document.getElementById('requestBookingId');
    const requestedChangeDetailsInput = document.getElementById('requestedChangeDetails');
    const reasonForChangeInput = document.getElementById('reasonForChange');
    const facultyRequestFormMessage = document.getElementById('facultyRequestFormMessage');
    const submitFacultyRequestBtn = document.getElementById('submitFacultyRequestBtn');


    if (!TOKEN || !userInfo || !userInfo.userId) {
        showPageMessage(bookingsMessage, 'Authentication error. Please log in again.', 'error', 0);
        if(bookingsContainer) bookingsContainer.innerHTML = '<p>Unable to load bookings due to authentication issues.</p>';
        return;
    }
    if (!facultyRequestModal || !facultyRequestForm) {
        console.error("Faculty request modal elements are missing.");
        showPageMessage(bookingsMessage, 'Error: Page components for requesting changes are missing.', 'error', 0);
        // Disable request functionality if modal is not found
    }


    async function fetchMyBookings() {
        showPageMessage(bookingsMessage, 'Loading your bookings...', 'loading');
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
            showPageMessage(bookingsMessage, `Error: ${error.message}`, 'error', 0);
            if(bookingsContainer) bookingsContainer.innerHTML = `<p>Could not load your bookings. ${error.message}</p>`;
            return [];
        }
    }

    function openRequestChangeModal(booking) {
        if (!facultyRequestModal || !originalBookingDetailsSpan || !requestBookingIdInput) return;
        
        originalBookingDetailsSpan.textContent = 
            `${booking.lab_name} (Room: ${booking.room_number || 'N/A'}) ` +
            `on ${new Date(booking.start_time).toLocaleDateString()} ` +
            `from ${new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ` +
            `to ${new Date(booking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. ` +
            `Course: ${booking.course_name || 'N/A'}, Section: ${booking.section_name || 'N/A'}.`;
        
        requestBookingIdInput.value = booking.booking_id;
        facultyRequestForm.reset(); // Reset textarea fields
        requestedChangeDetailsInput.value = ''; // Explicitly clear textareas
        reasonForChangeInput.value = '';      // Explicitly clear textareas
        hideMessage(facultyRequestFormMessage);
        facultyRequestModal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons(); // Re-render icons if any in modal
    }

    function closeRequestChangeModal() {
        if (facultyRequestModal) facultyRequestModal.style.display = 'none';
    }


    function renderBookingsTable(bookings) {
        if (!bookingsContainer) return;
        bookingsContainer.innerHTML = ''; 

        if (!bookings || bookings.length === 0) {
            showPageMessage(bookingsMessage, 'You have no bookings scheduled at the moment.', 'info');
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
        bookings.sort((a,b) => new Date(a.start_time) - new Date(b.start_time)); // Sort by upcoming

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
                    <button class="button button-small button-outline request-change-btn" data-booking-id="${booking.booking_id}">
                        <i data-lucide="edit-3" class="icon-small"></i> Request Change
                    </button>
                </td>
            `;
            tbody.appendChild(tr);

            const requestChangeBtn = tr.querySelector('.request-change-btn');
            if(requestChangeBtn) {
                requestChangeBtn.addEventListener('click', () => {
                    // Find the full booking object to pass to the modal function
                    const fullBookingDetails = bookings.find(b => b.booking_id == booking.booking_id);
                    if(fullBookingDetails) openRequestChangeModal(fullBookingDetails);
                });
            }
        });
        bookingsContainer.appendChild(table);
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
    
    if (facultyRequestForm && submitFacultyRequestBtn) {
        facultyRequestForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage(facultyRequestFormMessage);

            const booking_id = requestBookingIdInput.value;
            const requested_change_details = requestedChangeDetailsInput.value.trim();
            const reason = reasonForChangeInput.value.trim();

            if (!requested_change_details || !reason) {
                showFormMessage(facultyRequestFormMessage, 'Please provide details for the requested change and the reason.', 'error');
                return;
            }

            submitFacultyRequestBtn.disabled = true;
            submitFacultyRequestBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin mr-2"></i> Submitting...';
            if(window.lucide) window.lucide.createIcons();

            try {
                const response = await fetch(`${window.API_BASE_URL}/faculty-requests`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${TOKEN}`
                    },
                    body: JSON.stringify({ booking_id, requested_change_details, reason })
                });
                const result = await response.json();

                if (response.ok) {
                    showFormMessage(facultyRequestFormMessage, 'Change request submitted successfully!', 'success');
                    setTimeout(() => {
                        closeRequestChangeModal();
                        // Optionally, refresh bookings or update UI to show request is pending
                         fetchMyBookings().then(updatedBookings => {
                            if (updatedBookings) renderBookingsTable(updatedBookings);
                        });
                    }, 1500);
                } else {
                    showFormMessage(facultyRequestFormMessage, result.message || 'Failed to submit request.', 'error');
                }

            } catch (error) {
                console.error('Error submitting faculty request:', error);
                showFormMessage(facultyRequestFormMessage, 'An unexpected error occurred.', 'error');
            } finally {
                submitFacultyRequestBtn.disabled = false;
                submitFacultyRequestBtn.innerHTML = 'Submit Request';
            }
        });
    }

    if (closeFacultyRequestModalBtn) closeFacultyRequestModalBtn.addEventListener('click', closeRequestChangeModal);
    if (cancelFacultyRequestModalBtn) cancelFacultyRequestModalBtn.addEventListener('click', closeRequestChangeModal);
    if (facultyRequestModal) {
         facultyRequestModal.addEventListener('click', (event) => {
            if (event.target === facultyRequestModal) { // Click on overlay
                closeRequestChangeModal();
            }
        });
    }

    const myBookings = await fetchMyBookings();
    if (myBookings) {
        renderBookingsTable(myBookings);
    }
}
