
// Dashboard specific JavaScript will be added here.

// Function to initialize the student schedule page
async function initializeStudentSchedulePage() {
    const courseSelect = document.getElementById('studentCourseSelect');
    const sectionSelect = document.getElementById('studentSectionSelect');
    const viewScheduleBtn = document.getElementById('viewSectionScheduleBtn');
    const scheduleContainer = document.getElementById('studentScheduleContainer');
    const scheduleMessage = document.getElementById('studentScheduleMessage');
    const TOKEN = localStorage.getItem(window.TOKEN_KEY);

    function showMessage(message, type = 'info') {
        if (!scheduleMessage) return;
        scheduleMessage.textContent = message;
        scheduleMessage.className = `form-message ${type}`;
        scheduleMessage.style.display = 'block';
    }

    function hideMessage() {
        if (!scheduleMessage) return;
        scheduleMessage.style.display = 'none';
    }

    if (!courseSelect || !sectionSelect || !viewScheduleBtn || !scheduleContainer || !scheduleMessage) {
        console.error("One or more elements for student schedule page are missing.");
        if (scheduleMessage) showMessage("Page elements missing, cannot initialize.", "error");
        return;
    }
    if (!TOKEN) {
        showMessage("Authentication required. Please log in to view schedules.", "error");
        courseSelect.disabled = true;
        sectionSelect.disabled = true;
        viewScheduleBtn.disabled = true;
        return;
    }

    // Fetch and populate courses
    async function populateCourses() {
        try {
            // The /api/courses endpoint is public for listing courses
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
            const response = await fetch(`${window.API_BASE_URL}/sections?course_id=${courseId}`, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}` // Token required to fetch sections
                }
            });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || `Failed to fetch sections: ${response.statusText}`);
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
            showMessage(error.message || 'Could not load sections for this course.', 'error');
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

        scheduleContainer.innerHTML = '<p>Loading schedule...</p>';
        hideMessage();
        
        try {
            const response = await fetch(`${window.API_BASE_URL}/bookings?section_id=${sectionId}`, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}` 
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
            scheduleContainer.innerHTML = '<p>No lab sessions found for this section.</p>';
            return;
        }

        const ul = document.createElement('ul');
        ul.className = 'schedule-list';
        bookings.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)); // Sort by start time

        bookings.forEach(booking => {
            const li = document.createElement('li');
            li.className = 'schedule-item';
            const startTime = new Date(booking.start_time).toLocaleString();
            const endTime = new Date(booking.end_time).toLocaleString();
            li.innerHTML = `
                <strong>${booking.course_name || 'Course N/A'} - ${booking.section_name || 'Section N/A'}</strong><br>
                Lab: ${booking.lab_name || 'Lab N/A'} (Room: ${booking.room_number || 'N/A'})<br>
                Purpose: ${booking.purpose || 'N/A'}<br>
                Faculty: ${booking.user_name || 'N/A'}<br>
                Time: ${startTime} - ${endTime}<br>
                Status: ${booking.status || 'N/A'}
            `;
            ul.appendChild(li);
        });
        scheduleContainer.appendChild(ul);
    }

    // Initial population
    populateCourses();
}
