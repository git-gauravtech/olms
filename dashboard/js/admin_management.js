
// Admin management specific JavaScript for Courses

function initializeCourseManagementPage() {
    const coursesTableContainer = document.getElementById('coursesTableContainer');
    const coursesPageMessage = document.getElementById('coursesPageMessage');
    
    const openAddCourseModalBtn = document.getElementById('openAddCourseModalBtn');
    const courseModal = document.getElementById('courseModal');
    const closeCourseModalBtn = document.getElementById('closeCourseModalBtn');
    const cancelCourseModalBtn = document.getElementById('cancelCourseModalBtn');
    const courseForm = document.getElementById('courseForm');
    const courseModalTitle = document.getElementById('courseModalTitle');
    const courseIdInput = document.getElementById('courseId');
    const courseNameInput = document.getElementById('courseName');
    const courseDepartmentInput = document.getElementById('courseDepartment');
    const courseFormMessage = document.getElementById('courseFormMessage');
    const saveCourseBtn = document.getElementById('saveCourseBtn');

    const TOKEN = localStorage.getItem(window.TOKEN_KEY);

    function showPageMessage(message, type = 'info') {
        coursesPageMessage.textContent = message;
        coursesPageMessage.className = `form-message ${type}`;
        coursesPageMessage.style.display = 'block';
        setTimeout(() => {
            if (coursesPageMessage.textContent === message) coursesPageMessage.style.display = 'none';
        }, 3000);
    }
    
    function showFormMessage(message, type = 'error') {
        courseFormMessage.textContent = message;
        courseFormMessage.className = `form-message ${type}`;
        courseFormMessage.style.display = 'block';
    }

    function hideFormMessage() {
        courseFormMessage.style.display = 'none';
    }

    async function fetchCourses() {
        try {
            const response = await fetch(`${window.API_BASE_URL}/courses`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` } // Though public, admin might get more fields later
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch courses');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching courses:', error);
            showPageMessage(`Error fetching courses: ${error.message}`, 'error');
            coursesTableContainer.innerHTML = '<p>Could not load courses.</p>';
            return [];
        }
    }

    function renderCoursesTable(courses) {
        if (!courses || courses.length === 0) {
            coursesTableContainer.innerHTML = '<p>No courses found. Add a new course to get started.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'styled-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Course Name</th>
                    <th>Department</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        const tbody = table.querySelector('tbody');
        courses.forEach(course => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${course.name}</td>
                <td>${course.department || 'N/A'}</td>
                <td>
                    <button class="button button-small button-outline edit-course-btn" data-id="${course.course_id}" title="Edit Course"><i data-lucide="edit-2" class="icon-small"></i> Edit</button>
                    <button class="button button-small button-danger delete-course-btn" data-id="${course.course_id}" title="Delete Course"><i data-lucide="trash-2" class="icon-small"></i> Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        coursesTableContainer.innerHTML = '';
        coursesTableContainer.appendChild(table);
        if (window.lucide) window.lucide.createIcons(); // Re-render icons

        // Add event listeners for edit and delete buttons
        document.querySelectorAll('.edit-course-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const courseToEdit = courses.find(c => c.course_id == id);
                if (courseToEdit) openCourseModal(courseToEdit);
            });
        });

        document.querySelectorAll('.delete-course-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const courseToDelete = courses.find(c => c.course_id == id);
                if (courseToDelete && confirm(`Are you sure you want to delete the course "${courseToDelete.name}"? This action cannot be undone.`)) {
                    await deleteCourse(id);
                }
            });
        });
    }

    function openCourseModal(course = null) {
        hideFormMessage();
        courseForm.reset();
        if (course) {
            courseModalTitle.textContent = 'Edit Course';
            courseIdInput.value = course.course_id;
            courseNameInput.value = course.name;
            courseDepartmentInput.value = course.department || '';
        } else {
            courseModalTitle.textContent = 'Add New Course';
            courseIdInput.value = ''; // Important for distinguishing add vs edit
        }
        courseModal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons(); // For modal close icon
    }

    function closeCourseModal() {
        courseModal.style.display = 'none';
    }

    async function handleCourseFormSubmit(event) {
        event.preventDefault();
        hideFormMessage();
        saveCourseBtn.disabled = true;
        saveCourseBtn.textContent = 'Saving...';

        const courseData = {
            name: courseNameInput.value.trim(),
            department: courseDepartmentInput.value.trim() || null // Send null if empty
        };
        
        if (!courseData.name) {
            showFormMessage('Course Name is required.', 'error');
            saveCourseBtn.disabled = false;
            saveCourseBtn.textContent = 'Save Course';
            return;
        }

        const courseId = courseIdInput.value;
        const method = courseId ? 'PUT' : 'POST';
        const url = courseId ? `${window.API_BASE_URL}/courses/${courseId}` : `${window.API_BASE_URL}/courses`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify(courseData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Failed to ${courseId ? 'update' : 'add'} course`);
            }

            showPageMessage(`Course successfully ${courseId ? 'updated' : 'added'}!`, 'success');
            closeCourseModal();
            loadCourses(); // Refresh the table
        } catch (error) {
            console.error(`Error ${courseId ? 'updating' : 'adding'} course:`, error);
            showFormMessage(error.message, 'error');
        } finally {
            saveCourseBtn.disabled = false;
            saveCourseBtn.textContent = 'Save Course';
        }
    }
    
    async function deleteCourse(courseId) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/courses/${courseId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`
                }
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete course');
            }
            showPageMessage('Course deleted successfully!', 'success');
            loadCourses(); // Refresh table
        } catch (error) {
            console.error('Error deleting course:', error);
            showPageMessage(`Error deleting course: ${error.message}`, 'error');
        }
    }


    // Event Listeners
    if (openAddCourseModalBtn) {
        openAddCourseModalBtn.addEventListener('click', () => openCourseModal());
    }
    if (closeCourseModalBtn) {
        closeCourseModalBtn.addEventListener('click', closeCourseModal);
    }
    if (cancelCourseModalBtn) {
        cancelCourseModalBtn.addEventListener('click', closeCourseModal);
    }
    if (courseForm) {
        courseForm.addEventListener('submit', handleCourseFormSubmit);
    }
    // Close modal if clicked outside content
    if (courseModal) {
        courseModal.addEventListener('click', (event) => {
            if (event.target === courseModal) {
                closeCourseModal();
            }
        });
    }


    async function loadCourses() {
        coursesTableContainer.innerHTML = '<p>Loading courses...</p>';
        const courses = await fetchCourses();
        renderCoursesTable(courses);
    }

    // Initial load
    if (!TOKEN) {
        showPageMessage('Authentication token not found. Please log in.', 'error');
        coursesTableContainer.innerHTML = '<p>Please log in to manage courses.</p>';
        return;
    }
    loadCourses();
}
