
function initializeBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    const labIdSelect = document.getElementById('labId');
    const timeSlotIdSelect = document.getElementById('timeSlotId');
    const equipmentCheckboxesContainer = document.getElementById('equipmentCheckboxes');
    const bookingDateInput = document.getElementById('bookingDate');
    const batchIdentifierGroup = document.getElementById('batchIdentifierGroup');
    const batchIdentifierInput = document.getElementById('batchIdentifier');
    const formSubmissionMessageEl = document.getElementById('formSubmissionMessage'); // Dedicated element for messages
    const checkAvailabilityBtn = document.getElementById('checkAvailabilityBtn');


    const currentUserRole = getCurrentUserRole();
    if (currentUserRole === USER_ROLES.CR) {
        batchIdentifierGroup.style.display = 'block';
        if (batchIdentifierInput) batchIdentifierInput.required = true;
    } else {
         if (batchIdentifierGroup) batchIdentifierGroup.style.display = 'none';
    }

    // Populate Lab select
    MOCK_LABS.forEach(lab => {
        const option = document.createElement('option');
        option.value = lab.id;
        option.textContent = `${lab.name} (Capacity: ${lab.capacity})`;
        labIdSelect.appendChild(option);
    });

    // Populate Time Slot select
    MOCK_TIME_SLOTS.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.id;
        option.textContent = slot.displayTime;
        timeSlotIdSelect.appendChild(option);
    });

    // Populate Equipment checkboxes
    MOCK_EQUIPMENT.filter(eq => eq.status === 'available').forEach(equipment => {
        const div = document.createElement('div');
        div.className = 'flex items-center';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `equip_${equipment.id}`;
        checkbox.value = equipment.id;
        checkbox.name = 'equipment';
        checkbox.className = 'mr-2'; // Ensure this class provides margin if needed

        const label = document.createElement('label');
        label.htmlFor = `equip_${equipment.id}`;
        label.textContent = equipment.name;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        equipmentCheckboxesContainer.appendChild(div);
    });

    // Pre-fill form if query parameters are present (from lab availability grid)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('labId')) labIdSelect.value = urlParams.get('labId');
    if (urlParams.has('date')) bookingDateInput.value = urlParams.get('date');
    if (urlParams.has('timeSlotId')) timeSlotIdSelect.value = urlParams.get('timeSlotId');


    // Set min date for bookingDate to today
    bookingDateInput.min = formatDate(new Date());


    checkAvailabilityBtn.addEventListener('click', () => {
        const labId = labIdSelect.value;
        const date = bookingDateInput.value;
        const timeSlotId = timeSlotIdSelect.value;

        if (!labId || !date || !timeSlotId) {
            showFormSubmissionMessage('Please select lab, date, and time slot to check availability.', true);
            return;
        }

        const existingBooking = MOCK_BOOKINGS.find(b => 
            b.labId === labId && 
            b.date === date && 
            b.timeSlotId === timeSlotId &&
            b.status === 'booked' // Only consider 'booked' as unavailable for this check
        );

        if (existingBooking) {
            showFormSubmissionMessage(`Slot on ${date} at ${MOCK_TIME_SLOTS.find(ts=>ts.id === timeSlotId).displayTime} for ${MOCK_LABS.find(l=>l.id === labId).name} is already BOOKED.`, true);
        } else {
            showFormSubmissionMessage(`Slot appears to be AVAILABLE. Please fill other details and submit.`, false);
        }
    });


    bookingForm.addEventListener('submit', function(event) {
        event.preventDefault();
        clearFormErrors();
        showFormSubmissionMessage('', false); // Clear previous messages

        const labId = labIdSelect.value;
        const bookingDate = bookingDateInput.value;
        const timeSlotId = timeSlotIdSelect.value;
        const purpose = document.getElementById('purpose').value;
        const selectedEquipment = Array.from(document.querySelectorAll('input[name="equipment"]:checked'))
                                     .map(cb => cb.value);
        
        let isValid = true;
        if (!labId) { showError('labIdError', 'Lab selection is required.'); isValid = false; }
        if (!bookingDate) { showError('bookingDateError', 'Date is required.'); isValid = false; }
        if (!timeSlotId) { showError('timeSlotIdError', 'Time slot is required.'); isValid = false; }
        if (!purpose.trim()) { showError('purposeError', 'Purpose is required.'); isValid = false; }

        const batchId = batchIdentifierInput ? batchIdentifierInput.value.trim() : '';
        if (currentUserRole === USER_ROLES.CR && !batchId) {
            showError('batchIdentifierError', 'Batch/Class Name is required for CR bookings.');
            isValid = false;
        }
        
        if (!isValid) return;

        // Simulate availability check again before booking
        const conflictingBooking = MOCK_BOOKINGS.find(b =>
            b.labId === labId &&
            b.date === bookingDate &&
            b.timeSlotId === timeSlotId &&
            b.status === 'booked' 
        );

        if (conflictingBooking) {
            showFormSubmissionMessage(`Booking failed: The selected slot for ${MOCK_LABS.find(l=>l.id === labId).name} on ${bookingDate} at ${MOCK_TIME_SLOTS.find(ts=>ts.id === timeSlotId).displayTime} was booked by someone else. Please try another slot.`, true);
            return;
        }
        
        // Create new booking object
        const newBooking = {
            id: 'b' + (MOCK_BOOKINGS.length + 1) + Date.now(), // Simple unique ID
            labId: labId,
            date: bookingDate,
            timeSlotId: timeSlotId,
            userId: localStorage.getItem('userEmail') || 'current_user', // Get current user ID/email
            purpose: purpose,
            equipmentIds: selectedEquipment,
            status: currentUserRole === USER_ROLES.FACULTY ? 'booked' : 'pending', // Faculty books directly, CR requests are pending
            requestedByRole: currentUserRole,
            batchIdentifier: currentUserRole === USER_ROLES.CR ? batchId : null,
        };

        MOCK_BOOKINGS.push(newBooking);
        saveMockBookings(); // Persist to localStorage (from constants.js)

        const successMessage = currentUserRole === USER_ROLES.FACULTY 
            ? `Booking for ${newBooking.purpose} confirmed successfully!`
            : `Booking request for ${newBooking.purpose} (Status: PENDING) submitted successfully! It needs approval.`;
        showFormSubmissionMessage(successMessage, false);
        
        bookingForm.reset(); 
        if (currentUserRole === USER_ROLES.CR && batchIdentifierInput) {
            batchIdentifierInput.value = '';
        }
        bookingDateInput.min = formatDate(new Date()); 
        // Clear query params to prevent re-filling if user stays on page
        if (history.pushState) {
            const newURL = window.location.pathname; // Or specific page URL
            history.pushState({path:newURL}, '', newURL);
        }
    });

    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block'; // Make sure this is 'block' or as intended by .visible
            errorElement.classList.add('visible'); 
        }
    }

    function clearFormErrors() {
        const errorMessages = bookingForm.querySelectorAll('.error-message');
        errorMessages.forEach(el => {
            if (el.id !== 'formSubmissionMessage') { // Don't clear the general message element here
                el.textContent = '';
                el.style.display = 'none';
                 el.classList.remove('visible');
            }
        });
    }
    
    function showFormSubmissionMessage(message, isError) {
        if (formSubmissionMessageEl) {
            formSubmissionMessageEl.textContent = message;
            formSubmissionMessageEl.style.color = isError ? 'red' : 'green';
            formSubmissionMessageEl.style.display = message ? 'block' : 'none';
            formSubmissionMessageEl.className = isError ? 'error-message visible' : 'success-message visible'; // Assuming you have .success-message
             if (!isError && message) {
                formSubmissionMessageEl.style.color = 'green'; // Explicitly set green for success
            }
        }
    }

}
