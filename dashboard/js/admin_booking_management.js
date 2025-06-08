
// Admin Booking Management specific JavaScript

let allFetchedBookings = []; // To store all bookings for editing
let editingBookingId = null; // To track if we are editing or creating

async function initializeAdminBookingPage() {
    const manualBookingForm = document.getElementById('manualBookingForm');
    const bookingFormTitle = document.getElementById('bookingFormTitle');
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
    const cancelEditBookingBtn = document.getElementById('cancelEditBookingBtn');
    const formMessage = document.getElementById('manualBookingFormMessage');
    const editingBookingIdInput = document.getElementById('editingBookingId');


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
                if (lab.is_available) { 
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
                headers: { 'Authorization': `Bearer ${TOKEN}` } 
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
        return new Promise(async (resolve, reject) => {
            if (!sectionSelect) return reject(new Error("Section select element not found"));
            sectionSelect.innerHTML = '<option value="">Loading sections...</option>';
            sectionSelect.disabled = true;
            if (!courseId) {
                sectionSelect.innerHTML = '<option value="">Select a course first or leave blank</option>';
                return resolve();
            }
            try {
                const response = await fetch(`${window.API_BASE_URL}/sections?course_id=${courseId}`, {
                    headers: { 'Authorization': `Bearer ${TOKEN}` } 
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
                resolve();
            } catch (error) {
                console.error('Error fetching sections:', error);
                sectionSelect.innerHTML = '<option value="">Error loading sections</option>';
                reject(error);
            }
        });
    }

    async function fetchAndPopulateFaculty() {
        if (!userSelect) return;
        userSelect.innerHTML = '<option value="">Loading faculty...</option>';
        try {
            const response = await fetch(`${window.API_BASE_URL}/users`, { 
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!response.ok) throw new Error('Failed to fetch users.');
            const users = await response.json();
            userSelect.innerHTML = '<option value="">Assign to Faculty/User (Optional)</option>';
            users.forEach(user => {
                if (user.role === 'faculty') { 
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
            fetchAndPopulateSections(e.target.value).catch(err => console.error("Failed to populate sections on change", err));
        });
    }

    function resetFormToCreateMode() {
        manualBookingForm.reset();
        editingBookingId = null;
        editingBookingIdInput.value = '';
        bookingFormTitle.textContent = 'Book New Lab Slot';
        saveBookingBtn.innerHTML = '<i data-lucide="save" class="mr-2"></i> Create Booking';
        cancelEditBookingBtn.style.display = 'none';
        sectionSelect.innerHTML = '<option value="">Select a course first or leave blank</option>';
        sectionSelect.disabled = true;
        hideMessage(formMessage);
        if(window.lucide) window.lucide.createIcons();
    }
    
    async function populateFormForEdit(booking) {
        hideMessage(formMessage);
        editingBookingId = booking.booking_id;
        editingBookingIdInput.value = booking.booking_id;

        labSelect.value = booking.lab_id;

        if (booking.section_course_id) {
            courseSelectForSection.value = booking.section_course_id;
            await fetchAndPopulateSections(booking.section_course_id);
            sectionSelect.value = booking.section_id || '';
        } else {
            courseSelectForSection.value = '';
            sectionSelect.innerHTML = '<option value="">Select a course first or leave blank</option>';
            sectionSelect.disabled = true;
            sectionSelect.value = '';
        }
        
        userSelect.value = booking.user_id || '';

        if (booking.start_time) {
            const startDate = new Date(booking.start_time);
            dateInput.value = startDate.toISOString().split('T')[0];
            startTimeInput.value = startDate.toTimeString().slice(0,5);
        }
        if (booking.end_time) {
            const endDate = new Date(booking.end_time);
            endTimeInput.value = endDate.toTimeString().slice(0,5);
        }

        purposeInput.value = booking.purpose || '';
        statusSelect.value = booking.status || 'Scheduled';

        bookingFormTitle.textContent = 'Edit Lab Booking';
        saveBookingBtn.innerHTML = '<i data-lucide="save" class="mr-2"></i> Update Booking';
        cancelEditBookingBtn.style.display = 'inline-block';
        if(window.lucide) window.lucide.createIcons();
        window.scrollTo({ top: manualBookingForm.offsetTop - 20, behavior: 'smooth' });
    }


    if (manualBookingForm) {
        manualBookingForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            hideMessage(formMessage);
            if (!saveBookingBtn) return;

            const currentBookingIdBeingEdited = editingBookingIdInput.value;
            const method = currentBookingIdBeingEdited ? 'PUT' : 'POST';
            const url = currentBookingIdBeingEdited 
                ? `${window.API_BASE_URL}/bookings/${currentBookingIdBeingEdited}` 
                : `${window.API_BASE_URL}/bookings`;

            saveBookingBtn.disabled = true;
            saveBookingBtn.innerHTML = `<i data-lucide="loader-2" class="animate-spin mr-2"></i> ${currentBookingIdBeingEdited ? 'Updating' : 'Creating'}...`;
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
                saveBookingBtn.innerHTML = `<i data-lucide="save" class="mr-2"></i> ${currentBookingIdBeingEdited ? 'Update' : 'Create'} Booking`;
                 if(window.lucide) window.lucide.createIcons();
                return;
            }
            if (new Date(`${bookingData.date}T${bookingData.start_time_str}`) >= new Date(`${bookingData.date}T${bookingData.end_time_str}`)) {
                showFormMessage(formMessage, 'End time must be after start time.', 'error');
                saveBookingBtn.disabled = false;
                saveBookingBtn.innerHTML = `<i data-lucide="save" class="mr-2"></i> ${currentBookingIdBeingEdited ? 'Update' : 'Create'} Booking`;
                 if(window.lucide) window.lucide.createIcons();
                return;
            }

            try {
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${TOKEN}`
                    },
                    body: JSON.stringify(bookingData)
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || `Failed to ${currentBookingIdBeingEdited ? 'update' : 'create'} booking.`);
                }
                showFormMessage(formMessage, `Booking ${currentBookingIdBeingEdited ? 'updated' : 'created'} successfully!`, 'success');
                resetFormToCreateMode();
                fetchAndDisplayExistingBookings(); 
            } catch (error) {
                console.error(`Error ${currentBookingIdBeingEdited ? 'updating' : 'creating'} booking:`, error);
                showFormMessage(formMessage, error.message, 'error');
            } finally {
                saveBookingBtn.disabled = false;
                 // Text reset in resetFormToCreateMode or here if error
                if (editingBookingIdInput.value) { // Still in edit mode if error occurred
                     saveBookingBtn.innerHTML = '<i data-lucide="save" class="mr-2"></i> Update Booking';
                } else {
                     saveBookingBtn.innerHTML = '<i data-lucide="save" class="mr-2"></i> Create Booking';
                }
                if(window.lucide) window.lucide.createIcons();
            }
        });
    }

    if(cancelEditBookingBtn) {
        cancelEditBookingBtn.addEventListener('click', resetFormToCreateMode);
    }


    async function fetchBookingsForAdmin() {
        if (!existingBookingsTableContainer || !TOKEN) {
            if (existingBookingsMessage && !TOKEN) showPageMessage(existingBookingsMessage, 'Authentication token not found.', 'error', 0);
            return [];
        }
        showPageMessage(existingBookingsMessage, 'Loading bookings...', 'loading');
        try {
            const response = await fetch(`${window.API_BASE_URL}/bookings`, { 
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to fetch bookings.');
            }
            allFetchedBookings = await response.json(); // Store for editing
            hideMessage(existingBookingsMessage);
            return allFetchedBookings;
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
        bookings.sort((a, b) => new Date(b.start_time) - new Date(a.start_time)); 

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
                    <button class="button button-small button-outline edit-booking-btn" data-id="${booking.booking_id}" title="Edit Booking"><i data-lucide="edit-2" class="icon-small"></i> Edit</button>
                    <button class="button button-small button-danger delete-booking-btn" data-id="${booking.booking_id}" title="Delete Booking"><i data-lucide="trash-2" class="icon-small"></i> Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        existingBookingsTableContainer.appendChild(table);
        if(window.lucide) window.lucide.createIcons();

        document.querySelectorAll('.delete-booking-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const bookingIdToDelete = e.currentTarget.dataset.id;
                const bookingToDelete = allFetchedBookings.find(b => b.booking_id == bookingIdToDelete);
                if (bookingToDelete && confirm(`Are you sure you want to delete the booking for "${bookingToDelete.lab_name}" at ${new Date(bookingToDelete.start_time).toLocaleTimeString()}?`)) {
                    await deleteBooking(bookingIdToDelete);
                }
            });
        });
        
        document.querySelectorAll('.edit-booking-btn').forEach(btn => {
             btn.addEventListener('click', async (e) => {
                const bookingIdToEdit = e.currentTarget.dataset.id;
                const bookingToEdit = allFetchedBookings.find(b => b.booking_id == bookingIdToEdit);
                if (bookingToEdit) {
                    await populateFormForEdit(bookingToEdit);
                } else {
                    showFormMessage(formMessage, 'Could not find booking details to edit.', 'error');
                }
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
            fetchAndDisplayExistingBookings(); 
        } catch (error) {
            console.error('Error deleting booking:', error);
            showPageMessage(existingBookingsMessage, `Error: ${error.message}`, 'error');
        }
    }
    
    async function fetchAndDisplayExistingBookings() {
        const bookings = await fetchBookingsForAdmin();
        renderExistingBookingsTable(bookings);
    }

    // Initial population
    resetFormToCreateMode(); // Ensure form is in create mode initially
    await fetchAndPopulateLabs();
    await fetchAndPopulateCourses(); 
    await fetchAndPopulateFaculty();
    await fetchAndDisplayExistingBookings();
}
