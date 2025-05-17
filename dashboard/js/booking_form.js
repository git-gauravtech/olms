
async function initializeBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    const labIdSelect = document.getElementById('labId');
    const timeSlotIdSelect = document.getElementById('timeSlotId');
    const equipmentCheckboxesContainer = document.getElementById('equipmentCheckboxes');
    const bookingDateInput = document.getElementById('bookingDate');
    const batchIdentifierGroup = document.getElementById('batchIdentifierGroup');
    const batchIdentifierInput = document.getElementById('batchIdentifier');
    const formSubmissionMessageEl = document.getElementById('formSubmissionMessage'); 
    // const checkAvailabilityBtn = document.getElementById('checkAvailabilityBtn'); // Removed

    const currentUserRole = getCurrentUserRole();
    if (!currentUserRole) {
        console.error("User role not found. Cannot initialize booking form.");
        if(formSubmissionMessageEl) showFormSubmissionMessage('Error: User role not found. Cannot initialize form.', true, formSubmissionMessageEl);
        return;
    }

    if (currentUserRole === USER_ROLES.ASSISTANT) {
        if (batchIdentifierGroup) batchIdentifierGroup.style.display = 'block'; 
        if (batchIdentifierInput) batchIdentifierInput.required = true;
    } else {
         if (batchIdentifierGroup) batchIdentifierGroup.style.display = 'none';
    }

    try {
        // Populate Labs
        if (labIdSelect) {
            labIdSelect.innerHTML = '<option value="">Loading labs...</option>';
            const labsResponse = await fetch('/api/labs', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
            if (!labsResponse.ok) throw new Error('Failed to fetch labs');
            const labs = await labsResponse.json();
            labIdSelect.innerHTML = '<option value="">Select Lab</option>';
            labs.forEach(lab => {
                const option = document.createElement('option');
                option.value = lab.id;
                option.textContent = `${lab.name} (Capacity: ${lab.capacity})`;
                labIdSelect.appendChild(option);
            });
        }

        // Populate Time Slots (from constants.js as they are fixed)
        if (timeSlotIdSelect && window.MOCK_TIME_SLOTS) {
            timeSlotIdSelect.innerHTML = '<option value="">Select Time Slot</option>';
            window.MOCK_TIME_SLOTS.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot.id;
                option.textContent = slot.displayTime;
                timeSlotIdSelect.appendChild(option);
            });
        }

        // Populate Equipment
        if (equipmentCheckboxesContainer) {
            equipmentCheckboxesContainer.innerHTML = '<p>Loading equipment...</p>';
            const equipmentResponse = await fetch('/api/equipment?status=available', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
            if (!equipmentResponse.ok) throw new Error('Failed to fetch equipment');
            const availableEquipment = await equipmentResponse.json();
            equipmentCheckboxesContainer.innerHTML = '';
            if (availableEquipment.length === 0) {
                 equipmentCheckboxesContainer.innerHTML = '<p class="text-sm text-muted-foreground">No equipment currently available.</p>';
            } else {
                availableEquipment.forEach(equipment => {
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
        }
    } catch (error) {
        console.error("Error initializing booking form dropdowns:", error);
        if(formSubmissionMessageEl) showFormSubmissionMessage(`Error initializing form: ${error.message}`, true, formSubmissionMessageEl);
    }


    const urlParams = new URLSearchParams(window.location.search);
    if (labIdSelect && urlParams.has('labId')) labIdSelect.value = urlParams.get('labId');
    if (bookingDateInput && urlParams.has('date')) bookingDateInput.value = urlParams.get('date');
    if (timeSlotIdSelect && urlParams.has('timeSlotId')) timeSlotIdSelect.value = urlParams.get('timeSlotId');


    if (bookingDateInput) {
      bookingDateInput.min = formatDate(new Date());
    }

    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            console.log("Booking form submitted by role:", currentUserRole);
            clearFormErrors(bookingForm);
            if(formSubmissionMessageEl) showFormSubmissionMessage('', false, formSubmissionMessageEl); 

            if (!labIdSelect || !bookingDateInput || !timeSlotIdSelect || !formSubmissionMessageEl) return;

            const labId = labIdSelect.value;
            const bookingDate = bookingDateInput.value;
            const timeSlotId = timeSlotIdSelect.value;
            const purposeInput = document.getElementById('purpose');
            const purpose = purposeInput ? purposeInput.value.trim() : '';
            const selectedEquipment = Array.from(document.querySelectorAll('input[name="equipment"]:checked'))
                                         .map(cb => parseInt(cb.value)); // Ensure IDs are numbers if backend expects
            
            let isValid = true;
            if (!labId) { showError('labIdError', 'Lab selection is required.'); isValid = false; }
            if (!bookingDate) { showError('bookingDateError', 'Date is required.'); isValid = false; }
            if (!timeSlotId) { showError('timeSlotIdError', 'Time slot is required.'); isValid = false; }
            if (!purpose) { showError('purposeError', 'Purpose is required.'); isValid = false; }

            const batchId = batchIdentifierInput ? batchIdentifierInput.value.trim() : '';
            if (currentUserRole === USER_ROLES.ASSISTANT && !batchId) { // Using USER_ROLES from constants
                showError('batchIdentifierError', 'Batch/Class Name is required for Assistant bookings.');
                isValid = false;
            }
            
            if (!isValid) {
                console.log("Form validation failed.");
                return;
            }
            
            const bookingData = {
                labId: parseInt(labId),
                date: bookingDate,
                timeSlotId: timeSlotId,
                purpose: purpose,
                equipmentIds: selectedEquipment,
                batchIdentifier: currentUserRole === USER_ROLES.ASSISTANT ? batchId : null,
            };
            console.log("New booking data to send:", JSON.parse(JSON.stringify(bookingData)));

            const submitButton = bookingForm.querySelector('button[type="submit"]');
            const originalButtonHtml = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = `<i data-lucide="loader-2" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem;"></i> Submitting...`;
            if(window.lucide) window.lucide.createIcons();


            try {
                const response = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(bookingData)
                });

                const result = await response.json();

                if (response.ok) {
                    const successMessage = currentUserRole === USER_ROLES.FACULTY 
                        ? `Booking for ${result.purpose} (Lab: ${result.labName}) confirmed successfully!`
                        : (currentUserRole === USER_ROLES.ASSISTANT 
                            ? `Booking request for ${result.purpose} (Lab: ${result.labName}, Status: PENDING) submitted successfully!`
                            : `Booking for ${result.purpose} (Lab: ${result.labName}) confirmed successfully!`);
                    showFormSubmissionMessage(successMessage, false, formSubmissionMessageEl);
                    bookingForm.reset(); 
                    if (currentUserRole === USER_ROLES.ASSISTANT && batchIdentifierInput) {
                        batchIdentifierInput.value = ''; 
                    }
                    if (bookingDateInput) bookingDateInput.min = formatDate(new Date()); 
                    // Clear query params
                    if (history.pushState) {
                        const newURL = window.location.pathname; 
                        history.pushState({path:newURL}, '', newURL);
                    }
                } else {
                     showFormSubmissionMessage(`Booking failed: ${result.msg || 'An unknown error occurred.'}`, true, formSubmissionMessageEl);
                }

            } catch (error) {
                console.error("Error submitting booking:", error);
                showFormSubmissionMessage(`Error: Could not submit booking. ${error.message}`, true, formSubmissionMessageEl);
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonHtml;
                if(window.lucide) window.lucide.createIcons();
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

    function clearFormErrors(form) {
      if(form){
        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(el => {
            if (el.id !== 'formSubmissionMessage') { 
                el.textContent = '';
                el.style.display = 'none';
                el.classList.remove('visible');
            }
        });
      }
    }
    
    function showFormSubmissionMessage(message, isError, element) {
        if (element) {
            element.textContent = message; 
            if (message) { 
                element.style.color = isError ? '#dc3545' : '#28a745'; // Standard red/green
                element.className = isError ? 'error-message visible' : 'success-message visible';
                element.style.display = 'block';
            } else { 
                element.style.display = 'none';
                element.textContent = ''; 
            }
        }
    }
}
