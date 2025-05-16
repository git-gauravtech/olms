
// Global variables for the current page context (labs or equipment)
let currentLabs = [];
let currentEquipment = [];
let editingLabId = null;
let editingEquipmentId = null;

// --- Lab Management --- //
function initializeLabManagementPage() {
    const addNewLabBtn = document.getElementById('addNewLabBtn');
    const labModal = document.getElementById('labModal');
    const labForm = document.getElementById('labForm');
    const closeLabModalBtn = document.getElementById('closeLabModalBtn');
    const cancelLabModalBtn = document.getElementById('cancelLabModalBtn');

    if (addNewLabBtn) {
        addNewLabBtn.addEventListener('click', () => openLabForm());
    }
    if (closeLabModalBtn) {
        closeLabModalBtn.addEventListener('click', closeLabModal);
    }
    if (cancelLabModalBtn) {
        cancelLabModalBtn.addEventListener('click', closeLabModal);
    }
    if (labModal) {
        labModal.addEventListener('click', (event) => {
            if (event.target === labModal) closeLabModal();
        });
    }
    if (labForm) {
        labForm.addEventListener('submit', handleLabFormSubmit);
    }
    
    renderLabsList();
}

function renderLabsList() {
    currentLabs = window.loadLabs(); // From constants.js
    const labsListContainer = document.getElementById('labsListContainer');
    if (!labsListContainer) return;

    labsListContainer.innerHTML = ''; // Clear current list

    if (currentLabs.length === 0) {
        labsListContainer.innerHTML = '<p>No labs configured yet. Click "Add New Lab" to get started.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'entity-list'; // For styling

    currentLabs.forEach(lab => {
        const li = document.createElement('li');
        li.className = 'entity-list-item custom-card p-4 mb-3'; // Re-use card styling
        
        const nameEl = document.createElement('h3');
        nameEl.className = 'text-lg font-semibold';
        nameEl.textContent = lab.name;

        const detailsEl = document.createElement('p');
        detailsEl.className = 'text-sm text-muted-foreground';
        detailsEl.textContent = `Capacity: ${lab.capacity}, Room: ${lab.roomNumber || 'N/A'}`;
        
        const actionsEl = document.createElement('div');
        actionsEl.className = 'mt-3 entity-actions';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'button button-outline button-sm mr-2';
        editButton.innerHTML = '<i data-lucide="edit-2" class="mr-1"></i> Edit';
        editButton.addEventListener('click', () => openLabForm(lab));
        
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'button button-secondary button-sm';
        deleteButton.innerHTML = '<i data-lucide="trash-2" class="mr-1"></i> Delete';
        deleteButton.addEventListener('click', () => deleteLab(lab.id));

        actionsEl.appendChild(editButton);
        actionsEl.appendChild(deleteButton);

        li.appendChild(nameEl);
        li.appendChild(detailsEl);
        li.appendChild(actionsEl);
        ul.appendChild(li);
    });
    labsListContainer.appendChild(ul);
    if (window.lucide) window.lucide.createIcons();
}

function openLabForm(lab = null) {
    const labModal = document.getElementById('labModal');
    const labModalTitle = document.getElementById('labModalTitle');
    const labForm = document.getElementById('labForm');
    
    editingLabId = null; // Reset
    labForm.reset(); // Clear form fields

    if (lab) {
        labModalTitle.textContent = 'Edit Lab';
        document.getElementById('labId').value = lab.id;
        document.getElementById('labName').value = lab.name;
        document.getElementById('labCapacity').value = lab.capacity;
        document.getElementById('labRoomNumber').value = lab.roomNumber;
        editingLabId = lab.id;
    } else {
        labModalTitle.textContent = 'Add New Lab';
        document.getElementById('labId').value = ''; // Ensure ID is empty for new lab
    }
    labModal.classList.add('open');
    if (window.lucide) window.lucide.createIcons(); // For modal close icon
}

function closeLabModal() {
    const labModal = document.getElementById('labModal');
    if (labModal) labModal.classList.remove('open');
    editingLabId = null;
}

function handleLabFormSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('labId').value;
    const name = document.getElementById('labName').value.trim();
    const capacity = parseInt(document.getElementById('labCapacity').value, 10);
    const roomNumber = document.getElementById('labRoomNumber').value.trim();

    if (!name || isNaN(capacity) || capacity <= 0 || !roomNumber) {
        alert('Please fill in all fields correctly. Capacity must be a positive number.');
        return;
    }

    if (editingLabId) { // Update existing lab
        const labIndex = currentLabs.findIndex(l => l.id === editingLabId);
        if (labIndex > -1) {
            currentLabs[labIndex] = { ...currentLabs[labIndex], name, capacity, roomNumber };
        }
    } else { // Add new lab
        const newLab = {
            id: 'lab_' + Date.now(), // Simple unique ID
            name,
            capacity,
            roomNumber
        };
        currentLabs.push(newLab);
    }
    
    window.saveLabs(currentLabs); // From constants.js
    renderLabsList();
    closeLabModal();
}

function deleteLab(labId) {
    if (confirm('Are you sure you want to delete this lab? This action cannot be undone.')) {
        currentLabs = currentLabs.filter(lab => lab.id !== labId);
        window.saveLabs(currentLabs);
        renderLabsList();
    }
}

// --- Equipment Management --- //
function initializeEquipmentManagementPage() {
    const addNewEquipmentBtn = document.getElementById('addNewEquipmentBtn');
    const equipmentModal = document.getElementById('equipmentModal');
    const equipmentForm = document.getElementById('equipmentForm');
    const closeEquipmentModalBtn = document.getElementById('closeEquipmentModalBtn');
    const cancelEquipmentModalBtn = document.getElementById('cancelEquipmentModalBtn');

    if (addNewEquipmentBtn) {
        addNewEquipmentBtn.addEventListener('click', () => openEquipmentForm());
    }
    if (closeEquipmentModalBtn) {
        closeEquipmentModalBtn.addEventListener('click', closeEquipmentModal);
    }
    if (cancelEquipmentModalBtn) {
        cancelEquipmentModalBtn.addEventListener('click', closeEquipmentModal);
    }
    if (equipmentModal) {
        equipmentModal.addEventListener('click', (event) => {
            if (event.target === equipmentModal) closeEquipmentModal();
        });
    }
    if (equipmentForm) {
        equipmentForm.addEventListener('submit', handleEquipmentFormSubmit);
    }
    
    populateEquipmentFormDropdowns();
    renderEquipmentList();
}

function populateEquipmentFormDropdowns() {
    const statusSelect = document.getElementById('equipmentStatus');
    const labSelect = document.getElementById('equipmentLabId');

    if (statusSelect && window.EQUIPMENT_STATUSES) {
        statusSelect.innerHTML = ''; // Clear existing
        window.EQUIPMENT_STATUSES.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            statusSelect.appendChild(option);
        });
    }

    if (labSelect && window.MOCK_LABS) { // Assuming MOCK_LABS is up-to-date or loaded
        labSelect.innerHTML = '<option value="">None</option>'; // Clear existing but keep "None"
        currentLabs = window.loadLabs(); // Make sure labs are loaded
        currentLabs.forEach(lab => {
            const option = document.createElement('option');
            option.value = lab.id;
            option.textContent = lab.name;
            labSelect.appendChild(option);
        });
    }
}


function renderEquipmentList() {
    currentEquipment = window.loadEquipment(); // From constants.js
    const equipmentListContainer = document.getElementById('equipmentListContainer');
    if (!equipmentListContainer) return;

    equipmentListContainer.innerHTML = ''; // Clear current list

    if (currentEquipment.length === 0) {
        equipmentListContainer.innerHTML = '<p>No equipment configured yet. Click "Add New Equipment" to get started.</p>';
        return;
    }
    
    const ul = document.createElement('ul');
    ul.className = 'entity-list';

    currentEquipment.forEach(equip => {
        const li = document.createElement('li');
        li.className = 'entity-list-item custom-card p-4 mb-3';
        
        const nameEl = document.createElement('h3');
        nameEl.className = 'text-lg font-semibold';
        nameEl.textContent = equip.name;

        const lab = currentLabs.find(l => l.id === equip.labId);
        const labName = lab ? lab.name : 'None';

        const detailsEl = document.createElement('p');
        detailsEl.className = 'text-sm text-muted-foreground';
        detailsEl.textContent = `Type: ${equip.type || 'N/A'}, Status: ${equip.status}, Assigned Lab: ${labName}`;
        
        const actionsEl = document.createElement('div');
        actionsEl.className = 'mt-3 entity-actions';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'button button-outline button-sm mr-2';
        editButton.innerHTML = '<i data-lucide="edit-2" class="mr-1"></i> Edit';
        editButton.addEventListener('click', () => openEquipmentForm(equip));
        
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'button button-secondary button-sm';
        deleteButton.innerHTML = '<i data-lucide="trash-2" class="mr-1"></i> Delete';
        deleteButton.addEventListener('click', () => deleteEquipment(equip.id));

        actionsEl.appendChild(editButton);
        actionsEl.appendChild(deleteButton);

        li.appendChild(nameEl);
        li.appendChild(detailsEl);
        li.appendChild(actionsEl);
        ul.appendChild(li);
    });
    equipmentListContainer.appendChild(ul);
    if (window.lucide) window.lucide.createIcons();
}

function openEquipmentForm(equip = null) {
    const equipmentModal = document.getElementById('equipmentModal');
    const equipmentModalTitle = document.getElementById('equipmentModalTitle');
    const equipmentForm = document.getElementById('equipmentForm');
    
    populateEquipmentFormDropdowns(); // Ensure dropdowns are fresh
    editingEquipmentId = null;
    equipmentForm.reset();

    if (equip) {
        equipmentModalTitle.textContent = 'Edit Equipment';
        document.getElementById('equipmentId').value = equip.id;
        document.getElementById('equipmentName').value = equip.name;
        document.getElementById('equipmentType').value = equip.type;
        document.getElementById('equipmentStatus').value = equip.status;
        document.getElementById('equipmentLabId').value = equip.labId || "";
        editingEquipmentId = equip.id;
    } else {
        equipmentModalTitle.textContent = 'Add New Equipment';
        document.getElementById('equipmentId').value = '';
    }
    equipmentModal.classList.add('open');
    if (window.lucide) window.lucide.createIcons();
}

function closeEquipmentModal() {
    const equipmentModal = document.getElementById('equipmentModal');
    if (equipmentModal) equipmentModal.classList.remove('open');
    editingEquipmentId = null;
}

function handleEquipmentFormSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('equipmentId').value;
    const name = document.getElementById('equipmentName').value.trim();
    const type = document.getElementById('equipmentType').value.trim();
    const status = document.getElementById('equipmentStatus').value;
    const labId = document.getElementById('equipmentLabId').value;

    if (!name || !type || !status) {
        alert('Please fill in Equipment Name, Type, and Status.');
        return;
    }

    if (editingEquipmentId) { // Update
        const equipIndex = currentEquipment.findIndex(e => e.id === editingEquipmentId);
        if (equipIndex > -1) {
            currentEquipment[equipIndex] = { ...currentEquipment[equipIndex], name, type, status, labId: labId || null };
        }
    } else { // Add new
        const newEquipment = {
            id: 'equip_' + Date.now(),
            name,
            type,
            status,
            labId: labId || null
        };
        currentEquipment.push(newEquipment);
    }
    
    window.saveEquipment(currentEquipment);
    renderEquipmentList();
    closeEquipmentModal();
}

function deleteEquipment(equipmentId) {
    if (confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
        currentEquipment = currentEquipment.filter(equip => equip.id !== equipmentId);
        window.saveEquipment(currentEquipment);
        renderEquipmentList();
    }
}

    