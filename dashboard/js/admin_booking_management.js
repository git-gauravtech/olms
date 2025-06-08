
// Admin Booking Management specific JavaScript

async function initializeAdminBookingPage() {
    const manualBookingForm = document.getElementById('manualBookingForm');
    const labSelect = document.getElementById('bookingLabId');
    const courseSelectForSection = document.getElementById('bookingCourseId');
    const sectionSelect = document.getElementById('bookingSectionId');
    const userSelect = document.getElementById('bookingUserId'); // Faculty
    const dateInput = document.getElementById('bookingDate');
    const startTimeInput = document.getElementById('bookingStartTime');
    const endTimeInput = document.getElementById('bookingEndTime');
    const purposeInput = document.getElementById('bookingPurpose');
    const statusSelect = document.getElementById('bookingStatus');
    const saveBookingBtn = document.getElementById('saveBookingBtn');
    const formMessage = document.getElementById('manualBookingFormMessage');

    const existingBookingsTableContainer = document.getElementById('existingBookingsTableContainer');
    const existingBookingsMessage = document.getElementById('existingBookingsMessage');
    
    const TOKEN = localStorage.getItem(window.TOKEN_KEY);

    async function fetchAndPopulateLabs() {
        if (!labSelect) return;
        labSelect.innerHTML = '<option value="">Loading labs...</option>';
        try {
            const response = await fetch(`${window.API_BASE_URL}/labs`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!response.ok) throw new Error('Failed to fetch labs.');
            const labs = await response.json();
            labSelect.innerHTML = '<option value="">Select a Lab *</option>';
            labs.forEach(lab => {
                if (lab.is_available) { // Only show available labs
                    const option = document.createElement('option');
                    option.value = lab.lab_id;
                    option.textContent = `${lab.name} (Room: ${lab.room_number || 'N/A'}, Capacity: ${lab.capacity})`;
                    labSelect.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Error fetching labs:', error);
            labSelect.innerHTML = '<option value="">Error loading labs</option>';
            showFormMessage(formMessage, 'Could not load labs for dropdown.', 'error');
        }
    }

    async function fetchAndPopulateCourses() {
        if (!courseSelectForSection) return;
        courseSelectForSection.innerHTML = '<option value="">Loading courses...</option>';
        try {
            const response = await fetch(`${window.API_BASE_URL}/courses`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` } // Courses are public, but auth doesn't hurt
            });
            if (!response.ok) throw new Error('Failed to fetch courses.');
            const courses = await response.json();
            courseSelectForSection.innerHTML = '<option value="">Select Course (to filter sections)</option>';
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.course_id;
                option.textContent = course.name;
                courseSelectForSection.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching courses for section filter:', error);
            courseSelectForSection.innerHTML = '<option value="">Error loading courses</option>';
        }
    }
    
    async function fetchAndPopulateSections(courseId) {
        if (!sectionSelect) return;
        sectionSelect.innerHTML = '<option value="">Loading sections...</option>';
        sectionSelect.disabled = true;
        if (!courseId) {
            sectionSelect.innerHTML = '<option value="">Select a course first or leave blank</option>';
            return;
        }
        try {
            const response = await fetch(`${window.API_BASE_URL}/sections?course_id=${courseId}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` } // Sections by course are public too
            });
            if (!response.ok) throw new Error('Failed to fetch sections for the selected course.');
            const sections = await response.json();
            sectionSelect.innerHTML = '<option value="">Select a Section (Optional)</option>';
            if (sections.length === 0) {
                sectionSelect.innerHTML = '<option value="">No sections for this course</option>';
            } else {
                sections.forEach(section => {
                    const option = document.createElement('option');
                    option.value = section.section_id;
                    option.textContent = `${section.name} (Sem: ${section.semester}, Year: ${section.year})`;
                    sectionSelect.appendChild(option);
                });
            }
            sectionSelect.disabled = false;
        } catch (error) {
            console.error('Error fetching sections:', error);
            sectionSelect.innerHTML = '<option value="">Error loading sections</option>';
        }
    }

    async function fetchAndPopulateFaculty() {
        if (!userSelect) return;
        userSelect.innerHTML = '<option value="">Loading faculty...</option>';
        try {
            const response = await fetch(`${window.API_BASE_URL}/users`, { // Fetches all users
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!response.ok) throw new Error('Failed to fetch users.');
            const users = await response.json();
            userSelect.innerHTML = '<option value="">Assign to Faculty/User (Optional)</option>';
            users.forEach(user => {
                if (user.role === 'faculty') { // Filter for faculty members
                    const option = document.createElement('option');
                    option.value = user.user_id;
                    option.textContent = `${user.full_name} (${user.email})`;
                    userSelect.appendChild(option);
                }
            });
        } catch (error) {
            console.error('Error fetching faculty:', error);
            userSelect.innerHTML = '<option value="">Error loading faculty</option>';
        }
    }

    if (courseSelectForSection) {
        courseSelectForSection.addEventListener('change', (e) => {
            fetchAndPopulateSections(e.target.value);
        });
    }
    
    if (manualBookingForm) {
        manualBookingForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage(formMessage);
            if (!saveBookingBtn) return;

            saveBookingBtn.disabled = true;
            saveBookingBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin mr-2"></i> Creating...';
            if(window.lucide) window.lucide.createIcons();

            const bookingData = {
                lab_id: labSelect.value,
                user_id: userSelect.value || null,
                section_id: sectionSelect.value || null,
                date: dateInput.value,
                start_time_str: startTimeInput.value,
                end_time_str: endTimeInput.value,
                purpose: purposeInput.value.trim() || null,
                status: statusSelect.value
            };

            if (!bookingData.lab_id || !bookingData.date || !bookingData.start_time_str || !bookingData.end_time_str) {
                showFormMessage(formMessage, 'Lab, Date, Start Time, and End Time are required.', 'error');
                saveBookingBtn.disabled = false;
                saveBookingBtn.innerHTML = '<i data-lucide="save" class="mr-2"></i> Create Booking';
                if(window.lucide) window.lucide.createIcons();
                return;
            }
            if (new Date(`${bookingData.date}T${bookingData.start_time_str}`) >= new Date(`${bookingData.date}T${bookingData.end_time_str}`)) {
                showFormMessage(formMessage, 'End time must be after start time.', 'error');
                saveBookingBtn.disabled = false;
                saveBookingBtn.innerHTML = '<i data-lucide="save" class="mr-2"></i> Create Booking';
                 if(window.lucide) window.lucide.createIcons();
                return;
            }

            try {
                const response = await fetch(`${window.API_BASE_URL}/bookings`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${TOKEN}`
                    },
                    body: JSON.stringify(bookingData)
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || 'Failed to create booking.');
                }
                showFormMessage(formMessage, 'Booking created successfully!', 'success');
                manualBookingForm.reset(); // Reset form
                sectionSelect.innerHTML = '<option value="">Select a course first or leave blank</option>'; // Reset section select
                sectionSelect.disabled = true;
                fetchAndDisplayExistingBookings(); // Refresh the list of bookings
            } catch (error) {
                console.error('Error creating booking:', error);
                showFormMessage(formMessage, error.message, 'error');
            } finally {
                saveBookingBtn.disabled = false;
                saveBookingBtn.innerHTML = '<i data-lucide="save" class="mr-2"></i> Create Booking';
                if(window.lucide) window.lucide.createIcons();
            }
        });
    }

    // --- Functions to display and manage existing bookings ---
    async function fetchBookingsForAdmin() {
        if (!existingBookingsTableContainer || !TOKEN) {
            if (existingBookingsMessage && !TOKEN) showPageMessage(existingBookingsMessage, 'Authentication token not found.', 'error', 0);
            return [];
        }
        showPageMessage(existingBookingsMessage, 'Loading bookings...', 'loading');
        try {
            const response = await fetch(`${window.API_BASE_URL}/bookings`, { // Admin gets all bookings
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to fetch bookings.');
            }
            const bookings = await response.json();
            hideMessage(existingBookingsMessage);
            return bookings;
        } catch (error) {
            console.error('Error fetching bookings for admin:', error);
            showPageMessage(existingBookingsMessage, `Error fetching bookings: ${error.message}`, 'error');
            if(existingBookingsTableContainer) existingBookingsTableContainer.innerHTML = '<p>Could not load bookings.</p>';
            return [];
        }
    }

    function renderExistingBookingsTable(bookings) {
        if (!existingBookingsTableContainer) return;
        existingBookingsTableContainer.innerHTML = '';
        if (!bookings || bookings.length === 0) {
            existingBookingsTableContainer.innerHTML = '<p>No bookings found.</p>';
            return;
        }
        const table = document.createElement('table');
        table.className = 'styled-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Lab Name</th>
                    <th>Booked By</th>
                    <th>Section</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        bookings.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)); // Show recent first

        bookings.forEach(booking => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${booking.lab_name || 'N/A'}</td>
                <td>${booking.user_name || 'N/A'}</td>
                <td>${booking.course_name ? `${booking.course_name} - ${booking.section_name}` : (booking.section_name || 'N/A')}</td>
                <td>${new Date(booking.start_time).toLocaleString()}</td>
                <td>${new Date(booking.end_time).toLocaleString()}</td>
                <td>${booking.purpose || 'N/A'}</td>
                <td>${booking.status || 'N/A'}</td>
                <td>
                    <button class="button button-small button-outline edit-booking-btn" data-id="${booking.booking_id}" title="Edit Booking (Coming Soon)" disabled><i data-lucide="edit-2" class="icon-small"></i> Edit</button>
                    <button class="button button-small button-danger delete-booking-btn" data-id="${booking.booking_id}" title="Delete Booking"><i data-lucide="trash-2" class="icon-small"></i> Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        existingBookingsTableContainer.appendChild(table);
        if(window.lucide) window.lucide.createIcons();

        // Add event listeners for delete buttons
        document.querySelectorAll('.delete-booking-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const bookingId = e.currentTarget.dataset.id;
                const bookingToDelete = bookings.find(b => b.booking_id == bookingId);
                if (bookingToDelete && confirm(`Are you sure you want to delete the booking for "${bookingToDelete.lab_name}" at ${new Date(bookingToDelete.start_time).toLocaleTimeString()}?`)) {
                    await deleteBooking(bookingId);
                }
            });
        });
        
        // Placeholder for edit functionality
        document.querySelectorAll('.edit-booking-btn').forEach(btn => {
             btn.addEventListener('click', (e) => {
                alert('Edit booking functionality is coming soon!');
             });
        });
    }

    async function deleteBooking(bookingId) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/bookings/${bookingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete booking.');
            }
            showPageMessage(existingBookingsMessage, 'Booking deleted successfully!', 'success');
            fetchAndDisplayExistingBookings(); // Refresh list
        } catch (error) {
            console.error('Error deleting booking:', error);
            showPageMessage(existingBookingsMessage, `Error: ${error.message}`, 'error');
        }
    }
    
    async function fetchAndDisplayExistingBookings() {
        const bookings = await fetchBookingsForAdmin();
        renderExistingBookingsTable(bookings);
    }

    // Initial population of dropdowns and existing bookings
    await fetchAndPopulateLabs();
    await fetchAndPopulateCourses(); // For section filter
    await fetchAndPopulateFaculty();
    await fetchAndDisplayExistingBookings();
}
