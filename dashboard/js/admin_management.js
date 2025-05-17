
// Global variables for the current page context (labs or equipment)
let currentLabs = [];
let currentEquipment = [];
let editingLabId = null;
let editingEquipmentId = null;

// --- Lab Management --- //
async function initializeLabManagementPage() {
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
    
    await renderLabsList();
}

async function renderLabsList() {
    const labsListContainer = document.getElementById('labsListContainer');
    if (!labsListContainer) return;

    labsListContainer.innerHTML = '<p>Loading labs...</p>'; 
    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${window.API_BASE_URL}/labs`, {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || `Failed to fetch labs: ${response.status}`);
        }
        currentLabs = await response.json();
    } catch (error) {
        // console.error('Error fetching labs:', error);
        labsListContainer.innerHTML = `<p class="error-message visible">Error loading labs: ${error.message}</p>`;
        return;
    }


    labsListContainer.innerHTML = ''; 

    if (currentLabs.length === 0) {
        labsListContainer.innerHTML = '<p>No labs configured yet. Click "Add New Lab" to get started.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'entity-list'; 

    currentLabs.forEach(lab => {
        const li = document.createElement('li');
        li.className = 'entity-list-item custom-card p-4 mb-3'; 
        
        const nameEl = document.createElement('h3');
        nameEl.className = 'text-lg font-semibold';
        nameEl.textContent = lab.name;

        const detailsEl = document.createElement('p');
        detailsEl.className = 'text-sm text-muted-foreground';
        detailsEl.textContent = `ID: ${lab.id}, Capacity: ${lab.capacity}, Room: ${lab.roomNumber || 'N/A'}, Location: ${lab.location || 'N/A'}`;
        
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
    
    editingLabId = null; 
    labForm.reset(); 

    if (lab) {
        labModalTitle.textContent = 'Edit Lab';
        document.getElementById('labId').value = lab.id; // Hidden field for ID
        document.getElementById('labName').value = lab.name;
        document.getElementById('labCapacity').value = lab.capacity;
        document.getElementById('labRoomNumber').value = lab.roomNumber;
        document.getElementById('labLocation').value = lab.location || '';
        editingLabId = lab.id;
    } else {
        labModalTitle.textContent = 'Add New Lab';
        document.getElementById('labId').value = ''; 
        document.getElementById('labLocation').value = '';
    }
    labModal.classList.add('open');
    if (window.lucide) window.lucide.createIcons(); 
}

function closeLabModal() {
    const labModal = document.getElementById('labModal');
    if (labModal) labModal.classList.remove('open');
    editingLabId = null;
}

async function handleLabFormSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('labName').value.trim();
    const capacityVal = document.getElementById('labCapacity').value;
    const roomNumber = document.getElementById('labRoomNumber').value.trim();
    const location = document.getElementById('labLocation').value.trim();
    const token = localStorage.getItem('token');

    if (!name || !capacityVal || !roomNumber) {
        alert('Please fill in Lab Name, Capacity, and Room Number.');
        return;
    }
    const capacity = parseInt(capacityVal, 10);
    if (isNaN(capacity) || capacity <= 0) {
        alert('Capacity must be a positive number.');
        return;
    }

    const labData = { name, capacity, roomNumber, location: location || null };
    let url = `${window.API_BASE_URL}/labs`;
    let method = 'POST';

    if (editingLabId) {
        url = `${window.API_BASE_URL}/labs/${editingLabId}`;
        method = 'PUT';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(labData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || `Failed to save lab: ${response.status}`);
        }
        
        await renderLabsList();
        closeLabModal();
    } catch (error) {
        // console.error('Error saving lab:', error);
        alert(`Error saving lab: ${error.message}`);
    }
}

async function deleteLab(labId) {
    const token = localStorage.getItem('token');
    if (confirm('Are you sure you want to delete this lab? This action cannot be undone and may affect related bookings and equipment assignments.')) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/labs/${labId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || `Failed to delete lab: ${response.status}`);
            }
            await renderLabsList();
        } catch (error) {
            // console.error('Error deleting lab:', error);
            alert(`Error deleting lab: ${error.message}`);
        }
    }
}

// --- Equipment Management --- //
async function initializeEquipmentManagementPage() {
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
    
    await populateEquipmentFormDropdowns(); 
    await renderEquipmentList();
}

async function populateEquipmentFormDropdowns() {
    const statusSelect = document.getElementById('equipmentStatus');
    const labSelect = document.getElementById('equipmentLabId');
    const token = localStorage.getItem('token');

    if (statusSelect && window.EQUIPMENT_STATUSES) {
        statusSelect.innerHTML = ''; 
        window.EQUIPMENT_STATUSES.forEach(status => {
            const option = document.createElement('option');
            option.value = status;
            option.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            statusSelect.appendChild(option);
        });
    }

    if (labSelect) { 
        labSelect.innerHTML = '<option value="">Loading labs...</option>'; 
        try {
            const response = await fetch(`${window.API_BASE_URL}/labs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch labs for dropdown');
            const labsForDropdown = await response.json();
            
            labSelect.innerHTML = '<option value="">None</option>'; 
            labsForDropdown.forEach(lab => {
                const option = document.createElement('option');
                option.value = lab.id;
                option.textContent = lab.name;
                labSelect.appendChild(option);
            });
        } catch (error) {
            // console.error('Error populating lab dropdown for equipment:', error);
            labSelect.innerHTML = '<option value="">Error loading labs</option>';
        }
    }
}


async function renderEquipmentList() {
    const equipmentListContainer = document.getElementById('equipmentListContainer');
    if (!equipmentListContainer) return;
    const token = localStorage.getItem('token');

    equipmentListContainer.innerHTML = '<p>Loading equipment...</p>';
    
    try {
        const response = await fetch(`${window.API_BASE_URL}/equipment`, {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
             const errorData = await response.json();
            throw new Error(errorData.msg || `Failed to fetch equipment: ${response.status}`);
        }
        currentEquipment = await response.json();
    } catch (error) {
        // console.error('Error fetching equipment:', error);
        equipmentListContainer.innerHTML = `<p class="error-message visible">Error loading equipment: ${error.message}</p>`;
        return;
    }
    
    equipmentListContainer.innerHTML = ''; 

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

        const labName = equip.labName || 'None'; 

        const detailsEl = document.createElement('p');
        detailsEl.className = 'text-sm text-muted-foreground';
        detailsEl.textContent = `ID: ${equip.id}, Type: ${equip.type || 'N/A'}, Status: ${equip.status}, Assigned Lab: ${labName}`;
        
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

async function openEquipmentForm(equip = null) { 
    const equipmentModal = document.getElementById('equipmentModal');
    const equipmentModalTitle = document.getElementById('equipmentModalTitle');
    const equipmentForm = document.getElementById('equipmentForm');
    
    await populateEquipmentFormDropdowns(); 
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

async function handleEquipmentFormSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('equipmentName').value.trim();
    const type = document.getElementById('equipmentType').value.trim();
    const status = document.getElementById('equipmentStatus').value;
    const labIdValue = document.getElementById('equipmentLabId').value;
    const labId = labIdValue ? parseInt(labIdValue) : null;
    const token = localStorage.getItem('token');


    if (!name || !type || !status) {
        alert('Please fill in Equipment Name, Type, and Status.');
        return;
    }
    
    const equipmentData = { name, type, status, labId };
    let url = `${window.API_BASE_URL}/equipment`;
    let method = 'POST';

    if (editingEquipmentId) {
        url = `${window.API_BASE_URL}/equipment/${editingEquipmentId}`;
        method = 'PUT';
    }
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(equipmentData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || `Failed to save equipment: ${response.status}`);
        }
        
        await renderEquipmentList();
        closeEquipmentModal();
    } catch (error) {
        // console.error('Error saving equipment:', error);
        alert(`Error saving equipment: ${error.message}`);
    }
}

async function deleteEquipment(equipmentId) {
    const token = localStorage.getItem('token');
    if (confirm('Are you sure you want to delete this equipment? This action cannot be undone.')) {
         try {
            const response = await fetch(`${window.API_BASE_URL}/equipment/${equipmentId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.msg || `Failed to delete equipment: ${response.status}`);
            }
            await renderEquipmentList();
        } catch (error) {
            // console.error('Error deleting equipment:', error);
            alert(`Error deleting equipment: ${error.message}`);
        }
    }
}

    