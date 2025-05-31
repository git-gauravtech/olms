
let currentLabs = []; let editingLabId = null;
let currentEquipment = []; let editingEquipmentId = null;
let currentCourses = []; let editingCourseId = null;
let currentSections = []; let editingSectionId = null;
let ALL_FACULTY_USERS_CACHE = []; 

async function fetchAllFacultyUsers() {
    if (ALL_FACULTY_USERS_CACHE.length > 0) return ALL_FACULTY_USERS_CACHE;
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${window.API_BASE_URL}/admin/users?role=Faculty`, { // Assuming an endpoint to get users by role
             headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch faculty users');
        ALL_FACULTY_USERS_CACHE = await response.json();
        return ALL_FACULTY_USERS_CACHE;
    } catch (error) {
        console.error('Error fetching faculty users:', error);
        return [];
    }
}

// --- Lab Management --- (Existing code from previous version)
async function initializeLabManagementPage() {
    const addNewLabBtn = document.getElementById('addNewLabBtn');
    const labModal = document.getElementById('labModal');
    const labForm = document.getElementById('labForm');
    const closeLabModalBtn = document.getElementById('closeLabModalBtn');
    const cancelLabModalBtn = document.getElementById('cancelLabModalBtn');

    if (addNewLabBtn) addNewLabBtn.addEventListener('click', () => openLabForm());
    if (closeLabModalBtn) closeLabModalBtn.addEventListener('click', closeLabModal);
    if (cancelLabModalBtn) cancelLabModalBtn.addEventListener('click', closeLabModal);
    if (labModal) labModal.addEventListener('click', (event) => { if (event.target === labModal) closeLabModal(); });
    if (labForm) labForm.addEventListener('submit', handleLabFormSubmit);
    await renderLabsList();
}
async function renderLabsList() {
    const labsListContainer = document.getElementById('labsListContainer');
    if (!labsListContainer) return;
    labsListContainer.innerHTML = '<p>Loading labs...</p>'; 
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${window.API_BASE_URL}/labs`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ msg: 'Failed to fetch labs and parse error' }));
            throw new Error(errorData.msg || `Failed to fetch labs: ${response.status}`);
        }
        currentLabs = await response.json();
    } catch (error) { labsListContainer.innerHTML = `<p class="error-message visible">Error loading labs: ${error.message}</p>`; return; }
    labsListContainer.innerHTML = ''; 
    if (!currentLabs || currentLabs.length === 0) { labsListContainer.innerHTML = '<p>No labs configured. Click "Add New Lab".</p>'; return; }
    const ul = document.createElement('ul'); ul.className = 'entity-list'; 
    if (currentLabs && typeof currentLabs.forEach === 'function') {
        currentLabs.forEach(lab => {
            const li = document.createElement('li'); li.className = 'entity-list-item custom-card p-4 mb-3'; 
            const nameEl = document.createElement('h3'); nameEl.className = 'text-lg font-semibold'; nameEl.textContent = lab.name || 'N/A';
            const detailsEl = document.createElement('p'); detailsEl.className = 'text-sm text-muted-foreground'; detailsEl.textContent = `ID: ${lab.id}, Capacity: ${lab.capacity || 'N/A'}, Room: ${lab.roomNumber || 'N/A'}, Location: ${lab.location || 'N/A'}`;
            const actionsEl = document.createElement('div'); actionsEl.className = 'mt-3 entity-actions';
            const editButton = document.createElement('button'); editButton.type = 'button'; editButton.className = 'button button-outline button-sm mr-2'; editButton.innerHTML = '<i data-lucide="edit-2" class="mr-1"></i> Edit'; editButton.addEventListener('click', () => openLabForm(lab));
            const deleteButton = document.createElement('button'); deleteButton.type = 'button'; deleteButton.className = 'button button-secondary button-sm'; deleteButton.innerHTML = '<i data-lucide="trash-2" class="mr-1"></i> Delete'; deleteButton.addEventListener('click', () => deleteLab(lab.id));
            actionsEl.appendChild(editButton); actionsEl.appendChild(deleteButton);
            li.appendChild(nameEl); li.appendChild(detailsEl); li.appendChild(actionsEl); ul.appendChild(li);
        });
    } else { labsListContainer.innerHTML = '<p>No labs data to display or data is in incorrect format.</p>'; }
    labsListContainer.appendChild(ul); if (window.lucide) window.lucide.createIcons();
}
function openLabForm(lab = null) {
    const labModal = document.getElementById('labModal'); const labModalTitle = document.getElementById('labModalTitle'); const labForm = document.getElementById('labForm');
    editingLabId = null; labForm.reset(); 
    if (lab) {
        labModalTitle.textContent = 'Edit Lab'; document.getElementById('labId').value = lab.id; document.getElementById('labName').value = lab.name || '';
        document.getElementById('labCapacity').value = lab.capacity || ''; document.getElementById('labRoomNumber').value = lab.roomNumber || '';
        document.getElementById('labLocation').value = lab.location || ''; editingLabId = lab.id;
    } else { labModalTitle.textContent = 'Add New Lab'; document.getElementById('labId').value = ''; document.getElementById('labLocation').value = ''; }
    labModal.classList.add('open'); if (window.lucide) window.lucide.createIcons(); 
}
function closeLabModal() { const labModal = document.getElementById('labModal'); if (labModal) labModal.classList.remove('open'); editingLabId = null; }
async function handleLabFormSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('labName').value.trim(); const capacityVal = document.getElementById('labCapacity').value;
    const roomNumber = document.getElementById('labRoomNumber').value.trim(); const location = document.getElementById('labLocation').value.trim();
    const token = localStorage.getItem('token');
    if (!name || !capacityVal || !roomNumber) { alert('Please fill in Lab Name, Capacity, and Room Number.'); return; }
    const capacity = parseInt(capacityVal, 10); if (isNaN(capacity) || capacity <= 0) { alert('Capacity must be a positive number.'); return; }
    const labData = { name, capacity, roomNumber, location: location || null }; let url = `${window.API_BASE_URL}/labs`; let method = 'POST';
    if (editingLabId) { url = `${window.API_BASE_URL}/labs/${editingLabId}`; method = 'PUT'; }
    try {
        const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(labData) });
        if (!response.ok) { const errorData = await response.json().catch(() => ({ msg: 'Failed to save lab and parse error' })); throw new Error(errorData.msg || `Failed to save lab: ${response.status}`); }
        await renderLabsList(); closeLabModal();
    } catch (error) { alert(`Error saving lab: ${error.message}`); }
}
async function deleteLab(labId) {
    const token = localStorage.getItem('token');
    if (confirm('Are you sure you want to delete this lab?')) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/labs/${labId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) { const errorData = await response.json().catch(() => ({ msg: 'Failed to delete lab and parse error' })); throw new Error(errorData.msg || `Failed to delete lab: ${response.status}`); }
            await renderLabsList();
        } catch (error) { alert(`Error deleting lab: ${error.message}`); }
    }
}
// --- Equipment Management --- (Existing code from previous version)
async function initializeEquipmentManagementPage() {
    const addNewEquipmentBtn = document.getElementById('addNewEquipmentBtn'); const equipmentModal = document.getElementById('equipmentModal');
    const equipmentForm = document.getElementById('equipmentForm'); const closeEquipmentModalBtn = document.getElementById('closeEquipmentModalBtn');
    const cancelEquipmentModalBtn = document.getElementById('cancelEquipmentModalBtn');
    if (addNewEquipmentBtn) addNewEquipmentBtn.addEventListener('click', () => openEquipmentForm());
    if (closeEquipmentModalBtn) closeEquipmentModalBtn.addEventListener('click', closeEquipmentModal);
    if (cancelEquipmentModalBtn) cancelEquipmentModalBtn.addEventListener('click', closeEquipmentModal);
    if (equipmentModal) equipmentModal.addEventListener('click', (event) => { if (event.target === equipmentModal) closeEquipmentModal(); });
    if (equipmentForm) equipmentForm.addEventListener('submit', handleEquipmentFormSubmit);
    await populateEquipmentFormDropdowns(); await renderEquipmentList();
}
async function populateEquipmentFormDropdowns() {
    const statusSelect = document.getElementById('equipmentStatus'); const labSelect = document.getElementById('equipmentLabId'); const token = localStorage.getItem('token');
    if (statusSelect && window.EQUIPMENT_STATUSES) {
        statusSelect.innerHTML = ''; window.EQUIPMENT_STATUSES.forEach(status => { const option = document.createElement('option'); option.value = status; option.textContent = status.charAt(0).toUpperCase() + status.slice(1); statusSelect.appendChild(option); });
    }
    if (labSelect) { 
        labSelect.innerHTML = '<option value="">Loading labs...</option>'; 
        try {
            const response = await fetch(`${window.API_BASE_URL}/labs`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Failed to fetch labs for dropdown'); const labsForDropdown = await response.json();
            labSelect.innerHTML = '<option value="">None (Unassigned)</option>'; 
            if (labsForDropdown && typeof labsForDropdown.forEach === 'function') { labsForDropdown.forEach(lab => { const option = document.createElement('option'); option.value = lab.id; option.textContent = lab.name; labSelect.appendChild(option); }); } 
            else { labSelect.innerHTML = '<option value="">No labs available</option>'; }
        } catch (error) { labSelect.innerHTML = '<option value="">Error loading labs</option>'; }
    }
}
async function renderEquipmentList() {
    const equipmentListContainer = document.getElementById('equipmentListContainer'); if (!equipmentListContainer) return; const token = localStorage.getItem('token');
    equipmentListContainer.innerHTML = '<p>Loading equipment...</p>';
    try {
        const response = await fetch(`${window.API_BASE_URL}/equipment`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) { const errorData = await response.json().catch(() => ({ msg: 'Failed to fetch equipment and parse error' })); throw new Error(errorData.msg || `Failed to fetch equipment: ${response.status}`); }
        currentEquipment = await response.json();
    } catch (error) { equipmentListContainer.innerHTML = `<p class="error-message visible">Error loading equipment: ${error.message}</p>`; return; }
    equipmentListContainer.innerHTML = ''; 
    if (!currentEquipment || currentEquipment.length === 0) { equipmentListContainer.innerHTML = '<p>No equipment configured. Click "Add New Equipment".</p>'; return; }
    const ul = document.createElement('ul'); ul.className = 'entity-list';
    if (currentEquipment && typeof currentEquipment.forEach === 'function') {
        currentEquipment.forEach(equip => {
            const li = document.createElement('li'); li.className = 'entity-list-item custom-card p-4 mb-3';
            const nameEl = document.createElement('h3'); nameEl.className = 'text-lg font-semibold'; nameEl.textContent = equip.name || 'N/A';
            const labName = equip.labName || 'Unassigned'; 
            const detailsEl = document.createElement('p'); detailsEl.className = 'text-sm text-muted-foreground'; detailsEl.textContent = `ID: ${equip.id}, Type: ${equip.type || 'N/A'}, Status: ${equip.status || 'N/A'}, Assigned Lab: ${labName}`;
            const actionsEl = document.createElement('div'); actionsEl.className = 'mt-3 entity-actions';
            const editButton = document.createElement('button'); editButton.type = 'button'; editButton.className = 'button button-outline button-sm mr-2'; editButton.innerHTML = '<i data-lucide="edit-2" class="mr-1"></i> Edit'; editButton.addEventListener('click', () => openEquipmentForm(equip));
            const deleteButton = document.createElement('button'); deleteButton.type = 'button'; deleteButton.className = 'button button-secondary button-sm'; deleteButton.innerHTML = '<i data-lucide="trash-2" class="mr-1"></i> Delete'; deleteButton.addEventListener('click', () => deleteEquipment(equip.id));
            actionsEl.appendChild(editButton); actionsEl.appendChild(deleteButton);
            li.appendChild(nameEl); li.appendChild(detailsEl); li.appendChild(actionsEl); ul.appendChild(li);
        });
    } else { equipmentListContainer.innerHTML = '<p>No equipment data to display or data is in incorrect format.</p>'; }
    equipmentListContainer.appendChild(ul); if (window.lucide) window.lucide.createIcons();
}
async function openEquipmentForm(equip = null) { 
    const equipmentModal = document.getElementById('equipmentModal'); const equipmentModalTitle = document.getElementById('equipmentModalTitle');
    const equipmentForm = document.getElementById('equipmentForm'); await populateEquipmentFormDropdowns(); 
    editingEquipmentId = null; equipmentForm.reset();
    if (equip) {
        equipmentModalTitle.textContent = 'Edit Equipment'; document.getElementById('equipmentId').value = equip.id;
        document.getElementById('equipmentName').value = equip.name || ''; document.getElementById('equipmentType').value = equip.type || '';
        document.getElementById('equipmentStatus').value = equip.status || 'available'; document.getElementById('equipmentLabId').value = equip.labId || ""; 
        editingEquipmentId = equip.id;
    } else {
        equipmentModalTitle.textContent = 'Add New Equipment'; document.getElementById('equipmentId').value = '';
        if (window.EQUIPMENT_STATUSES && window.EQUIPMENT_STATUSES.includes('available')) document.getElementById('equipmentStatus').value = 'available';
    }
    equipmentModal.classList.add('open'); if (window.lucide) window.lucide.createIcons();
}
function closeEquipmentModal() { const equipmentModal = document.getElementById('equipmentModal'); if (equipmentModal) equipmentModal.classList.remove('open'); editingEquipmentId = null; }
async function handleEquipmentFormSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('equipmentName').value.trim(); const type = document.getElementById('equipmentType').value.trim();
    const status = document.getElementById('equipmentStatus').value; const labIdValue = document.getElementById('equipmentLabId').value;
    const labId = labIdValue ? parseInt(labIdValue) : null; const token = localStorage.getItem('token');
    if (!name || !type || !status) { alert('Please fill in Equipment Name, Type, and Status.'); return; }
    const equipmentData = { name, type, status, labId }; let url = `${window.API_BASE_URL}/equipment`; let method = 'POST';
    if (editingEquipmentId) { url = `${window.API_BASE_URL}/equipment/${editingEquipmentId}`; method = 'PUT'; }
    try {
        const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(equipmentData) });
        if (!response.ok) { const errorData = await response.json().catch(() => ({ msg: 'Failed to save equipment and parse error' })); throw new Error(errorData.msg || `Failed to save equipment: ${response.status}`); }
        await renderEquipmentList(); closeEquipmentModal();
    } catch (error) { alert(`Error saving equipment: ${error.message}`); }
}
async function deleteEquipment(equipmentId) {
    const token = localStorage.getItem('token');
    if (confirm('Are you sure you want to delete this equipment?')) {
         try {
            const response = await fetch(`${window.API_BASE_URL}/equipment/${equipmentId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) { const errorData = await response.json().catch(() => ({ msg: 'Failed to delete equipment and parse error' })); throw new Error(errorData.msg || `Failed to delete equipment: ${response.status}`); }
            await renderEquipmentList();
        } catch (error) { alert(`Error deleting equipment: ${error.message}`); }
    }
}

// --- Course Management ---
async function initializeCourseManagementPage() {
    const openAddCourseModalBtn = document.getElementById('openAddCourseModalBtn');
    const courseModal = document.getElementById('courseModal');
    const courseForm = document.getElementById('courseForm');
    const closeCourseModalBtn = document.getElementById('closeCourseModalBtn');
    const cancelCourseModalBtn = document.getElementById('cancelCourseModalBtn');

    if (openAddCourseModalBtn) openAddCourseModalBtn.addEventListener('click', () => openCourseForm());
    if (closeCourseModalBtn) closeCourseModalBtn.addEventListener('click', closeCourseModal);
    if (cancelCourseModalBtn) cancelCourseModalBtn.addEventListener('click', closeCourseModal);
    if (courseModal) courseModal.addEventListener('click', (event) => { if (event.target === courseModal) closeCourseModal(); });
    if (courseForm) courseForm.addEventListener('submit', handleCourseFormSubmit);
    
    populateDepartmentDropdown('courseDepartment');
    await renderCoursesList();
}
async function fetchCourses() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${window.API_BASE_URL}/courses`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Failed to fetch courses');
        currentCourses = await response.json();
        return currentCourses;
    } catch (error) {
        console.error('Error fetching courses:', error);
        alert('Error fetching courses. See console for details.');
        return [];
    }
}
async function renderCoursesList() {
    const coursesListContainer = document.getElementById('coursesListContainer');
    if (!coursesListContainer) return;
    coursesListContainer.innerHTML = '<p>Loading courses...</p>';
    await fetchCourses();
    coursesListContainer.innerHTML = '';
    if (!currentCourses || currentCourses.length === 0) { coursesListContainer.innerHTML = '<p>No courses found. Click "Add New Course".</p>'; return; }
    const ul = document.createElement('ul'); ul.className = 'entity-list';
    currentCourses.forEach(course => {
        const li = document.createElement('li'); li.className = 'entity-list-item custom-card p-4 mb-3';
        const nameEl = document.createElement('h3'); nameEl.className = 'text-lg font-semibold'; nameEl.textContent = course.name;
        const deptEl = document.createElement('p'); deptEl.className = 'text-sm text-muted-foreground'; deptEl.textContent = `Department: ${course.department || 'N/A'}`;
        const actionsEl = document.createElement('div'); actionsEl.className = 'mt-3 entity-actions';
        const editButton = document.createElement('button'); editButton.type = 'button'; editButton.className = 'button button-outline button-sm mr-2'; editButton.innerHTML = '<i data-lucide="edit-2" class="mr-1"></i> Edit'; editButton.addEventListener('click', () => openCourseForm(course));
        const deleteButton = document.createElement('button'); deleteButton.type = 'button'; deleteButton.className = 'button button-secondary button-sm'; deleteButton.innerHTML = '<i data-lucide="trash-2" class="mr-1"></i> Delete'; deleteButton.addEventListener('click', () => deleteCourse(course.id));
        actionsEl.appendChild(editButton); actionsEl.appendChild(deleteButton);
        li.appendChild(nameEl); li.appendChild(deptEl); li.appendChild(actionsEl); ul.appendChild(li);
    });
    coursesListContainer.appendChild(ul); if (window.lucide) window.lucide.createIcons();
}
function openCourseForm(course = null) {
    const courseModal = document.getElementById('courseModal'); const courseModalTitle = document.getElementById('courseModalTitle');
    const courseForm = document.getElementById('courseForm'); const courseFormMessage = document.getElementById('courseFormMessage');
    editingCourseId = null; courseForm.reset(); if(courseFormMessage) { courseFormMessage.textContent = ''; courseFormMessage.style.display = 'none';}
    populateDepartmentDropdown('courseDepartment'); 
    if (course) {
        courseModalTitle.textContent = 'Edit Course'; document.getElementById('courseId').value = course.id;
        document.getElementById('courseName').value = course.name; document.getElementById('courseDepartment').value = course.department || "";
        editingCourseId = course.id;
    } else {
        courseModalTitle.textContent = 'Add New Course'; document.getElementById('courseId').value = '';
    }
    courseModal.classList.add('open'); if (window.lucide) window.lucide.createIcons();
}
function closeCourseModal() { const courseModal = document.getElementById('courseModal'); if (courseModal) courseModal.classList.remove('open'); editingCourseId = null; }
async function handleCourseFormSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('courseName').value.trim(); const department = document.getElementById('courseDepartment').value;
    const token = localStorage.getItem('token'); const courseFormMessage = document.getElementById('courseFormMessage');
    if (!name) { if(courseFormMessage) { courseFormMessage.textContent = 'Course name is required.'; courseFormMessage.style.display = 'block'; courseFormMessage.className = 'error-message visible'; } return; }
    const courseData = { name, department: department || null }; let url = `${window.API_BASE_URL}/courses`; let method = 'POST';
    if (editingCourseId) { url = `${window.API_BASE_URL}/courses/${editingCourseId}`; method = 'PUT'; }
    try {
        const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(courseData) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.msg || `Failed to save course`);
        await renderCoursesList(); closeCourseModal();
    } catch (error) { if(courseFormMessage) { courseFormMessage.textContent = `Error saving course: ${error.message}`; courseFormMessage.style.display = 'block'; courseFormMessage.className = 'error-message visible';} }
}
async function deleteCourse(courseId) {
    const token = localStorage.getItem('token');
    if (confirm('Are you sure you want to delete this course? This will also delete associated sections and bookings.')) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/courses/${courseId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) { const errorData = await response.json().catch(() => ({ msg: 'Failed to delete course' })); throw new Error(errorData.msg); }
            await renderCoursesList();
        } catch (error) { alert(`Error deleting course: ${error.message}`); }
    }
}

// --- Section Management ---
async function initializeSectionManagementPage() {
    const openAddSectionModalBtn = document.getElementById('openAddSectionModalBtn');
    const sectionModal = document.getElementById('sectionModal');
    const sectionForm = document.getElementById('sectionForm');
    const closeSectionModalBtn = document.getElementById('closeSectionModalBtn');
    const cancelSectionModalBtn = document.getElementById('cancelSectionModalBtn');

    if (openAddSectionModalBtn) openAddSectionModalBtn.addEventListener('click', () => openSectionForm());
    if (closeSectionModalBtn) closeSectionModalBtn.addEventListener('click', closeSectionModal);
    if (cancelSectionModalBtn) cancelSectionModalBtn.addEventListener('click', closeSectionModal);
    if (sectionModal) sectionModal.addEventListener('click', (event) => { if (event.target === sectionModal) closeSectionModal(); });
    if (sectionForm) sectionForm.addEventListener('submit', handleSectionFormSubmit);
    
    await populateSectionFormDropdowns();
    await renderSectionsList();
}
async function fetchSections() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${window.API_BASE_URL}/sections`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Failed to fetch sections');
        currentSections = await response.json();
        return currentSections;
    } catch (error) {
        console.error('Error fetching sections:', error);
        alert('Error fetching sections. See console for details.');
        return [];
    }
}
async function renderSectionsList() {
    const sectionsListContainer = document.getElementById('sectionsListContainer');
    if (!sectionsListContainer) return;
    sectionsListContainer.innerHTML = '<p>Loading sections...</p>';
    await fetchSections();
    sectionsListContainer.innerHTML = '';
    if (!currentSections || currentSections.length === 0) { sectionsListContainer.innerHTML = '<p>No sections found. Click "Add New Section".</p>'; return; }
    const ul = document.createElement('ul'); ul.className = 'entity-list';
    currentSections.forEach(section => {
        const li = document.createElement('li'); li.className = 'entity-list-item custom-card p-4 mb-3';
        const nameEl = document.createElement('h3'); nameEl.className = 'text-lg font-semibold'; nameEl.textContent = `${section.course_name || 'N/A'} - ${section.section_name}`;
        const detailsEl = document.createElement('p'); detailsEl.className = 'text-sm text-muted-foreground'; 
        detailsEl.textContent = `Faculty: ${section.faculty_name || 'Unassigned'}, Semester: ${section.semester || 'N/A'}, Year: ${section.year || 'N/A'}`;
        const actionsEl = document.createElement('div'); actionsEl.className = 'mt-3 entity-actions';
        const editButton = document.createElement('button'); editButton.type = 'button'; editButton.className = 'button button-outline button-sm mr-2'; editButton.innerHTML = '<i data-lucide="edit-2" class="mr-1"></i> Edit'; editButton.addEventListener('click', () => openSectionForm(section));
        const deleteButton = document.createElement('button'); deleteButton.type = 'button'; deleteButton.className = 'button button-secondary button-sm'; deleteButton.innerHTML = '<i data-lucide="trash-2" class="mr-1"></i> Delete'; deleteButton.addEventListener('click', () => deleteSection(section.id));
        actionsEl.appendChild(editButton); actionsEl.appendChild(deleteButton);
        li.appendChild(nameEl); li.appendChild(detailsEl); li.appendChild(actionsEl); ul.appendChild(li);
    });
    sectionsListContainer.appendChild(ul); if (window.lucide) window.lucide.createIcons();
}
async function populateSectionFormDropdowns() {
    const courseSelect = document.getElementById('sectionCourseId');
    const facultySelect = document.getElementById('sectionFacultyUserId');
    const token = localStorage.getItem('token');

    if (courseSelect) {
        courseSelect.innerHTML = '<option value="">Loading Courses...</option>';
        const courses = await fetchCourses(); // Re-use existing function
        courseSelect.innerHTML = '<option value="">Select Course</option>';
        courses.forEach(course => { const option = document.createElement('option'); option.value = course.id; option.textContent = course.name; courseSelect.appendChild(option); });
    }
    if (facultySelect) {
        facultySelect.innerHTML = '<option value="">Loading Faculty...</option>';
        const facultyUsers = await fetchAllFacultyUsers();
        facultySelect.innerHTML = '<option value="">None (Unassigned)</option>';
        facultyUsers.forEach(user => { const option = document.createElement('option'); option.value = user.id; option.textContent = user.fullName; facultySelect.appendChild(option); });
    }
}
function openSectionForm(section = null) {
    const sectionModal = document.getElementById('sectionModal'); const sectionModalTitle = document.getElementById('sectionModalTitle');
    const sectionForm = document.getElementById('sectionForm'); const sectionFormMessage = document.getElementById('sectionFormMessage');
    editingSectionId = null; sectionForm.reset(); if(sectionFormMessage) {sectionFormMessage.textContent = ''; sectionFormMessage.style.display = 'none';}
    populateSectionFormDropdowns(); // Ensure dropdowns are fresh
    if (section) {
        sectionModalTitle.textContent = 'Edit Section'; document.getElementById('sectionId').value = section.id;
        document.getElementById('sectionCourseId').value = section.course_id;
        document.getElementById('sectionFacultyUserId').value = section.faculty_user_id || "";
        document.getElementById('sectionName').value = section.section_name;
        document.getElementById('sectionSemester').value = section.semester || "";
        document.getElementById('sectionYear').value = section.year || "";
        editingSectionId = section.id;
    } else {
        sectionModalTitle.textContent = 'Add New Section'; document.getElementById('sectionId').value = '';
    }
    sectionModal.classList.add('open'); if (window.lucide) window.lucide.createIcons();
}
function closeSectionModal() { const sectionModal = document.getElementById('sectionModal'); if (sectionModal) sectionModal.classList.remove('open'); editingSectionId = null; }
async function handleSectionFormSubmit(event) {
    event.preventDefault();
    const course_id = document.getElementById('sectionCourseId').value;
    const faculty_user_id = document.getElementById('sectionFacultyUserId').value || null;
    const section_name = document.getElementById('sectionName').value.trim();
    const semester = document.getElementById('sectionSemester').value.trim();
    const year = document.getElementById('sectionYear').value.trim();
    const token = localStorage.getItem('token'); const sectionFormMessage = document.getElementById('sectionFormMessage');

    if (!course_id || !section_name) { if(sectionFormMessage) { sectionFormMessage.textContent = 'Course and Section Name are required.'; sectionFormMessage.style.display = 'block'; sectionFormMessage.className = 'error-message visible'; } return; }
    const sectionData = { course_id, faculty_user_id, section_name, semester: semester || null, year: year || null };
    let url = `${window.API_BASE_URL}/sections`; let method = 'POST';
    if (editingSectionId) { url = `${window.API_BASE_URL}/sections/${editingSectionId}`; method = 'PUT'; }
    try {
        const response = await fetch(url, { method: method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(sectionData) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.msg || `Failed to save section`);
        await renderSectionsList(); closeSectionModal();
    } catch (error) { if(sectionFormMessage) { sectionFormMessage.textContent = `Error saving section: ${error.message}`; sectionFormMessage.style.display = 'block'; sectionFormMessage.className = 'error-message visible'; } }
}
async function deleteSection(sectionId) {
    const token = localStorage.getItem('token');
    if (confirm('Are you sure you want to delete this section? Associated bookings will also be affected.')) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/sections/${sectionId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) { const errorData = await response.json().catch(() => ({ msg: 'Failed to delete section' })); throw new Error(errorData.msg); }
            await renderSectionsList();
        } catch (error) { alert(`Error deleting section: ${error.message}`); }
    }
}
function populateDepartmentDropdown(elementId) {
    const deptSelect = document.getElementById(elementId);
    if (deptSelect && window.DEPARTMENTS) {
        deptSelect.innerHTML = '<option value="">Select Department (Optional)</option>';
        window.DEPARTMENTS.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept; // Store the full string as value
            option.textContent = dept;
            deptSelect.appendChild(option);
        });
    }
}

window.initializeLabManagementPage = initializeLabManagementPage;
window.initializeEquipmentManagementPage = initializeEquipmentManagementPage;
window.initializeCourseManagementPage = initializeCourseManagementPage;
window.initializeSectionManagementPage = initializeSectionManagementPage;
    