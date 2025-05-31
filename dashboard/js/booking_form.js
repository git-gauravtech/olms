
async function initializeBookingForm() {
    const bookingForm = document.getElementById('bookingForm');
    const courseSelect = document.getElementById('courseSelect');
    const sectionSelect = document.getElementById('sectionSelect');
    const labIdSelect = document.getElementById('labId');
    const timeSlotIdSelect = document.getElementById('timeSlotId');
    const equipmentCheckboxesContainer = document.getElementById('equipmentCheckboxes');
    const bookingDateInput = document.getElementById('bookingDate');
    const formSubmissionMessageEl = document.getElementById('formSubmissionMessage');
    const token = localStorage.getItem('token');
    const currentUserRole = window.getCurrentUserRole();
    const currentUserId = localStorage.getItem('userId');

    if (!currentUserRole || !currentUserId) {
        if (formSubmissionMessageEl) showFormSubmissionMessage('Error: User details not found.', true, formSubmissionMessageEl);
        return;
    }

    async function fetchFacultyCourses() {
        try {
            const response = await fetch(`${window.API_BASE_URL}/sections?taught_by_me=true`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Failed to fetch faculty sections');
            const sectionsTaughtByFaculty = await response.json();
            
            // Extract unique courses from these sections
            const coursesMap = new Map();
            sectionsTaughtByFaculty.forEach(section => {
                if (!coursesMap.has(section.course_id)) {
                    coursesMap.set(section.course_id, { id: section.course_id, name: section.course_name, sections: [] });
                }
                coursesMap.get(section.course_id).sections.push({id: section.id, name: section.section_name});
            });
            return Array.from(coursesMap.values());
        } catch (error) {
            console.error("Error fetching faculty courses/sections:", error);
            if (formSubmissionMessageEl) showFormSubmissionMessage(`Error fetching your courses: ${error.message}`, true, formSubmissionMessageEl);
            return [];
        }
    }
    
    async function fetchAllCoursesForAdmin() {
        try {
            const response = await fetch(`${window.API_BASE_URL}/courses`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Failed to fetch all courses');
            const courses = await response.json();
            // For admin, we need to fetch all sections for each course to populate the second dropdown
            const coursesWithSections = await Promise.all(courses.map(async course => {
                const sectionsResponse = await fetch(`${window.API_BASE_URL}/sections?course_id=${course.id}`, { headers: { 'Authorization': `Bearer ${token}` }});
                if (!sectionsResponse.ok) {
                    console.warn(`Failed to fetch sections for course ${course.id}`);
                    return {...course, sections: []};
                }
                const sections = await sectionsResponse.json();
                return {...course, sections: sections.map(s => ({id: s.id, name: s.section_name})) };
            }));
            return coursesWithSections;
        } catch (error) {
            console.error("Error fetching courses for admin:", error);
            if (formSubmissionMessageEl) showFormSubmissionMessage(`Error fetching courses: ${error.message}`, true, formSubmissionMessageEl);
            return [];
        }
    }

    try {
        if (courseSelect && sectionSelect) {
            courseSelect.innerHTML = '<option value="">Loading courses...</option>';
            sectionSelect.innerHTML = '<option value="">Select a course first</option>';
            sectionSelect.disabled = true;

            let coursesData = [];
            if (currentUserRole === USER_ROLES.FACULTY) {
                coursesData = await fetchFacultyCourses();
            } else if (currentUserRole === USER_ROLES.ADMIN) {
                coursesData = await fetchAllCoursesForAdmin();
            }

            courseSelect.innerHTML = '<option value="">Select Course</option>';
            if (coursesData.length > 0) {
                coursesData.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.name;
                    option.dataset.sections = JSON.stringify(course.sections || []); // Store sections for this course
                    courseSelect.appendChild(option);
                });

                courseSelect.addEventListener('change', () => {
                    sectionSelect.innerHTML = '<option value="">Select Section</option>';
                    sectionSelect.disabled = true;
                    const selectedCourseOption = courseSelect.options[courseSelect.selectedIndex];
                    if (selectedCourseOption && selectedCourseOption.value) {
                        const sectionsForCourse = JSON.parse(selectedCourseOption.dataset.sections || '[]');
                        if (sectionsForCourse.length > 0) {
                            sectionsForCourse.forEach(section => {
                                const option = document.createElement('option');
                                option.value = section.id;
                                option.textContent = section.name;
                                sectionSelect.appendChild(option);
                            });
                            sectionSelect.disabled = false;
                        } else {
                            sectionSelect.innerHTML = '<option value="">No sections available</option>';
                        }
                    }
                });
            } else {
                courseSelect.innerHTML = `<option value="">No courses ${currentUserRole === USER_ROLES.FACULTY ? 'assigned to you' : 'available'}</option>`;
            }
        }

        if (labIdSelect) {
            labIdSelect.innerHTML = '<option value="">Loading labs...</option>';
            const labsResponse = await fetch(`${window.API_BASE_URL}/labs`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!labsResponse.ok) throw new Error(`Failed to fetch labs: ${labsResponse.status} ${labsResponse.statusText}`);
            const labs = await labsResponse.json();
            labIdSelect.innerHTML = '<option value="">Select Lab</option>';
            if (labs.length > 0) {
                labs.forEach(lab => {
                    const option = document.createElement('option');
                    option.value = lab.id;
                    option.textContent = `${lab.name} (Capacity: ${lab.capacity})`;
                    labIdSelect.appendChild(option);
                });
            } else { labIdSelect.innerHTML = '<option value="">No labs available</option>'; }
        }

        if (timeSlotIdSelect && window.MOCK_TIME_SLOTS) {
            timeSlotIdSelect.innerHTML = '<option value="">Select Time Slot</option>';
            window.MOCK_TIME_SLOTS.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot.id;
                option.textContent = slot.displayTime;
                timeSlotIdSelect.appendChild(option);
            });
        }

        if (equipmentCheckboxesContainer) {
            equipmentCheckboxesContainer.innerHTML = '<p>Loading equipment...</p>';
            const equipmentResponse = await fetch(`${window.API_BASE_URL}/equipment?status=available`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!equipmentResponse.ok) throw new Error(`Failed to fetch equipment: ${equipmentResponse.status} ${equipmentResponse.statusText}`);
            const availableEquipment = await equipmentResponse.json();
            equipmentCheckboxesContainer.innerHTML = '';
            if (availableEquipment.length === 0) {
                 equipmentCheckboxesContainer.innerHTML = '<p class="text-sm text-muted-foreground">No equipment available.</p>';
            } else {
                availableEquipment.forEach(equipment => {
                    const div = document.createElement('div'); div.className = 'flex items-center';
                    const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.id = `equip_${equipment.id}`;
                    checkbox.value = equipment.id; checkbox.name = 'equipment'; checkbox.className = 'mr-2 h-4 w-4 rounded border-gray-300';
                    const label = document.createElement('label'); label.htmlFor = `equip_${equipment.id}`;
                    label.textContent = `${equipment.name} (${equipment.type})`; label.className = "text-sm";
                    div.appendChild(checkbox); div.appendChild(label); equipmentCheckboxesContainer.appendChild(div);
                });
            }
        }
    } catch (error) {
        console.error("Error initializing booking form:", error.message, error.stack);
        if(formSubmissionMessageEl) showFormSubmissionMessage(`Error initializing form: ${error.message}`, true, formSubmissionMessageEl);
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (labIdSelect && urlParams.has('labId')) labIdSelect.value = urlParams.get('labId');
    if (bookingDateInput && urlParams.has('date')) bookingDateInput.value = urlParams.get('date');
    if (timeSlotIdSelect && urlParams.has('timeSlotId')) timeSlotIdSelect.value = urlParams.get('timeSlotId');
    if (bookingDateInput) bookingDateInput.min = window.formatDate(new Date());

    if (bookingForm) {
        bookingForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            clearFormErrors(bookingForm);
            if(formSubmissionMessageEl) showFormSubmissionMessage('', false, formSubmissionMessageEl); 

            const selectedSectionId = sectionSelect.value;
            const labId = labIdSelect.value;
            const bookingDate = bookingDateInput.value;
            const timeSlotId = timeSlotIdSelect.value;
            const purposeInput = document.getElementById('purpose');
            const purpose = purposeInput ? purposeInput.value.trim() : '';
            const selectedEquipment = Array.from(document.querySelectorAll('input[name="equipment"]:checked')).map(cb => parseInt(cb.value)); 
            
            let isValid = true;
            if (!selectedSectionId) { showError('sectionSelectError', 'Section selection is required.'); isValid = false; }
            if (!labId) { showError('labIdError', 'Lab selection is required.'); isValid = false; }
            if (!bookingDate) { showError('bookingDateError', 'Date is required.'); isValid = false; }
            if (!timeSlotId) { showError('timeSlotIdError', 'Time slot is required.'); isValid = false; }
            
            if (!isValid) return;
            
            const bookingData = {
                labId: parseInt(labId),
                date: bookingDate,
                timeSlotId: timeSlotId,
                purpose: purpose,
                equipmentIds: selectedEquipment.length > 0 ? selectedEquipment : null, 
                section_id: parseInt(selectedSectionId),
            };

            const submitButton = bookingForm.querySelector('button[type="submit"]');
            const originalButtonHtml = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = `<i data-lucide="loader-2" style="animation: spin 1s linear infinite; display: inline-block; margin-right: 0.5rem;"></i> Submitting...`;
            if(window.lucide) window.lucide.createIcons();

            try {
                const response = await fetch(`${window.API_BASE_URL}/bookings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(bookingData)
                });
                const result = await response.json();
                
                if (response.ok || response.status === 201 || response.status === 202) {
                    showFormSubmissionMessage(result.message || "Booking request processed.", !result.success && result.conflict, formSubmissionMessageEl);
                    if (result.success && !result.conflict) bookingForm.reset();
                    if (bookingDateInput) bookingDateInput.min = window.formatDate(new Date()); 
                    if (courseSelect) courseSelect.value = ""; 
                    if (sectionSelect) { sectionSelect.innerHTML = '<option value="">Select a course first</option>'; sectionSelect.disabled = true; }

                    if (history.pushState && result.success && !result.conflict) {
                        const newURL = window.location.pathname; 
                        history.pushState({path:newURL}, '', newURL);
                    }
                } else {
                     showFormSubmissionMessage(`Booking failed: ${result.msg || 'An unknown error occurred.'}`, true, formSubmissionMessageEl);
                }
            } catch (error) {
                console.error("Error submitting booking form:", error.message, error.stack);
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
        if (errorElement) { errorElement.textContent = message; errorElement.style.display = 'block'; errorElement.classList.add('visible'); }
    }
    function clearFormErrors(form) {
      if(form){
        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(el => {
            if (el.id !== 'formSubmissionMessage') { el.textContent = ''; el.style.display = 'none'; el.classList.remove('visible');}
        });
      }
    }
    function showFormSubmissionMessage(message, isError, element) {
        if (element) {
            element.textContent = message; 
            if (message) { element.className = isError ? 'error-message visible' : 'success-message visible'; element.style.display = 'block'; } 
            else { element.style.display = 'none'; element.textContent = ''; }
        }
    }
}
    