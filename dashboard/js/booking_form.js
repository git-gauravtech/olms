
function initializeBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    const labIdSelect = document.getElementById('labId');
    const timeSlotIdSelect = document.getElementById('timeSlotId');
    const equipmentCheckboxesContainer = document.getElementById('equipmentCheckboxes');
    const bookingDateInput = document.getElementById('bookingDate');
    const batchIdentifierGroup = document.getElementById('batchIdentifierGroup');
    const batchIdentifierInput = document.getElementById('batchIdentifier');
    const formSubmissionMessageEl = document.getElementById('formSubmissionMessage'); 
    const checkAvailabilityBtn = document.getElementById('checkAvailabilityBtn');


    const currentUserRole = getCurrentUserRole();
    if (currentUserRole === USER_ROLES.ASSISTANT) { // Changed from CR
        if (batchIdentifierGroup) batchIdentifierGroup.style.display = 'block'; 
        if (batchIdentifierInput) batchIdentifierInput.required = true;
    } else {
         if (batchIdentifierGroup) batchIdentifierGroup.style.display = 'none';
    }

    if (labIdSelect) {
        MOCK_LABS.forEach(lab => {
            const option = document.createElement('option');
            option.value = lab.id;
            option.textContent = `${lab.name} (Capacity: ${lab.capacity})`;
            labIdSelect.appendChild(option);
        });
    }

    if (timeSlotIdSelect) {
        MOCK_TIME_SLOTS.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.id;
            option.textContent = slot.displayTime;
            timeSlotIdSelect.appendChild(option);
        });
    }

    if (equipmentCheckboxesContainer) {
        equipmentCheckboxesContainer.innerHTML = ''; 
        MOCK_EQUIPMENT.filter(eq => eq.status === 'available').forEach(equipment => {
            const div = document.createElement('div');
            div.className = 'flex items-center';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `equip_${equipment.id}`;
            checkbox.value = equipment.id;
            checkbox.name = 'equipment';
            checkbox.className = 'mr-2';

            const label = document.createElement('label');
            label.htmlFor = `equip_${equipment.id}`;
            label.textContent = equipment.name;
            
            div.appendChild(checkbox);
            div.appendChild(label);
            equipmentCheckboxesContainer.appendChild(div);
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (labIdSelect && urlParams.has('labId')) labIdSelect.value = urlParams.get('labId');
    if (bookingDateInput && urlParams.has('date')) bookingDateInput.value = urlParams.get('date');
    if (timeSlotIdSelect && urlParams.has('timeSlotId')) timeSlotIdSelect.value = urlParams.get('timeSlotId');


    if (bookingDateInput) {
      bookingDateInput.min = formatDate(new Date());
    }


    if (checkAvailabilityBtn) {
        checkAvailabilityBtn.addEventListener('click', () => {
            if (!labIdSelect || !bookingDateInput || !timeSlotIdSelect) return;
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
                b.status === 'booked' 
            );

            if (existingBooking) {
                showFormSubmissionMessage(`Slot on ${date} at ${MOCK_TIME_SLOTS.find(ts=>ts.id === timeSlotId).displayTime} for ${MOCK_LABS.find(l=>l.id === labId).name} is already BOOKED.`, true);
            } else {
                showFormSubmissionMessage(`Slot appears to be AVAILABLE. Please fill other details and submit.`, false);
            }
        });
    }


    if (bookingForm) {
        bookingForm.addEventListener('submit', function(event) {
            event.preventDefault();
            clearFormErrors();
            showFormSubmissionMessage('', false); 

            if (!labIdSelect || !bookingDateInput || !timeSlotIdSelect) return;

            const labId = labIdSelect.value;
            const bookingDate = bookingDateInput.value;
            const timeSlotId = timeSlotIdSelect.value;
            const purposeInput = document.getElementById('purpose');
            const purpose = purposeInput ? purposeInput.value : '';
            const selectedEquipment = Array.from(document.querySelectorAll('input[name="equipment"]:checked'))
                                         .map(cb => cb.value);
            
            let isValid = true;
            if (!labId) { showError('labIdError', 'Lab selection is required.'); isValid = false; }
            if (!bookingDate) { showError('bookingDateError', 'Date is required.'); isValid = false; }
            if (!timeSlotId) { showError('timeSlotIdError', 'Time slot is required.'); isValid = false; }
            if (!purpose.trim()) { showError('purposeError', 'Purpose is required.'); isValid = false; }

            const batchId = batchIdentifierInput ? batchIdentifierInput.value.trim() : '';
            if (currentUserRole === USER_ROLES.ASSISTANT && !batchId) { // Changed from CR
                showError('batchIdentifierError', 'Batch/Class Name is required for Assistant bookings.');
                isValid = false;
            }
            
            if (!isValid) return;

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
            
            const newBooking = {
                id: 'b' + (MOCK_BOOKINGS.length + 1) + Date.now(), 
                labId: labId,
                date: bookingDate,
                timeSlotId: timeSlotId,
                userId: localStorage.getItem('userEmail') || 'current_user', 
                purpose: purpose,
                equipmentIds: selectedEquipment,
                status: currentUserRole === USER_ROLES.FACULTY ? 'booked' : 'pending', 
                requestedByRole: currentUserRole,
                batchIdentifier: currentUserRole === USER_ROLES.ASSISTANT ? batchId : null, // Changed from CR
            };

            MOCK_BOOKINGS.push(newBooking);
            saveMockBookings(); 

            const successMessage = currentUserRole === USER_ROLES.FACULTY 
                ? `Booking for ${newBooking.purpose} confirmed successfully!`
                : `Booking request for ${newBooking.purpose} (Status: PENDING) submitted successfully! It needs approval.`;
            showFormSubmissionMessage(successMessage, false);
            
            bookingForm.reset(); 
            if (currentUserRole === USER_ROLES.ASSISTANT && batchIdentifierInput) { // Changed from CR
                batchIdentifierInput.value = ''; 
            }
            if (bookingDateInput) bookingDateInput.min = formatDate(new Date()); 
            if (history.pushState) {
                const newURL = window.location.pathname; 
                history.pushState({path:newURL}, '', newURL);
            }
        });
    }

    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block'; 
            errorElement.classList.add('visible'); 
        }
    }

    function clearFormErrors() {
      if(bookingForm){
        const errorMessages = bookingForm.querySelectorAll('.error-message');
        errorMessages.forEach(el => {
            if (el.id !== 'formSubmissionMessage') { 
                el.textContent = '';
                el.style.display = 'none';
                el.classList.remove('visible');
            }
        });
      }
    }
    
    function showFormSubmissionMessage(message, isError) {
        if (formSubmissionMessageEl) {
            formSubmissionMessageEl.textContent = message; 
            if (message) { 
                formSubmissionMessageEl.style.color = isError ? 'red' : 'green';
                formSubmissionMessageEl.className = isError ? 'error-message visible' : 'success-message visible';
                formSubmissionMessageEl.style.display = 'block';
            } else { 
                formSubmissionMessageEl.style.display = 'none';
                formSubmissionMessageEl.textContent = ''; 
            }
        }
    }
}
