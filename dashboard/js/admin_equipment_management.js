
// Admin Equipment Management specific JavaScript

async function initializeEquipmentManagementPage() {
    const equipmentTableContainer = document.getElementById('equipmentTableContainer');
    const equipmentPageMessage = document.getElementById('equipmentPageMessage');
    
    const openAddEquipmentModalBtn = document.getElementById('openAddEquipmentModalBtn');
    const equipmentModal = document.getElementById('equipmentModal');
    const closeEquipmentModalBtn = document.getElementById('closeEquipmentModalBtn');
    const cancelEquipmentModalBtn = document.getElementById('cancelEquipmentModalBtn');
    const equipmentForm = document.getElementById('equipmentForm');
    const equipmentModalTitle = document.getElementById('equipmentModalTitle');
    
    const equipmentIdInput = document.getElementById('equipmentId');
    const equipmentNameInput = document.getElementById('equipmentName');
    const equipmentTypeInput = document.getElementById('equipmentType');
    const equipmentDescriptionInput = document.getElementById('equipmentDescription');
    const equipmentQuantityInput = document.getElementById('equipmentQuantity');
    const equipmentStatusSelect = document.getElementById('equipmentStatus');
    const equipmentLabIdSelect = document.getElementById('equipmentLabId');
    const equipmentPurchaseDateInput = document.getElementById('equipmentPurchaseDate');
    const equipmentLastMaintenanceDateInput = document.getElementById('equipmentLastMaintenanceDate');
    
    const equipmentFormMessage = document.getElementById('equipmentFormMessage');
    const saveEquipmentBtn = document.getElementById('saveEquipmentBtn');

    const TOKEN = localStorage.getItem(window.TOKEN_KEY);

    async function fetchLabsForDropdown() {
        if (!equipmentLabIdSelect) return;
        try {
            const response = await fetch(`${window.API_BASE_URL}/labs`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!response.ok) throw new Error('Failed to fetch labs for dropdown');
            const labs = await response.json();
            
            equipmentLabIdSelect.innerHTML = '<option value="">Not Assigned</option>'; // Default option
            labs.forEach(lab => {
                const option = document.createElement('option');
                option.value = lab.lab_id;
                option.textContent = `${lab.name} (${lab.room_number || 'N/A'})`;
                equipmentLabIdSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching labs for equipment dropdown:', error);
            equipmentLabIdSelect.innerHTML = '<option value="">Error loading labs</option>';
        }
    }
    
    async function fetchEquipment() {
        try {
            const response = await fetch(`${window.API_BASE_URL}/equipment`, { 
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to fetch equipment');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching equipment:', error);
            if (equipmentPageMessage) showPageMessage(equipmentPageMessage, `Error fetching equipment: ${error.message}`, 'error');
            if (equipmentTableContainer) equipmentTableContainer.innerHTML = '<p>Could not load equipment.</p>';
            return [];
        }
    }

    function renderEquipmentTable(equipmentList) {
        if (!equipmentTableContainer) return;
        if (!equipmentList || equipmentList.length === 0) {
            equipmentTableContainer.innerHTML = '<p>No equipment found. Add new equipment to get started.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'styled-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Assigned Lab</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
            </tbody>
        `;
        const tbody = table.querySelector('tbody');
        equipmentList.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${item.name}</td>
                <td>${item.type}</td>
                <td>${item.quantity}</td>
                <td>${item.status}</td>
                <td>${item.lab_name || 'Not Assigned'}</td>
                <td>
                    <button class="button button-small button-outline view-equipment-btn" data-id="${item.equipment_id}" title="View/Edit Details"><i data-lucide="eye" class="icon-small"></i> Details</button>
                    <button class="button button-small button-danger delete-equipment-btn" data-id="${item.equipment_id}" title="Delete Equipment"><i data-lucide="trash-2" class="icon-small"></i> Delete</button>
                </td>
            `; // Changed edit button to view/details
            tbody.appendChild(tr);
        });

        equipmentTableContainer.innerHTML = '';
        equipmentTableContainer.appendChild(table);
        if (window.lucide) window.lucide.createIcons();

        document.querySelectorAll('.view-equipment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const equipmentToEdit = equipmentList.find(eq => eq.equipment_id == id);
                if (equipmentToEdit) openEquipmentModal(equipmentToEdit);
            });
        });

        document.querySelectorAll('.delete-equipment-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                const equipmentToDelete = equipmentList.find(eq => eq.equipment_id == id);
                if (equipmentToDelete && confirm(`Are you sure you want to delete the equipment "${equipmentToDelete.name}"?`)) {
                    await deleteEquipment(id);
                }
            });
        });
    }

    async function openEquipmentModal(equipment = null) {
        if (!equipmentForm || !equipmentModal || !equipmentModalTitle || !equipmentIdInput || !equipmentNameInput || !equipmentTypeInput) return;
        
        await fetchLabsForDropdown(); // Ensure labs are loaded for the dropdown
        hideMessage(equipmentFormMessage);
        equipmentForm.reset();
        
        if (equipment) {
            equipmentModalTitle.textContent = 'Edit Equipment Details';
            equipmentIdInput.value = equipment.equipment_id;
            equipmentNameInput.value = equipment.name;
            equipmentTypeInput.value = equipment.type;
            equipmentDescriptionInput.value = equipment.description || '';
            equipmentQuantityInput.value = equipment.quantity;
            equipmentStatusSelect.value = equipment.status || 'Available';
            equipmentLabIdSelect.value = equipment.lab_id || '';
            equipmentPurchaseDateInput.value = equipment.purchase_date ? equipment.purchase_date.split('T')[0] : '';
            equipmentLastMaintenanceDateInput.value = equipment.last_maintenance_date ? equipment.last_maintenance_date.split('T')[0] : '';
        } else {
            equipmentModalTitle.textContent = 'Add New Equipment';
            equipmentIdInput.value = '';
            equipmentQuantityInput.value = 1; // Default quantity
            equipmentStatusSelect.value = 'Available'; // Default status
        }
        equipmentModal.style.display = 'flex';
        if (window.lucide) window.lucide.createIcons(); 
    }

    function closeEquipmentModal() {
        if (equipmentModal) equipmentModal.style.display = 'none';
    }

    async function handleEquipmentFormSubmit(event) {
        event.preventDefault();
        if (!saveEquipmentBtn || !equipmentFormMessage) return;
        hideMessage(equipmentFormMessage);
        saveEquipmentBtn.disabled = true;
        saveEquipmentBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin mr-2"></i> Saving...';
        if (window.lucide) window.lucide.createIcons();

        const equipmentData = {
            name: equipmentNameInput.value.trim(),
            type: equipmentTypeInput.value.trim(),
            description: equipmentDescriptionInput.value.trim() || null,
            quantity: parseInt(equipmentQuantityInput.value),
            status: equipmentStatusSelect.value,
            lab_id: equipmentLabIdSelect.value ? parseInt(equipmentLabIdSelect.value) : null,
            purchase_date: equipmentPurchaseDateInput.value || null,
            last_maintenance_date: equipmentLastMaintenanceDateInput.value || null,
        };
        
        if (!equipmentData.name || !equipmentData.type) {
            showFormMessage(equipmentFormMessage, 'Equipment Name and Type are required.', 'error');
            saveEquipmentBtn.disabled = false;
            saveEquipmentBtn.textContent = 'Save Equipment';
            return;
        }
        if (isNaN(equipmentData.quantity) || equipmentData.quantity < 0) {
            showFormMessage(equipmentFormMessage, 'Quantity must be a non-negative number.', 'error');
            saveEquipmentBtn.disabled = false;
            saveEquipmentBtn.textContent = 'Save Equipment';
            return;
        }

        const currentEquipmentId = equipmentIdInput.value;
        const method = currentEquipmentId ? 'PUT' : 'POST';
        const url = currentEquipmentId ? `${window.API_BASE_URL}/equipment/${currentEquipmentId}` : `${window.API_BASE_URL}/equipment`;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify(equipmentData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `Failed to ${currentEquipmentId ? 'update' : 'add'} equipment`);
            }

            showPageMessage(equipmentPageMessage, `Equipment successfully ${currentEquipmentId ? 'updated' : 'added'}!`, 'success');
            closeEquipmentModal();
            loadAllEquipment(); 
        } catch (error) {
            console.error(`Error ${currentEquipmentId ? 'updating' : 'adding'} equipment:`, error);
            showFormMessage(equipmentFormMessage, error.message, 'error');
        } finally {
            saveEquipmentBtn.disabled = false;
            saveEquipmentBtn.textContent = 'Save Equipment';
        }
    }
    
    async function deleteEquipment(id) {
        try {
            const response = await fetch(`${window.API_BASE_URL}/equipment/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Failed to delete equipment');
            }
            showPageMessage(equipmentPageMessage, 'Equipment deleted successfully!', 'success');
            loadAllEquipment();
        } catch (error) {
            console.error('Error deleting equipment:', error);
            showPageMessage(equipmentPageMessage, `Error deleting equipment: ${error.message}`, 'error');
        }
    }

    if (openAddEquipmentModalBtn) openAddEquipmentModalBtn.addEventListener('click', () => openEquipmentModal());
    if (closeEquipmentModalBtn) closeEquipmentModalBtn.addEventListener('click', closeEquipmentModal);
    if (cancelEquipmentModalBtn) cancelEquipmentModalBtn.addEventListener('click', closeEquipmentModal);
    if (equipmentForm) equipmentForm.addEventListener('submit', handleEquipmentFormSubmit);
    if (equipmentModal) {
        equipmentModal.addEventListener('click', (event) => {
            if (event.target === equipmentModal) closeEquipmentModal();
        });
    }

    async function loadAllEquipment() {
        if (!equipmentTableContainer || !TOKEN) {
             if (equipmentTableContainer) equipmentTableContainer.innerHTML = '<p>Please log in to manage equipment.</p>';
             if (equipmentPageMessage && !TOKEN) showPageMessage(equipmentPageMessage, 'Authentication token not found. Please log in.', 'error');
             return;
        }
        if (equipmentTableContainer) equipmentTableContainer.innerHTML = '<p>Loading equipment...</p>';
        await fetchLabsForDropdown(); // Pre-load labs for modal efficiency if opened quickly
        const equipmentList = await fetchEquipment();
        renderEquipmentTable(equipmentList);
    }

    if (document.getElementById('equipmentTableContainer')) { 
        loadAllEquipment();
    }
}
