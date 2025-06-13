
// Admin Faculty Requests Management specific JavaScript

async function initializeAdminFacultyRequestsPage() {
    const requestsContainer = document.getElementById('facultyRequestsContainer');
    const pageMessage = document.getElementById('facultyRequestsMessage');
    const TOKEN = localStorage.getItem(window.TOKEN_KEY);

    // Modal elements
    const processModal = document.getElementById('adminProcessRequestModal');
    const closeProcessModalBtn = document.getElementById('closeAdminProcessModalBtn');
    const cancelProcessModalBtn = document.getElementById('cancelAdminProcessModalBtn');
    const processForm = document.getElementById('adminProcessRequestForm');
    const processModalTitle = document.getElementById('adminProcessModalTitle');
    const processingRequestIdInput = document.getElementById('processingRequestId');
    const modalFacultyNameSpan = document.getElementById('modalFacultyName');
    const modalOriginalBookingInfoSpan = document.getElementById('modalOriginalBookingInfo');
    const modalRequestedChangeSpan = document.getElementById('modalRequestedChange');
    const modalReasonForChangeSpan = document.getElementById('modalReasonForChange');
    const modalRequestDateSpan = document.getElementById('modalRequestDate');
    const adminRemarksInput = document.getElementById('adminRemarks');
    const processFormMessage = document.getElementById('adminProcessFormMessage');
    const denyRequestBtn = document.getElementById('denyRequestBtn');
    const approveRequestBtn = document.getElementById('approveRequestBtn');

    let allFetchedRequests = []; // To store fetched requests for modal population

    if (!TOKEN) {
        showPageMessage(pageMessage, 'Authentication required.', 'error', 0);
        if (requestsContainer) requestsContainer.innerHTML = '<p>Please log in to view faculty requests.</p>';
        return;
    }
    if (!requestsContainer || !processModal) {
        console.error("Required elements for faculty requests page are missing.");
        return;
    }

    async function fetchFacultyRequests() {
        showPageMessage(pageMessage, 'Loading requests...', 'loading');
        try {
            const response = await fetch(`${window.API_BASE_URL}/faculty-requests`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'Failed to fetch faculty requests.');
            }
            allFetchedRequests = await response.json();
            hideMessage(pageMessage);
            return allFetchedRequests;
        } catch (error) {
            console.error('Error fetching faculty requests:', error);
            showPageMessage(pageMessage, `Error: ${error.message}`, 'error', 0);
            if (requestsContainer) requestsContainer.innerHTML = `<p>Could not load requests. ${error.message}</p>`;
            return [];
        }
    }

    function openProcessModal(request) {
        if (!request || !processModal || !processingRequestIdInput) return;
        hideMessage(processFormMessage);
        processForm.reset();
        
        processingRequestIdInput.value = request.request_id;
        processModalTitle.textContent = `Process Request ID: ${request.request_id}`;
        modalFacultyNameSpan.textContent = request.faculty_name || 'N/A';
        
        let bookingInfo = `Lab: ${request.original_lab_name || 'N/A'} (Room: ${request.original_lab_room || 'N/A'})`;
        if (request.original_course_name || request.original_section_name) {
             bookingInfo += `, Course: ${request.original_course_name || 'N/A'}, Section: ${request.original_section_name || 'N/A'}`;
        }
        bookingInfo += ` on ${new Date(request.original_start_time).toLocaleString()} - ${new Date(request.original_end_time).toLocaleString()}`;
        modalOriginalBookingInfoSpan.innerHTML = bookingInfo;

        modalRequestedChangeSpan.textContent = request.requested_change_details || 'N/A';
        modalReasonForChangeSpan.textContent = request.reason || 'N/A';
        modalRequestDateSpan.textContent = new Date(request.request_date).toLocaleString();
        adminRemarksInput.value = request.admin_remarks || '';

        if (request.status !== 'Pending') {
            approveRequestBtn.disabled = true;
            denyRequestBtn.disabled = true;
            adminRemarksInput.readOnly = true;
            showFormMessage(processFormMessage, `This request has already been ${request.status.toLowerCase()}. Remarks are read-only.`, 'info');
        } else {
            approveRequestBtn.disabled = false;
            denyRequestBtn.disabled = false;
            adminRemarksInput.readOnly = false;
        }
        
        processModal.style.display = 'flex';
        if(window.lucide) window.lucide.createIcons();
    }

    function closeProcessModal() {
        if (processModal) processModal.style.display = 'none';
    }

    async function handleProcessRequest(status) {
        const requestId = processingRequestIdInput.value;
        const remarks = adminRemarksInput.value.trim();

        if (!requestId) {
            showFormMessage(processFormMessage, 'Error: Request ID is missing.', 'error');
            return;
        }
        
        const actionButton = status === 'Approved' ? approveRequestBtn : denyRequestBtn;
        const originalButtonText = actionButton.textContent;
        actionButton.disabled = true;
        approveRequestBtn.disabled = true; // Disable both while processing
        denyRequestBtn.disabled = true;
        actionButton.innerHTML = `<i data-lucide="loader-2" class="animate-spin mr-2"></i> Processing...`;
        if(window.lucide) window.lucide.createIcons();

        try {
            const response = await fetch(`${window.API_BASE_URL}/faculty-requests/${requestId}/process`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${TOKEN}`
                },
                body: JSON.stringify({ status: status, admin_remarks: remarks })
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `Failed to ${status.toLowerCase()} request.`);
            }
            
            let successMessage = `Request ${result.request.request_id} has been ${status.toLowerCase()} successfully.`;
            if (status === 'Approved') {
                successMessage += " Please manually update the booking details in the 'Manual Bookings' section if changes to the schedule are required.";
            }
            showPageMessage(pageMessage, successMessage, 'success', 0); // Keep message visible longer

            closeProcessModal();
            loadAndRenderRequests(); // Refresh the table
        } catch (error) {
            console.error(`Error processing request:`, error);
            showFormMessage(processFormMessage, error.message, 'error');
        } finally {
            actionButton.disabled = false;
            actionButton.textContent = originalButtonText;
            const currentRequest = allFetchedRequests.find(r => r.request_id == requestId);
            if (currentRequest && currentRequest.status === 'Pending') {
                 approveRequestBtn.disabled = false;
                 denyRequestBtn.disabled = false;
            } else { 
                 approveRequestBtn.disabled = true;
                 denyRequestBtn.disabled = true;
            }
        }
    }
    
    if(approveRequestBtn) approveRequestBtn.addEventListener('click', () => handleProcessRequest('Approved'));
    if(denyRequestBtn) denyRequestBtn.addEventListener('click', () => handleProcessRequest('Denied'));
    if(closeProcessModalBtn) closeProcessModalBtn.addEventListener('click', closeProcessModal);
    if(cancelProcessModalBtn) cancelProcessModalBtn.addEventListener('click', closeProcessModal);
    if(processModal) processModal.addEventListener('click', (event) => {
        if (event.target === processModal) closeProcessModal();
    });


    function renderRequestsTable(requests) {
        if (!requestsContainer) return;
        requestsContainer.innerHTML = ''; 
        if (!requests || requests.length === 0) {
            requestsContainer.innerHTML = '<p>No faculty requests found.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'styled-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Faculty</th>
                    <th>Original Booking (Lab, Time)</th>
                    <th>Requested Change</th>
                    <th>Reason</th>
                    <th>Date Submitted</th>
                    <th>Status</th>
                    <th>Processed By</th>
                    <th>Processed At</th>
                    <th>Admin Remarks</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;
        const tbody = table.querySelector('tbody');
        requests.forEach(req => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${req.request_id}</td>
                <td>${req.faculty_name || 'N/A'}</td>
                <td>${req.original_lab_name || 'N/A'} (${new Date(req.original_start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</td>
                <td title="${req.requested_change_details}">${req.requested_change_details.substring(0,50)}${req.requested_change_details.length > 50 ? '...' : ''}</td>
                <td title="${req.reason}">${req.reason.substring(0,50)}${req.reason.length > 50 ? '...' : ''}</td>
                <td>${new Date(req.request_date).toLocaleString()}</td>
                <td><span class="status-${req.status.toLowerCase()}">${req.status}</span></td>
                <td>${req.processed_by_admin_name || 'N/A'}</td>
                <td>${req.processed_at ? new Date(req.processed_at).toLocaleString() : 'N/A'}</td>
                <td title="${req.admin_remarks || ''}">${(req.admin_remarks || '').substring(0,50)}${(req.admin_remarks || '').length > 50 ? '...' : ''}</td>
                <td>
                    <button class="button button-small button-outline process-request-btn" data-id="${req.request_id}" ${req.status !== 'Pending' ? 'disabled' : ''}>
                        <i data-lucide="${req.status !== 'Pending' ? 'eye' : 'edit'}" class="icon-small"></i> ${req.status !== 'Pending' ? 'View' : 'Process'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        requestsContainer.appendChild(table);
        if(window.lucide) window.lucide.createIcons();

        document.querySelectorAll('.process-request-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const requestId = e.currentTarget.dataset.id;
                const requestToProcess = allFetchedRequests.find(r => r.request_id == requestId);
                if (requestToProcess) {
                    openProcessModal(requestToProcess);
                }
            });
        });
    }

    async function loadAndRenderRequests() {
        const requests = await fetchFacultyRequests();
        renderRequestsTable(requests);
    }

    loadAndRenderRequests();
}

