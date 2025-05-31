
async function initializeLabGrid() {
    const labSelector = document.getElementById('labSelector');
    const gridContainer = document.getElementById('labAvailabilityGrid');
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    const todayBtn = document.getElementById('todayBtn');
    const currentWeekDisplay = document.getElementById('currentWeekDisplay');

    const slotDetailDialog = document.getElementById('slotDetailDialog');
    const dialogTitle = document.getElementById('dialogTitle');
    const dialogDescription = document.getElementById('dialogDescription');
    const dialogSlotInfoContainer = document.getElementById('dialogSlotInfo');
    const dialogAdminActionsContainer = document.getElementById('dialogAdminActions');
    const dialogLabLayoutVisualization = document.getElementById('dialogLabLayoutVisualization');
    const dialogBookButton = document.getElementById('dialogBookButton');
    const dialogCloseButton = document.getElementById('dialogCloseButton');
    const dialogCloseButtonSecondary = document.getElementById('dialogCloseButtonSecondary');
    const token = localStorage.getItem('token');

    let currentSelectedLabId = '';
    let currentDate = new Date();
    let ALL_BOOKINGS_CACHE_GRID = [];
    let ALL_LABS_CACHE_GRID = [];
    let ALL_LAB_SEAT_STATUSES_CACHE_GRID = {};

    async function fetchLabsForSelector() {
        if (!labSelector) { if (gridContainer) gridContainer.innerHTML = '<p class="error-message visible">Lab selector missing.</p>'; return; }
        if (!token) { if (gridContainer) gridContainer.innerHTML = '<p class="error-message visible">Not authenticated.</p>'; return; }
        try {
            const response = await fetch(`${window.API_BASE_URL}/labs`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) { const errorData = await response.json().catch(() => ({ msg: `Server error: ${response.status}` })); throw new Error(errorData.msg || 'Failed to fetch labs'); }
            ALL_LABS_CACHE_GRID = await response.json();
            labSelector.innerHTML = '';
            if (ALL_LABS_CACHE_GRID.length > 0) {
                ALL_LABS_CACHE_GRID.forEach(lab => {
                    const option = document.createElement('option'); option.value = lab.id;
                    option.textContent = `${lab.name || 'Unnamed Lab'} (Capacity: ${lab.capacity || 'N/A'})`; labSelector.appendChild(option);
                });
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has('labId') && ALL_LABS_CACHE_GRID.some(l => String(l.id) === urlParams.get('labId'))) labSelector.value = urlParams.get('labId');
                currentSelectedLabId = labSelector.value || ALL_LABS_CACHE_GRID[0].id; labSelector.value = currentSelectedLabId;
            } else {
                labSelector.innerHTML = '<option value="">No labs available</option>';
                if (gridContainer) gridContainer.innerHTML = '<p class="text-muted-foreground">No labs found.</p>';
            }
        } catch (error) { if (gridContainer) gridContainer.innerHTML = `<p class="error-message visible">Error loading labs: ${error.message}</p>`; }
    }

    async function fetchBookingsForGrid() {
        if (!token) { if (gridContainer) gridContainer.innerHTML = '<p class="error-message visible">Not authenticated.</p>'; ALL_BOOKINGS_CACHE_GRID = []; await renderGrid(); return; }
        try {
            const response = await fetch(`${window.API_BASE_URL}/bookings`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) { const errorData = await response.json().catch(() => ({ msg: `Server error: ${response.status}` })); throw new Error(errorData.msg || 'Failed to fetch bookings'); }
            ALL_BOOKINGS_CACHE_GRID = await response.json(); await renderGrid();
        } catch (error) { ALL_BOOKINGS_CACHE_GRID = []; if (gridContainer) gridContainer.innerHTML = `<p class="error-message visible">Error loading bookings: ${error.message}.</p>`; await renderGrid(); }
    }

    if (labSelector) labSelector.addEventListener('change', async (e) => { currentSelectedLabId = e.target.value; await renderGrid(); });
    if (prevWeekBtn) prevWeekBtn.addEventListener('click', async () => { currentDate.setDate(currentDate.getDate() - 7); await renderGrid(); });
    if (nextWeekBtn) nextWeekBtn.addEventListener('click', async () => { currentDate.setDate(currentDate.getDate() + 7); await renderGrid(); });
    if (todayBtn) todayBtn.addEventListener('click', async () => { currentDate = new Date(); await renderGrid(); });
    function closeDialog() { if (slotDetailDialog) slotDetailDialog.classList.remove('open'); const modifyUI = slotDetailDialog.querySelector('.modify-purpose-ui'); if (modifyUI) modifyUI.remove(); }
    if (dialogCloseButton) dialogCloseButton.addEventListener('click', closeDialog);
    if (dialogCloseButtonSecondary) dialogCloseButtonSecondary.addEventListener('click', closeDialog);
    if (slotDetailDialog) slotDetailDialog.addEventListener('click', (event) => { if (event.target === slotDetailDialog) closeDialog(); });

    function getWeekDateRange(date) {
        const startOfWeek = new Date(date); const dayOfWeek = startOfWeek.getDay(); const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startOfWeek.setDate(diff); startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(startOfWeek.getDate() + 6); endOfWeek.setHours(23, 59, 59, 999);
        return { start: startOfWeek, end: endOfWeek };
    }

    function getBookingsForGridData(labId, startDate, endDate) {
        if (!labId || !ALL_BOOKINGS_CACHE_GRID || !Array.isArray(ALL_BOOKINGS_CACHE_GRID)) return [];
        const startDateString = window.formatDate(startDate); const endDateString = window.formatDate(endDate);
        return ALL_BOOKINGS_CACHE_GRID.filter(b => {
            if (!b || !b.date || String(b.labId) !== String(labId)) return false;
            const bookingDateOnly = window.formatDate(new Date(String(b.date).replace(/-/g, '\/')));
            return bookingDateOnly >= startDateString && bookingDateOnly <= endDateString;
        });
    }

    async function renderGrid() {
        if (!gridContainer) return;
        if (!currentSelectedLabId && ALL_LABS_CACHE_GRID.length > 0) { currentSelectedLabId = ALL_LABS_CACHE_GRID[0].id; if (labSelector) labSelector.value = currentSelectedLabId; } 
        else if (!currentSelectedLabId) { gridContainer.innerHTML = '<p class="text-muted-foreground">Select a lab.</p>'; if (currentWeekDisplay) currentWeekDisplay.textContent = 'N/A'; return; }
        if (gridContainer && !gridContainer.querySelector('.error-message.visible')) gridContainer.innerHTML = '<p>Loading grid...</p>';
        const { start, end } = getWeekDateRange(currentDate);
        if (currentWeekDisplay) currentWeekDisplay.textContent = `${window.formatDateForDisplay(start)} - ${window.formatDateForDisplay(end)}`;
        const currentBookingsForSelectedLabAndWeek = getBookingsForGridData(currentSelectedLabId, start, end);
        gridContainer.innerHTML = ''; gridContainer.style.gridTemplateColumns = `minmax(80px, auto) repeat(${window.DAYS_OF_WEEK.length}, 1fr)`;
        const emptyHeaderCell = document.createElement('div'); emptyHeaderCell.className = 'lab-grid-header-cell'; gridContainer.appendChild(emptyHeaderCell);
        const weekDates = [];
        for (let i = 0; i < window.DAYS_OF_WEEK.length; i++) {
            const dayCell = document.createElement('div'); dayCell.className = 'lab-grid-header-cell';
            const currentDayDate = new Date(start); currentDayDate.setDate(start.getDate() + i); weekDates.push(currentDayDate);
            dayCell.textContent = `${window.DAYS_OF_WEEK[i]} (${currentDayDate.getDate()})`; gridContainer.appendChild(dayCell);
        }
        const now = new Date();
        window.MOCK_TIME_SLOTS.forEach(slot => {
            const timeCell = document.createElement('div'); timeCell.className = 'lab-grid-time-cell'; timeCell.textContent = slot.displayTime.replace(' - ', '\n'); gridContainer.appendChild(timeCell);
            weekDates.forEach(dateInWeek => {
                const cell = document.createElement('div'); cell.className = 'lab-grid-cell interactive'; const dateString = window.formatDate(dateInWeek);
                const booking = currentBookingsForSelectedLabAndWeek.find(b => b.date === dateString && String(b.timeSlotId) === String(slot.id) && (['booked', 'pending', 'pending-admin-approval', 'approved-by-admin'].includes(b.status)));
                const cellStatusSpan = document.createElement('span'); cellStatusSpan.className = 'lab-grid-cell-status';
                const cellPurposeSpan = document.createElement('span'); cellPurposeSpan.className = 'lab-grid-cell-purpose';
                const [endHours, endMinutes] = slot.endTime.split(':').map(Number);
                const slotEndDateTime = new Date(dateInWeek.getFullYear(), dateInWeek.getMonth(), dateInWeek.getDate(), endHours, endMinutes);
                if (slotEndDateTime < now && !booking) { cell.classList.add('status-past'); cellStatusSpan.textContent = 'Past'; cell.classList.remove('interactive'); } 
                else if (booking) {
                    cell.classList.add(`status-${String(booking.status).toLowerCase().replace(/-/g, '_')}`);
                    cellStatusSpan.textContent = booking.status ? booking.status.replace(/-/g, ' ').toUpperCase() : 'N/A';
                    let purposeText = booking.purpose || `By: ${booking.userName || 'N/A'}`;
                    if (booking.courseName && booking.sectionName) purposeText = `${booking.courseName} - ${booking.sectionName}`;
                    else if(booking.courseName) purposeText = booking.courseName;
                    cellPurposeSpan.textContent = purposeText;
                } else { cell.classList.add('status-available'); cellStatusSpan.textContent = 'Available'; }
                cell.appendChild(cellStatusSpan); cell.appendChild(cellPurposeSpan);
                if (cell.classList.contains('interactive')) cell.addEventListener('click', () => showSlotDetails(currentSelectedLabId, dateString, slot, booking));
                gridContainer.appendChild(cell);
            });
        });
        if (window.lucide) window.lucide.createIcons();
    }

    async function loadSeatStatusesForDialog(labId) {
        if (!labId || !token) return {};
        try {
            const response = await fetch(`${window.API_BASE_URL}/labs/${labId}/seats`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) {
                if (response.status === 404) { ALL_LAB_SEAT_STATUSES_CACHE_GRID[labId] = {}; return {}; }
                const errorData = await response.json().catch(() => ({ msg: `Server error: ${response.status}` }));
                console.error(`Failed to fetch seat statuses for lab ${labId} in dialog: ${errorData.msg}`);
                return ALL_LAB_SEAT_STATUSES_CACHE_GRID[labId] || {};
            }
            const statuses = await response.json(); ALL_LAB_SEAT_STATUSES_CACHE_GRID[labId] = statuses; return statuses;
        } catch (error) { console.error(`Error fetching seat statuses for lab ${labId} in dialog:`, error); return ALL_LAB_SEAT_STATUSES_CACHE_GRID[labId] || {}; }
    }

    function renderDeskWithPersistedStatus(labId, seatNumber, seatStatuses) {
        const deskDiv = document.createElement('div'); deskDiv.className = 'lab-layout-desk';
        const icon = document.createElement('i'); icon.setAttribute('data-lucide', 'armchair');
        const seatStatus = seatStatuses && seatStatuses[String(seatNumber)] ? seatStatuses[String(seatNumber)] : 'working';
        icon.classList.add(seatStatus === 'not-working' ? 'system-not-working' : 'system-working');
        deskDiv.appendChild(icon); return deskDiv;
    }

    function createDeskSection(labId, totalDesksInSec, desksPerRow, currentSeatIndexRef, seatStatuses, labCapacity) {
        const section = document.createElement('div'); section.className = 'dialog-lab-layout-section';
        if (totalDesksInSec <= 0) return section; let desksRenderedInSec = 0;
        while (desksRenderedInSec < totalDesksInSec) {
            const row = document.createElement('div'); row.className = 'lab-layout-row';
            const desksInThisRow = Math.min(desksPerRow, totalDesksInSec - desksRenderedInSec);
            for (let i = 0; i < desksInThisRow; i++) {
                if (currentSeatIndexRef.index >= labCapacity) break;
                row.appendChild(renderDeskWithPersistedStatus(labId, currentSeatIndexRef.index, seatStatuses));
                currentSeatIndexRef.index++; desksRenderedInSec++;
            }
            section.appendChild(row); if (currentSeatIndexRef.index >= labCapacity) break;
        }
        return section;
    }

    async function renderLabLayoutVisualization(labId) {
        if (!dialogLabLayoutVisualization || !token) { if (dialogLabLayoutVisualization) dialogLabLayoutVisualization.innerHTML = '<p class="error-message visible">Error preparing layout viewer.</p>'; return { workingSystems: 0, notWorkingSystems: 0 }; }
        dialogLabLayoutVisualization.innerHTML = '<p>Loading layout...</p>'; let lab;
        try {
            const labResponse = await fetch(`${window.API_BASE_URL}/labs/${labId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!labResponse.ok) { const errorData = await labResponse.json().catch(() => ({ msg: 'Failed to fetch lab details for layout.' })); throw new Error(errorData.msg); }
            lab = await labResponse.json();
        } catch (error) { dialogLabLayoutVisualization.innerHTML = `<p class="error-message visible">Error loading lab details: ${error.message}</p>`; return { workingSystems: 0, notWorkingSystems: 0 }; }
        if (!lab || typeof lab.capacity === 'undefined') { dialogLabLayoutVisualization.innerHTML = `<p class="error-message visible">Lab details or capacity not found.</p>`; return { workingSystems: 0, notWorkingSystems: 0 }; }
        const seatStatuses = await loadSeatStatusesForDialog(labId); dialogLabLayoutVisualization.innerHTML = '';
        const capacity = lab.capacity || 0; let workingSystems = 0; let notWorkingSystems = 0;
        for (let i = 0; i < capacity; i++) { const status = seatStatuses[String(i)] || 'working'; if (status === 'working') workingSystems++; else notWorkingSystems++; }
        const summaryContainer = document.createElement('div'); summaryContainer.className = 'lab-system-status-summary';
        summaryContainer.innerHTML = `<p><strong>Capacity:</strong> ${capacity}</p><p><span class="legend-icon-working"><i data-lucide="check-circle"></i></span> <strong>Working Systems:</strong> ${workingSystems}</p><p><span class="legend-icon-not-working"><i data-lucide="x-circle"></i></span> <strong>Non-Working Systems:</strong> ${notWorkingSystems}</p>`;
        dialogLabLayoutVisualization.appendChild(summaryContainer);
        const title = document.createElement('h4'); title.className = 'text-sm font-medium mb-3 text-center text-muted-foreground'; title.textContent = `Lab Layout for ${capacity} Desk${capacity !== 1 ? 's' : ''}`; dialogLabLayoutVisualization.appendChild(title);
        const teacherDeskContainer = document.createElement('div'); teacherDeskContainer.className = 'lab-layout-teacher-desk';
        const teacherIcon = document.createElement('i'); teacherIcon.setAttribute('data-lucide', 'user-cog'); teacherDeskContainer.appendChild(teacherIcon);
        const teacherLabel = document.createElement('span'); teacherLabel.textContent = 'Teacher'; teacherLabel.className = 'teacher-desk-label'; teacherDeskContainer.appendChild(teacherLabel); dialogLabLayoutVisualization.appendChild(teacherDeskContainer);
        if (capacity === 0) { const noDesksMsg = document.createElement('p'); noDesksMsg.className = 'text-xs text-center text-muted-foreground mt-2'; noDesksMsg.textContent = 'This lab has no student desks.'; dialogLabLayoutVisualization.appendChild(noDesksMsg); if (window.lucide) window.lucide.createIcons(); return { workingSystems, notWorkingSystems }; }
        const mainLayoutContainer = document.createElement('div'); mainLayoutContainer.className = 'dialog-lab-layout-container';
        let numLeftDesks = Math.round(capacity * (25 / 70)); let numMiddleDesks = Math.round(capacity * (20 / 70)); let numRightDesks = capacity - numLeftDesks - numMiddleDesks;
        let currentTotalDesks = numLeftDesks + numMiddleDesks + numRightDesks;
        if (currentTotalDesks !== capacity && capacity > 0) {
            let diff = capacity - currentTotalDesks;
             if (numLeftDesks + Math.ceil(diff/2) >= 0 && numRightDesks + Math.floor(diff/2) >=0) { numLeftDesks += Math.ceil(diff/2); numRightDesks += Math.floor(diff/2); } 
             else if (numLeftDesks + diff >=0) { numLeftDesks += diff; } else if (numMiddleDesks + diff >=0) { numMiddleDesks += diff; } else { numRightDesks += diff; }
        }
        numLeftDesks = Math.max(0, numLeftDesks); numMiddleDesks = Math.max(0, numMiddleDesks); numRightDesks = Math.max(0, numRightDesks);
        let seatIndexRef = { index: 0 };
        mainLayoutContainer.appendChild(createDeskSection(labId, numLeftDesks, 3, seatIndexRef, seatStatuses, capacity));
        mainLayoutContainer.appendChild(createDeskSection(labId, numMiddleDesks, 2, seatIndexRef, seatStatuses, capacity));
        mainLayoutContainer.appendChild(createDeskSection(labId, numRightDesks, 3, seatIndexRef, seatStatuses, capacity));
        dialogLabLayoutVisualization.appendChild(mainLayoutContainer); if (window.lucide) window.lucide.createIcons(); return { workingSystems, notWorkingSystems };
    }

    async function handleAdminCancelBooking(bookingId) {
        if (!bookingId || !token) { alert("Error: Booking ID or token missing."); return; }
        if (!confirm("Cancel this booking?")) return;
        try {
            const response = await fetch(`${window.API_BASE_URL}/bookings/${bookingId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (response.ok) { alert(result.msg || "Booking cancelled."); closeDialog(); await fetchBookingsForGrid(); } 
            else { alert(`Failed to cancel: ${result.msg || 'Server error'}`); }
        } catch (error) { alert(`An error occurred: ${error.message}`); }
    }
    async function handleAdminModifyBookingPurpose(bookingId, currentPurpose, labId) {
        if (!dialogAdminActionsContainer || !token) return;
        const existingModUI = dialogAdminActionsContainer.querySelector('.modify-purpose-ui'); if (existingModUI) existingModUI.remove();
        const modifyUI = document.createElement('div'); modifyUI.className = 'modify-purpose-ui';
        const purposeLabel = document.createElement('label'); purposeLabel.htmlFor = 'editBookingPurpose'; purposeLabel.textContent = 'New Purpose:';
        const purposeInput = document.createElement('input'); purposeInput.type = 'text'; purposeInput.id = 'editBookingPurpose'; purposeInput.value = currentPurpose || '';
        const buttonContainer = document.createElement('div'); buttonContainer.style.marginTop = '0.5rem'; buttonContainer.style.display = 'flex'; buttonContainer.style.gap = '0.5rem';
        const saveButton = document.createElement('button'); saveButton.type = 'button'; saveButton.textContent = 'Save Purpose'; saveButton.className = 'button button-primary button-sm';
        saveButton.onclick = async () => {
            const newPurpose = purposeInput.value.trim(); if (!newPurpose) { alert("Purpose cannot be empty."); return; }
            try {
                const response = await fetch(`${window.API_BASE_URL}/bookings/${bookingId}/purpose`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ purpose: newPurpose }) });
                const result = await response.json();
                if (response.ok) {
                    alert("Purpose updated!"); const purposeDisplay = document.getElementById(`bookingPurposeDisplay-${bookingId}`); // Specific ID on display element
                    if (purposeDisplay) purposeDisplay.innerHTML = `<strong>Purpose:</strong> ${newPurpose}`;
                    ALL_BOOKINGS_CACHE_GRID = ALL_BOOKINGS_CACHE_GRID.map(b => b.id === bookingId ? { ...b, purpose: newPurpose } : b);
                    await renderGrid(); modifyUI.remove();
                } else { alert(`Failed to update: ${result.msg || 'Server error'}`); }
            } catch (error) { alert(`Error: ${error.message}`); }
        };
        const cancelButton = document.createElement('button'); cancelButton.type = 'button'; cancelButton.textContent = 'Cancel'; cancelButton.className = 'button button-outline button-sm'; cancelButton.onclick = () => modifyUI.remove();
        buttonContainer.appendChild(saveButton); buttonContainer.appendChild(cancelButton);
        modifyUI.appendChild(purposeLabel); modifyUI.appendChild(purposeInput); modifyUI.appendChild(buttonContainer);
        dialogAdminActionsContainer.appendChild(modifyUI); if (window.lucide) window.lucide.createIcons();
    }

    async function showSlotDetails(labId, dateString, timeSlot, booking) {
        if (!token) { alert("Not authenticated."); return; }
        const lab = ALL_LABS_CACHE_GRID.find(l => String(l.id) === String(labId)); if (!lab) { alert('Error: Lab details not loaded.'); return; }
        const parsedDateForDisplay = new Date(String(dateString).replace(/-/g, '\/'));
        if (dialogTitle) dialogTitle.textContent = `Details for ${lab.name || 'Unknown Lab'}`;
        if (dialogDescription) dialogDescription.textContent = `Date: ${window.formatDateForDisplay(parsedDateForDisplay)}, Time: ${timeSlot.displayTime}`;
        if (dialogSlotInfoContainer) dialogSlotInfoContainer.innerHTML = '';
        if (dialogAdminActionsContainer) { dialogAdminActionsContainer.innerHTML = ''; dialogAdminActionsContainer.style.display = 'none'; }
        if (dialogBookButton) dialogBookButton.style.display = 'none';
        const currentUserRole = window.getCurrentUserRole(); const now = new Date(); const [endHours, endMinutes] = timeSlot.endTime.split(':').map(Number);
        const slotDateObject = new Date(String(dateString).replace(/-/g, '\/')); const slotEndDateTime = new Date(slotDateObject.getFullYear(), slotDateObject.getMonth(), slotDateObject.getDate(), endHours, endMinutes);
        const { workingSystems, notWorkingSystems } = await renderLabLayoutVisualization(labId);
        if (slotEndDateTime < now && !booking) { const pStatus = document.createElement('p'); pStatus.innerHTML = `<strong>Status:</strong> Past (Unavailable)`; if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pStatus); } 
        else if (booking) {
            const pStatus = document.createElement('p'); pStatus.innerHTML = `<strong>Status:</strong> <span class="font-bold text-lg">${booking.status ? String(booking.status).replace(/-/g, ' ').toUpperCase() : 'N/A'}</span>`; if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pStatus);
            const pPurpose = document.createElement('p'); pPurpose.id = `bookingPurposeDisplay-${booking.id}`; 
            let purposeText = booking.purpose || 'N/A';
            if (booking.courseName && booking.sectionName) purposeText = `${booking.courseName} - ${booking.sectionName} (${purposeText})`;
            else if(booking.courseName) purposeText = `${booking.courseName} (${purposeText})`;
            pPurpose.innerHTML = `<strong>Purpose/Section:</strong> ${purposeText}`; if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pPurpose);
            const pUser = document.createElement('p'); pUser.innerHTML = `<strong>Booked By:</strong> ${booking.userName || 'N/A'} (Role: ${booking.userRole || 'N/A'})`; if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pUser);
            if (currentUserRole === window.USER_ROLES.ADMIN && dialogAdminActionsContainer) {
                dialogAdminActionsContainer.style.display = 'flex'; dialogAdminActionsContainer.innerHTML = '';
                const cancelButtonAdmin = document.createElement('button'); cancelButtonAdmin.className = 'button button-secondary button-sm mr-2'; cancelButtonAdmin.innerHTML = '<i data-lucide="trash-2" class="mr-1 h-4 w-4"></i>Cancel Booking'; cancelButtonAdmin.onclick = () => handleAdminCancelBooking(booking.id); dialogAdminActionsContainer.appendChild(cancelButtonAdmin);
                const modifyButtonAdmin = document.createElement('button'); modifyButtonAdmin.className = 'button button-outline button-sm'; modifyButtonAdmin.innerHTML = '<i data-lucide="edit-3" class="mr-1 h-4 w-4"></i>Modify Purpose'; modifyButtonAdmin.onclick = () => handleAdminModifyBookingPurpose(booking.id, booking.purpose, labId); dialogAdminActionsContainer.appendChild(modifyButtonAdmin);
            }
        } else {
            const pStatus = document.createElement('p'); pStatus.innerHTML = `<strong>Status:</strong> <span class="font-bold text-lg text-green-600">Available</span>`; if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pStatus);
            if (workingSystems === 0) { const pWarning = document.createElement('p'); pWarning.className = 'slot-detail-warning'; pWarning.innerHTML = `<strong>Warning:</strong> 0 working systems. Booking may not be suitable.`; if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pWarning); }
            if ((currentUserRole === window.USER_ROLES.FACULTY || currentUserRole === window.USER_ROLES.ADMIN) && dialogBookButton) {
                dialogBookButton.style.display = 'inline-flex'; dialogBookButton.textContent = currentUserRole === window.USER_ROLES.ADMIN ? 'Admin: Create Booking' : 'Book This Slot';
                dialogBookButton.onclick = () => {
                    if (workingSystems === 0 && !confirm("Warning: 0 working systems. Proceed?")) return;
                    window.location.href = `book_slot.html?labId=${labId}&date=${dateString}&timeSlotId=${timeSlot.id}`;
                };
            }
        }
        if (slotDetailDialog) slotDetailDialog.classList.add('open'); if (window.lucide) window.lucide.createIcons();
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', async () => { await fetchLabsForSelector(); const urlParams = new URLSearchParams(window.location.search); if (urlParams.has('date')) { const dateFromParam = new Date(String(urlParams.get('date')).replace(/-/g, '\/')); if (!isNaN(dateFromParam.getTime())) currentDate = dateFromParam; } await fetchBookingsForGrid(); }); } 
    else { (async () => { await fetchLabsForSelector(); const urlParams = new URLSearchParams(window.location.search); if (urlParams.has('date')) { const dateFromParam = new Date(String(urlParams.get('date')).replace(/-/g, '\/')); if (!isNaN(dateFromParam.getTime())) currentDate = dateFromParam; } await fetchBookingsForGrid(); })(); }
}
initializeLabGrid();
    