
// Dashboard specific JavaScript will be added here.

// Function to initialize the student schedule page
async function initializeStudentSchedulePage() {
    const courseSelect = document.getElementById('studentCourseSelect');
    const sectionSelect = document.getElementById('studentSectionSelect');
    const viewScheduleBtn = document.getElementById('viewSectionScheduleBtn');
    const scheduleContainer = document.getElementById('studentScheduleContainer');
    const scheduleMessage = document.getElementById('studentScheduleMessage');

    function showMessage(message, type = 'info') {
        scheduleMessage.textContent = message;
        scheduleMessage.className = `form-message ${type}`;
        scheduleMessage.style.display = 'block';
    }

    function hideMessage() {
        scheduleMessage.style.display = 'none';
    }

    // Fetch and populate courses
    async function populateCourses() {
        try {
            const response = await fetch(`${window.API_BASE_URL}/courses`);
            if (!response.ok) {
                throw new Error(`Failed to fetch courses: ${response.statusText}`);
            }
            const courses = await response.json();
            courseSelect.innerHTML = '<option value="">Select a course</option>'; // Clear loading/default
            if (courses.length === 0) {
                courseSelect.innerHTML = '<option value="">No courses available</option>';
                return;
            }
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.course_id;
                option.textContent = course.name;
                courseSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error populating courses:', error);
            courseSelect.innerHTML = '<option value="">Error loading courses</option>';
            showMessage('Could not load courses. Please try again later.', 'error');
        }
    }

    // Fetch and populate sections based on selected course
    courseSelect.addEventListener('change', async () => {
        const courseId = courseSelect.value;
        sectionSelect.innerHTML = '<option value="">Loading sections...</option>';
        sectionSelect.disabled = true;
        viewScheduleBtn.disabled = true;
        scheduleContainer.innerHTML = ''; // Clear previous schedule
        hideMessage();

        if (!courseId) {
            sectionSelect.innerHTML = '<option value="">Select a course first</option>';
            return;
        }

        try {
            const response = await fetch(`${window.API_BASE_URL}/sections?course_id=${courseId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch sections: ${response.statusText}`);
            }
            const sections = await response.json();
            sectionSelect.innerHTML = '<option value="">Select a section</option>';
            if (sections.length === 0) {
                sectionSelect.innerHTML = '<option value="">No sections for this course</option>';
                return;
            }
            sections.forEach(section => {
                const option = document.createElement('option');
                option.value = section.section_id;
                option.textContent = `${section.name} (Semester: ${section.semester}, Year: ${section.year})`;
                sectionSelect.appendChild(option);
            });
            sectionSelect.disabled = false;
        } catch (error) {
            console.error('Error populating sections:', error);
            sectionSelect.innerHTML = '<option value="">Error loading sections</option>';
            showMessage('Could not load sections for this course.', 'error');
        }
    });

    sectionSelect.addEventListener('change', () => {
        if (sectionSelect.value) {
            viewScheduleBtn.disabled = false;
        } else {
            viewScheduleBtn.disabled = true;
        }
        scheduleContainer.innerHTML = ''; // Clear previous schedule
        hideMessage();
    });

    // Fetch and display schedule
    viewScheduleBtn.addEventListener('click', async () => {
        const sectionId = sectionSelect.value;
        if (!sectionId) {
            showMessage('Please select a section first.', 'error');
            return;
        }

        scheduleContainer.innerHTML = 'Loading schedule...';
        hideMessage();
        const token = localStorage.getItem(window.TOKEN_KEY);

        try {
            const response = await fetch(`${window.API_BASE_URL}/bookings?section_id=${sectionId}`, {
                headers: {
                    'Authorization': `Bearer ${token}` // Student needs to be authenticated to view bookings
                }
            });
            if (!response.ok) {
                 const errorResult = await response.json();
                throw new Error(errorResult.message || `Failed to fetch schedule: ${response.statusText}`);
            }
            const bookings = await response.json();
            renderSchedule(bookings);
        } catch (error) {
            console.error('Error fetching schedule:', error);
            scheduleContainer.innerHTML = '';
            showMessage(error.message || 'Could not load schedule for this section.', 'error');
        }
    });

    function renderSchedule(bookings) {
        scheduleContainer.innerHTML = ''; // Clear previous
        if (bookings.length === 0) {
            showMessage('No lab sessions scheduled for this section.', 'info');
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'schedule-list';
        bookings.forEach(booking => {
            const li = document.createElement('li');
            li.className = 'schedule-item';
            const startTime = new Date(booking.start_time).toLocaleString();
            const endTime = new Date(booking.end_time).toLocaleString();
            li.innerHTML = `
                <strong>${booking.course_name} - ${booking.section_name}</strong><br>
                Lab: ${booking.lab_name} (Room: ${booking.room_number || 'N/A'})<br>
                Purpose: ${booking.purpose || 'N/A'}<br>
                Time: ${startTime} - ${endTime}<br>
                Status: ${booking.status}
            `;
            ul.appendChild(li);
        });
        scheduleContainer.appendChild(ul);
    }

    // Initial population
    populateCourses();
}
