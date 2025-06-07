
// Admin management specific JavaScript for Courses, Sections, and Labs

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

    function showPageMessage(element, message, type = 'info') {
        if (!element) return;
        element.textContent = message;
        element.className = `form-message ${type}`;
        element.style.display = 'block';
        setTimeout(() => {
            if (element.textContent === message) element.style.display = 'none';
        }, 3000);
    }
    
    function showFormMessage(element, message, type = 'error') {
        if (!element) return;
        element.textContent = message;
        element.className = `form-message ${type}`;
        element.style.display = 'block';
    }

    function hideFormMessage(element) {
        if (!element) return;
        element.style.display = 'none';
    }

    async function fetchCourses() {
        try {
            const response = await fetch(`${window.API_BASE_URL}/courses`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch courses');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching courses:', error);
            if (coursesTableContainer) { 
                 showPageMessage(coursesPageMessage, `Error fetching courses: ${error.message}`, 'error');
                 coursesTableContainer.innerHTML = '<p>Could not load courses.</p>';
            }
            return [];
        }
    }

    function renderCoursesTable(courses) {
        if (!coursesTableContainer) return; 
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
        if (window.lucide) window.lucide.createIcons();

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
                if (courseToDelete && confirm(`Are you sure you want to delete the course "${courseToDelete.name}"? This action cannot be undone and might affect related sections and bookings.`)) {
                    await deleteCourse(id);
                }
            });
        });
    }

    function openCourseModal(course = null) {
        if (!courseForm || !courseModal || !courseModalTitle || !courseIdInput || !courseNameInput || !courseDepartmentInput) return;
        hideFormMessage(courseFormMessage);
        courseForm.reset();
        if (course) {
            courseModalTitle.textContent = 'Edit Course';
            courseIdInput.value = course.course_id;
            courseNameInput.value = course.name;
            courseDepartmentInput.value = course.department || '';
        } else {
            courseModalTitle.textContent = 'Add New Course';
            courseIdInput.value = '';
        }
        courseModal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons(); 
    }

    function closeCourseModal() {
        if (courseModal) courseModal.style.display = 'none';
    }

    async function handleCourseFormSubmit(event) {
        event.preventDefault();
        if (!saveCourseBtn || !courseFormMessage) return;
        hideFormMessage(courseFormMessage);
        saveCourseBtn.disabled = true;
        saveCourseBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin mr-2"></i> Saving...';
        if(window.lucide) window.lucide.createIcons();


        const courseData = {
            name: courseNameInput.value.trim(),
            department: courseDepartmentInput.value.trim() || null
        };
        
        if (!courseData.name) {
            showFormMessage(courseFormMessage, 'Course Name is required.', 'error');
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

            showPageMessage(coursesPageMessage, `Course successfully ${courseId ? 'updated' : 'added'}!`, 'success');
            closeCourseModal();
            loadCourses(); 
        } catch (error) {
            console.error(`Error ${courseId ? 'updating' : 'adding'} course:`, error);
            showFormMessage(courseFormMessage, error.message, 'error');
        } finally {
            saveCourseBtn.disabled = false;
            saveCourseBtn.textContent = 'Save Course';
        }
    }
    
    async function deleteCourse(courseId) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/courses/${courseId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete course');
            }
            showPageMessage(coursesPageMessage, 'Course deleted successfully!', 'success');
            loadCourses();
        } catch (error) {
            console.error('Error deleting course:', error);
            showPageMessage(coursesPageMessage, `Error deleting course: ${error.message}`, 'error');
        }
    }

    if (openAddCourseModalBtn) openAddCourseModalBtn.addEventListener('click', () => openCourseModal());
    if (closeCourseModalBtn) closeCourseModalBtn.addEventListener('click', closeCourseModal);
    if (cancelCourseModalBtn) cancelCourseModalBtn.addEventListener('click', closeCourseModal);
    if (courseForm) courseForm.addEventListener('submit', handleCourseFormSubmit);
    if (courseModal) {
        courseModal.addEventListener('click', (event) => {
            if (event.target === courseModal) closeCourseModal();
        });
    }

    async function loadCourses() {
        if (!coursesTableContainer || !TOKEN) {
             if (coursesTableContainer) coursesTableContainer.innerHTML = '<p>Please log in to manage courses.</p>';
             if (coursesPageMessage && !TOKEN) showPageMessage(coursesPageMessage, 'Authentication token not found. Please log in.', 'error');
             return;
        }
        coursesTableContainer.innerHTML = '<p>Loading courses...</p>';
        const courses = await fetchCourses();
        renderCoursesTable(courses);
    }

    if (document.getElementById('coursesTableContainer')) { 
        loadCourses();
    }
}


// Section Management
function initializeSectionManagementPage() {
    const sectionsTableContainer = document.getElementById('sectionsTableContainer');
    const sectionsPageMessage = document.getElementById('sectionsPageMessage');
    
    const openAddSectionModalBtn = document.getElementById('openAddSectionModalBtn');
    const sectionModal = document.getElementById('sectionModal');
    const closeSectionModalBtn = document.getElementById('closeSectionModalBtn');
    const cancelSectionModalBtn = document.getElementById('cancelSectionModalBtn');
    const sectionForm = document.getElementById('sectionForm');
    const sectionModalTitle = document.getElementById('sectionModalTitle');
    const sectionIdInput = document.getElementById('sectionId');
    const sectionCourseIdSelect = document.getElementById('sectionCourseId');
    const sectionNameInput = document.getElementById('sectionName');
    const sectionSemesterSelect = document.getElementById('sectionSemester');
    const sectionYearInput = document.getElementById('sectionYear');
    const sectionFormMessage = document.getElementById('sectionFormMessage');
    const saveSectionBtn = document.getElementById('saveSectionBtn');

    const TOKEN = localStorage.getItem(window.TOKEN_KEY);

    function showPageMessage(element, message, type = 'info') {
        if (!element) return;
        element.textContent = message;
        element.className = `form-message ${type}`;
        element.style.display = 'block';
        setTimeout(() => {
             if (element.textContent === message) element.style.display = 'none';
        }, 3000);
    }
    
    function showFormMessage(element, message, type = 'error') {
        if(!element) return;
        element.textContent = message;
        element.className = `form-message ${type}`;
        element.style.display = 'block';
    }

    function hideFormMessage(element) {
        if(!element) return;
        element.style.display = 'none';
    }
    
    async function fetchCoursesForDropdown() {
        if(!sectionCourseIdSelect) return;
        try {
            const response = await fetch(`${window.API_BASE_URL}/courses`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` } // Admins should have access to all courses
            });
            if (!response.ok) throw new Error('Failed to fetch courses for dropdown');
            const courses = await response.json();
            
            sectionCourseIdSelect.innerHTML = '<option value="">Select a Course</option>';
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.course_id;
                option.textContent = course.name;
                sectionCourseIdSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching courses for dropdown:', error);
            sectionCourseIdSelect.innerHTML = '<option value="">Error loading courses</option>';
        }
    }

    async function fetchSections() {
        try {
            const response = await fetch(`${window.API_BASE_URL}/sections`, { 
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch sections');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching sections:', error);
            if(sectionsPageMessage) showPageMessage(sectionsPageMessage, `Error fetching sections: ${error.message}`, 'error');
            if(sectionsTableContainer) sectionsTableContainer.innerHTML = '<p>Could not load sections.</p>';
            return [];
        }
    }

    function renderSectionsTable(sections) {
        if (!sectionsTableContainer) return;
        if (!sections || sections.length === 0) {
            sectionsTableContainer.innerHTML = '<p>No sections found. Add a new section to get started.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'styled-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Section Name</th>
                    <th>Course</th>
                    <th>Semester</th>
                    <th>Year</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        const tbody = table.querySelector('tbody');
        sections.forEach(section => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${section.name}</td>
                <td>${section.course_name || 'N/A'}</td> 
                <td>${section.semester}</td>
                <td>${section.year}</td>
                <td>
                    <button class="button button-small button-outline edit-section-btn" data-id="${section.section_id}" title="Edit Section"><i data-lucide="edit-2" class="icon-small"></i> Edit</button>
                    <button class="button button-small button-danger delete-section-btn" data-id="${section.section_id}" title="Delete Section"><i data-lucide="trash-2" class="icon-small"></i> Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        sectionsTableContainer.innerHTML = '';
        sectionsTableContainer.appendChild(table);
        if (window.lucide) window.lucide.createIcons();

        document.querySelectorAll('.edit-section-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const sectionToEdit = sections.find(s => s.section_id == id);
                if (sectionToEdit) openSectionModal(sectionToEdit);
            });
        });

        document.querySelectorAll('.delete-section-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const sectionToDelete = sections.find(s => s.section_id == id);
                if (sectionToDelete && confirm(`Are you sure you want to delete the section "${sectionToDelete.name} (${sectionToDelete.course_name})"? This action cannot be undone and might affect related bookings.`)) {
                    await deleteSection(id);
                }
            });
        });
    }

    async function openSectionModal(section = null) {
        if (!sectionForm || !sectionModal || !sectionModalTitle || !sectionIdInput || !sectionCourseIdSelect || !sectionNameInput || !sectionSemesterSelect || !sectionYearInput) return;
        await fetchCoursesForDropdown(); 
        hideFormMessage(sectionFormMessage);
        sectionForm.reset();
        if (section) {
            sectionModalTitle.textContent = 'Edit Section';
            sectionIdInput.value = section.section_id;
            sectionCourseIdSelect.value = section.course_id;
            sectionNameInput.value = section.name;
            sectionSemesterSelect.value = section.semester;
            sectionYearInput.value = section.year;
        } else {
            sectionModalTitle.textContent = 'Add New Section';
            sectionIdInput.value = '';
        }
        sectionModal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons();
    }

    function closeSectionModal() {
        if(sectionModal) sectionModal.style.display = 'none';
    }

    async function handleSectionFormSubmit(event) {
        event.preventDefault();
        if(!saveSectionBtn || !sectionFormMessage) return;
        hideFormMessage(sectionFormMessage);
        saveSectionBtn.disabled = true;
        saveSectionBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin mr-2"></i> Saving...';
        if(window.lucide) window.lucide.createIcons();

        const sectionData = {
            course_id: sectionCourseIdSelect.value,
            name: sectionNameInput.value.trim(),
            semester: sectionSemesterSelect.value,
            year: sectionYearInput.value.trim()
        };
        
        if (!sectionData.course_id || !sectionData.name || !sectionData.semester || !sectionData.year) {
            showFormMessage(sectionFormMessage, 'All fields (Course, Section Name, Semester, Year) are required.', 'error');
            saveSectionBtn.disabled = false;
            saveSectionBtn.textContent = 'Save Section';
            return;
        }
        if (isNaN(parseInt(sectionData.year)) || sectionData.year.length !== 4) {
            showFormMessage(sectionFormMessage, 'Please enter a valid 4-digit year.', 'error');
            saveSectionBtn.disabled = false;
            saveSectionBtn.textContent = 'Save Section';
            return;
        }

        const sectionId = sectionIdInput.value;
        const method = sectionId ? 'PUT' : 'POST';
        const url = sectionId ? `${window.API_BASE_URL}/sections/${sectionId}` : `${window.API_BASE_URL}/sections`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify(sectionData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Failed to ${sectionId ? 'update' : 'add'} section`);
            }

            showPageMessage(sectionsPageMessage, `Section successfully ${sectionId ? 'updated' : 'added'}!`, 'success');
            closeSectionModal();
            loadSections(); 
        } catch (error) {
            console.error(`Error ${sectionId ? 'updating' : 'adding'} section:`, error);
            showFormMessage(sectionFormMessage, error.message, 'error');
        } finally {
            saveSectionBtn.disabled = false;
            saveSectionBtn.textContent = 'Save Section';
        }
    }
    
    async function deleteSection(sectionId) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/sections/${sectionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete section');
            }
            showPageMessage(sectionsPageMessage, 'Section deleted successfully!', 'success');
            loadSections();
        } catch (error) {
            console.error('Error deleting section:', error);
            showPageMessage(sectionsPageMessage, `Error deleting section: ${error.message}`, 'error');
        }
    }

    if (openAddSectionModalBtn) openAddSectionModalBtn.addEventListener('click', () => openSectionModal());
    if (closeSectionModalBtn) closeSectionModalBtn.addEventListener('click', closeSectionModal);
    if (cancelSectionModalBtn) cancelSectionModalBtn.addEventListener('click', closeSectionModal);
    if (sectionForm) sectionForm.addEventListener('submit', handleSectionFormSubmit);
    if (sectionModal) {
        sectionModal.addEventListener('click', (event) => {
            if (event.target === sectionModal) closeSectionModal();
        });
    }

    async function loadSections() {
         if (!sectionsTableContainer || !TOKEN) {
             if (sectionsTableContainer) sectionsTableContainer.innerHTML = '<p>Please log in to manage sections.</p>';
             if (sectionsPageMessage && !TOKEN) showPageMessage(sectionsPageMessage, 'Authentication token not found. Please log in.', 'error');
             return;
        }
        sectionsTableContainer.innerHTML = '<p>Loading sections...</p>';
        await fetchCoursesForDropdown(); 
        const sections = await fetchSections();
        renderSectionsTable(sections);
    }
    
    if (document.getElementById('sectionsTableContainer')) { 
        loadSections();
    }
}

// Lab Management
function initializeLabManagementPage() {
    const labsTableContainer = document.getElementById('labsTableContainer');
    const labsPageMessage = document.getElementById('labsPageMessage');
    
    const openAddLabModalBtn = document.getElementById('openAddLabModalBtn');
    const labModal = document.getElementById('labModal');
    const closeLabModalBtn = document.getElementById('closeLabModalBtn');
    const cancelLabModalBtn = document.getElementById('cancelLabModalBtn');
    const labForm = document.getElementById('labForm');
    const labModalTitle = document.getElementById('labModalTitle');
    const labIdInput = document.getElementById('labId');
    const labNameInput = document.getElementById('labName');
    const labRoomNumberInput = document.getElementById('labRoomNumber');
    const labCapacityInput = document.getElementById('labCapacity');
    const labTypeSelect = document.getElementById('labType');
    const labIsAvailableSelect = document.getElementById('labIsAvailable');
    const labFormMessage = document.getElementById('labFormMessage');
    const saveLabBtn = document.getElementById('saveLabBtn');

    const TOKEN = localStorage.getItem(window.TOKEN_KEY);

    function showPageMessage(element, message, type = 'info') {
        if (!element) return;
        element.textContent = message;
        element.className = `form-message ${type}`;
        element.style.display = 'block';
        setTimeout(() => {
            if (element.textContent === message) element.style.display = 'none';
        }, 3000);
    }
    
    function showFormMessage(element, message, type = 'error') {
        if(!element) return;
        element.textContent = message;
        element.className = `form-message ${type}`;
        element.style.display = 'block';
    }

    function hideFormMessage(element) {
        if(!element) return;
        element.style.display = 'none';
    }

    async function fetchLabs() {
        try {
            const response = await fetch(`${window.API_BASE_URL}/labs`, { 
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch labs');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching labs:', error);
            if(labsPageMessage) showPageMessage(labsPageMessage, `Error fetching labs: ${error.message}`, 'error');
            if(labsTableContainer) labsTableContainer.innerHTML = '<p>Could not load labs.</p>';
            return [];
        }
    }

    function renderLabsTable(labs) {
        if (!labsTableContainer) return;
        if (!labs || labs.length === 0) {
            labsTableContainer.innerHTML = '<p>No labs found. Add a new lab to get started.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'styled-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Lab Name</th>
                    <th>Room No.</th>
                    <th>Capacity</th>
                    <th>Type</th>
                    <th>Available</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        const tbody = table.querySelector('tbody');
        labs.forEach(lab => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${lab.name}</td>
                <td>${lab.room_number || 'N/A'}</td> 
                <td>${lab.capacity}</td>
                <td>${lab.type || 'N/A'}</td>
                <td>${lab.is_available ? 'Yes' : 'No'}</td>
                <td>
                    <button class="button button-small button-outline edit-lab-btn" data-id="${lab.lab_id}" title="Edit Lab"><i data-lucide="edit-2" class="icon-small"></i> Edit</button>
                    <button class="button button-small button-danger delete-lab-btn" data-id="${lab.lab_id}" title="Delete Lab"><i data-lucide="trash-2" class="icon-small"></i> Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        labsTableContainer.innerHTML = '';
        labsTableContainer.appendChild(table);
        if (window.lucide) window.lucide.createIcons();

        document.querySelectorAll('.edit-lab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const labToEdit = labs.find(l => l.lab_id == id);
                if (labToEdit) openLabModal(labToEdit);
            });
        });

        document.querySelectorAll('.delete-lab-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const labToDelete = labs.find(l => l.lab_id == id);
                if (labToDelete && confirm(`Are you sure you want to delete the lab "${labToDelete.name}"? This might affect existing bookings or schedules.`)) {
                    await deleteLab(id);
                }
            });
        });
    }

    function openLabModal(lab = null) {
        if (!labForm || !labModal || !labModalTitle || !labIdInput || !labNameInput || !labRoomNumberInput || !labCapacityInput || !labTypeSelect || !labIsAvailableSelect) return;
        hideFormMessage(labFormMessage);
        labForm.reset();
        if (lab) {
            labModalTitle.textContent = 'Edit Lab';
            labIdInput.value = lab.lab_id;
            labNameInput.value = lab.name;
            labRoomNumberInput.value = lab.room_number || '';
            labCapacityInput.value = lab.capacity;
            labTypeSelect.value = lab.type || '';
            labIsAvailableSelect.value = lab.is_available ? '1' : '0';
        } else {
            labModalTitle.textContent = 'Add New Lab';
            labIdInput.value = '';
            labIsAvailableSelect.value = '1'; // Default to available
        }
        labModal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons();
    }

    function closeLabModal() {
        if(labModal) labModal.style.display = 'none';
    }

    async function handleLabFormSubmit(event) {
        event.preventDefault();
        if(!saveLabBtn || !labFormMessage) return;
        hideFormMessage(labFormMessage);
        saveLabBtn.disabled = true;
        saveLabBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin mr-2"></i> Saving...';
        if(window.lucide) window.lucide.createIcons();

        const labData = {
            name: labNameInput.value.trim(),
            room_number: labRoomNumberInput.value.trim() || null,
            capacity: parseInt(labCapacityInput.value),
            type: labTypeSelect.value.trim() || null,
            is_available: labIsAvailableSelect.value === '1' ? true : false,
        };
        
        if (!labData.name || isNaN(labData.capacity) || labData.capacity <= 0) {
            showFormMessage(labFormMessage, 'Lab Name and a valid Capacity are required.', 'error');
            saveLabBtn.disabled = false;
            saveLabBtn.textContent = 'Save Lab';
            return;
        }

        const labId = labIdInput.value;
        const method = labId ? 'PUT' : 'POST';
        const url = labId ? `${window.API_BASE_URL}/labs/${labId}` : `${window.API_BASE_URL}/labs`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify(labData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Failed to ${labId ? 'update' : 'add'} lab`);
            }

            showPageMessage(labsPageMessage, `Lab successfully ${labId ? 'updated' : 'added'}!`, 'success');
            closeLabModal();
            loadLabs(); 
        } catch (error) {
            console.error(`Error ${labId ? 'updating' : 'adding'} lab:`, error);
            showFormMessage(labFormMessage, error.message, 'error');
        } finally {
            saveLabBtn.disabled = false;
            saveLabBtn.textContent = 'Save Lab';
        }
    }
    
    async function deleteLab(labId) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/labs/${labId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete lab');
            }
            showPageMessage(labsPageMessage, 'Lab deleted successfully!', 'success');
            loadLabs();
        } catch (error) {
            console.error('Error deleting lab:', error);
            showPageMessage(labsPageMessage, `Error deleting lab: ${error.message}`, 'error');
        }
    }

    if (openAddLabModalBtn) openAddLabModalBtn.addEventListener('click', () => openLabModal());
    if (closeLabModalBtn) closeLabModalBtn.addEventListener('click', closeLabModal);
    if (cancelLabModalBtn) cancelLabModalBtn.addEventListener('click', closeLabModal);
    if (labForm) labForm.addEventListener('submit', handleLabFormSubmit);
    if (labModal) {
        labModal.addEventListener('click', (event) => {
            if (event.target === labModal) closeLabModal();
        });
    }

    async function loadLabs() {
         if (!labsTableContainer || !TOKEN) {
             if (labsTableContainer) labsTableContainer.innerHTML = '<p>Please log in to manage labs.</p>';
             if (labsPageMessage && !TOKEN) showPageMessage(labsPageMessage, 'Authentication token not found. Please log in.', 'error');
             return;
        }
        labsTableContainer.innerHTML = '<p>Loading labs...</p>';
        const labs = await fetchLabs();
        renderLabsTable(labs);
    }
    
    if (document.getElementById('labsTableContainer')) { 
        loadLabs();
    }
}

// Initialize pages if their main containers exist
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('coursesTableContainer')) {
        initializeCourseManagementPage();
    }
    if (document.getElementById('sectionsTableContainer')) {
        initializeSectionManagementPage();
    }
    if (document.getElementById('labsTableContainer')) {
        initializeLabManagementPage();
    }
});

