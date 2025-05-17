
const API_BASE_URL_GRID_VIEW = '/api'; // Relative path

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
    const dialogLabLayoutVisualization = document.getElementById('dialogLabLayoutVisualization');
    const dialogBookButton = document.getElementById('dialogBookButton');
    const dialogCloseButton = document.getElementById('dialogCloseButton'); 
    const dialogCloseButtonSecondary = document.getElementById('dialogCloseButtonSecondary');
    const token = localStorage.getItem('token');

    let currentSelectedLabId = '';
    let currentDate = new Date(); 
    let currentBookingsForGrid = []; 

    async function fetchLabsForSelector() {
        if (!labSelector) return;
        try {
            const response = await fetch(`${API_BASE_URL_GRID_VIEW}/labs`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch labs');
            const labs = await response.json();
            
            labSelector.innerHTML = ''; // Clear previous
            if (labs.length > 0) {
                labs.forEach(lab => {
                    const option = document.createElement('option');
                    option.value = lab.id;
                    option.textContent = `${lab.name} (Capacity: ${lab.capacity})`;
                    labSelector.appendChild(option);
                });
                currentSelectedLabId = labs[0].id;
                labSelector.value = currentSelectedLabId;
                 await renderGrid(); 
            } else {
                labSelector.innerHTML = '<option value="">No labs available</option>';
                if(gridContainer) gridContainer.innerHTML = '<p class="text-muted-foreground">No labs found to display availability.</p>';
            }
        } catch (error) {
            // console.error("Error fetching labs for selector:", error);
            if(gridContainer) gridContainer.innerHTML = `<p class="error-message visible">Error loading labs: ${error.message}</p>`;
        }
    }

    if (labSelector) {
        labSelector.addEventListener('change', async (e) => {
            currentSelectedLabId = e.target.value;
            await renderGrid();
        });
    }

    if (prevWeekBtn) prevWeekBtn.addEventListener('click', async () => {
        currentDate.setDate(currentDate.getDate() - 7);
        await renderGrid();
    });

    if (nextWeekBtn) nextWeekBtn.addEventListener('click', async () => {
        currentDate.setDate(currentDate.getDate() + 7);
        await renderGrid();
    });
    
    if (todayBtn) todayBtn.addEventListener('click', async () => {
        currentDate = new Date();
        await renderGrid();
    });

    function closeDialog() {
        if(slotDetailDialog) slotDetailDialog.classList.remove('open');
    }

    if (dialogCloseButton) dialogCloseButton.addEventListener('click', closeDialog);
    if (dialogCloseButtonSecondary) dialogCloseButtonSecondary.addEventListener('click', closeDialog);

    if (slotDetailDialog) slotDetailDialog.addEventListener('click', (event) => {
        if (event.target === slotDetailDialog) { 
            closeDialog();
        }
    });
    
    function getWeekDateRange(date) {
        const startOfWeek = new Date(date);
        const dayOfWeek = startOfWeek.getDay(); 
        const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999); 
        
        return { start: startOfWeek, end: endOfWeek };
    }

    async function fetchBookingsForGridData(labId, startDate, endDate) {
        if (!labId) return [];
        try {
            // Fetch all bookings and filter client-side for simplicity
            // Ideally, backend would filter: /api/bookings?labId=X&startDate=Y&endDate=Z
            const response = await fetch(`${API_BASE_URL_GRID_VIEW}/bookings`, { // Admin might fetch all
                 headers: { 'Authorization': `Bearer ${token}` } 
            });
            if(!response.ok) throw new Error('Failed to fetch bookings');
            let allBookings = await response.json();
            
            const startDateString = window.formatDateForInput(startDate); // YYYY-MM-DD
            const endDateString = window.formatDateForInput(endDate);   // YYYY-MM-DD

            return allBookings.filter(b => {
                return String(b.labId) === String(labId) && 
                       b.date >= startDateString && b.date <= endDateString;
            });
        } catch (error) {
            // console.error("Error fetching bookings for grid:", error);
            return [];
        }
    }


    async function renderGrid() {
        if (!gridContainer) return;
        if (!currentSelectedLabId) {
             gridContainer.innerHTML = '<p class="text-muted-foreground">Please select a lab to view its availability.</p>';
             if (currentWeekDisplay) currentWeekDisplay.textContent = 'N/A';
             return;
        }
        gridContainer.innerHTML = '<p>Loading grid...</p>'; 

        const { start, end } = getWeekDateRange(currentDate);
        if (currentWeekDisplay) {
            currentWeekDisplay.textContent = `${window.formatDateForDisplay(start)} - ${window.formatDateForDisplay(end)}`;
        }

        currentBookingsForGrid = await fetchBookingsForGridData(currentSelectedLabId, start, end);
        // console.log("Fetched bookings for grid (Lab ID: " + currentSelectedLabId + "):", currentBookingsForGrid);


        gridContainer.innerHTML = ''; 
        gridContainer.style.gridTemplateColumns = `minmax(80px, auto) repeat(${window.DAYS_OF_WEEK_CONST.length}, 1fr)`;
        
        const emptyHeaderCell = document.createElement('div');
        emptyHeaderCell.className = 'lab-grid-header-cell';
        gridContainer.appendChild(emptyHeaderCell);

        const weekDates = [];
        for (let i = 0; i < window.DAYS_OF_WEEK_CONST.length; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'lab-grid-header-cell';
            const currentDayDate = new Date(start);
            currentDayDate.setDate(start.getDate() + i);
            weekDates.push(currentDayDate);
            dayCell.textContent = `${window.DAYS_OF_WEEK_CONST[i]} (${currentDayDate.getDate()})`;
            gridContainer.appendChild(dayCell);
        }

        window.MOCK_TIME_SLOTS_CONST.forEach(slot => { 
            const timeCell = document.createElement('div');
            timeCell.className = 'lab-grid-time-cell';
            timeCell.textContent = slot.displayTime.replace(' - ', '\\n'); // For potential CSS to break line
            gridContainer.appendChild(timeCell);

            weekDates.forEach(date => {
                const cell = document.createElement('div');
                cell.className = 'lab-grid-cell interactive';
                const dateString = window.formatDateForInput(date); 
                
                const booking = currentBookingsForGrid.find(b => 
                    b.date === dateString && 
                    String(b.timeSlotId) === String(slot.id) && 
                    (b.status === 'booked' || b.status === 'pending' || b.status === 'pending-admin-approval')
                );

                const cellStatusSpan = document.createElement('span');
                cellStatusSpan.className = 'lab-grid-cell-status';

                const cellPurposeSpan = document.createElement('span');
                cellPurposeSpan.className = 'lab-grid-cell-purpose';

                const slotDateTime = new Date(`${dateString}T${slot.startTime}`);
                const now = new Date();
                if (slotDateTime < now && !booking) {
                     cell.classList.add('status-past');
                     cellStatusSpan.textContent = 'Past';
                     cell.classList.remove('interactive');
                } else if (booking) {
                    cell.classList.add(`status-${booking.status}`);
                    cellStatusSpan.textContent = booking.status.replace(/-/g, ' ').toUpperCase();
                    cellPurposeSpan.textContent = booking.purpose || `By: ${booking.userName || booking.userId || 'N/A'}`;
                } else {
                    cell.classList.add('status-available');
                    cellStatusSpan.textContent = 'Available';
                }
                
                cell.appendChild(cellStatusSpan);
                cell.appendChild(cellPurposeSpan);

                if (cell.classList.contains('interactive')) {
                    cell.addEventListener('click', () => showSlotDetails(currentSelectedLabId, dateString, slot, booking));
                }
                gridContainer.appendChild(cell);
            });
        });
        if (window.lucide) window.lucide.createIcons(); 
    }

    async function loadSeatStatusesForDialog(labId) {
        try {
            const response = await fetch(`${API_BASE_URL_GRID_VIEW}/labs/${labId}/seats`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                 if (response.status === 404) return {}; 
                 const errorData = await response.json();
                 throw new Error(errorData.msg || 'Failed to fetch seat statuses');
            }
            return await response.json();
        } catch (error) {
            // console.error("Error fetching seat statuses for dialog:", error);
            return {}; 
        }
    }

    function renderDeskWithPersistedStatus(labId, seatIndex, seatStatuses) {
        const deskDiv = document.createElement('div');
        deskDiv.className = 'lab-layout-desk';

        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'armchair');
        
        const seatStatus = seatStatuses[String(seatIndex)] || 'working'; 

        icon.classList.add(seatStatus === 'not-working' ? 'system-not-working' : 'system-working');
        
        deskDiv.appendChild(icon);
        return deskDiv;
    }

    function createDeskSection(labId, totalDesks, desksPerRow, currentSeatIndexRef, seatStatuses) {
        const section = document.createElement('div');
        section.className = 'dialog-lab-layout-section';
        if (totalDesks <= 0) return section; 

        let desksCreated = 0;
        while (desksCreated < totalDesks) {
            const row = document.createElement('div');
            row.className = 'lab-layout-row';
            const desksInThisRow = Math.min(desksPerRow, totalDesks - desksCreated);
            for (let i = 0; i < desksInThisRow; i++) {
                row.appendChild(renderDeskWithPersistedStatus(labId, currentSeatIndexRef.index, seatStatuses));
                currentSeatIndexRef.index++;
                desksCreated++;
            }
            section.appendChild(row);
        }
        return section;
    }

    async function renderLabLayoutVisualization(labId) {
        if (!dialogLabLayoutVisualization) return;
        dialogLabLayoutVisualization.innerHTML = '<p>Loading layout...</p>'; 

        let lab;
        let seatStatuses;
        try {
            const labResponse = await fetch(`${API_BASE_URL_GRID_VIEW}/labs/${labId}`,{
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!labResponse.ok) throw new Error('Failed to fetch lab details');
            lab = await labResponse.json();
            seatStatuses = await loadSeatStatusesForDialog(labId);
        } catch (error) {
            dialogLabLayoutVisualization.innerHTML = `<p class="error-message visible">Error loading layout: ${error.message}</p>`;
            return;
        }
        
        dialogLabLayoutVisualization.innerHTML = ''; 
        const capacity = lab ? lab.capacity : 0;

        const title = document.createElement('h4');
        title.className = 'text-sm font-medium mb-3 text-center text-muted-foreground';
        title.textContent = `Lab Layout for ${capacity} Desks`;
        dialogLabLayoutVisualization.appendChild(title);

        const teacherDeskContainer = document.createElement('div');
        teacherDeskContainer.className = 'lab-layout-teacher-desk';
        const teacherIcon = document.createElement('i');
        teacherIcon.setAttribute('data-lucide', 'user-cog'); 
        teacherDeskContainer.appendChild(teacherIcon);
        const teacherLabel = document.createElement('span');
        teacherLabel.textContent = 'Teacher';
        teacherLabel.className = 'teacher-desk-label';
        teacherDeskContainer.appendChild(teacherLabel);
        dialogLabLayoutVisualization.appendChild(teacherDeskContainer);

        if (capacity === 0) {
            const noDesksMsg = document.createElement('p');
            noDesksMsg.className = 'text-xs text-center text-muted-foreground mt-2';
            noDesksMsg.textContent = 'This lab has no student desks.';
            dialogLabLayoutVisualization.appendChild(noDesksMsg);
            if (window.lucide) window.lucide.createIcons();
            return;
        }
        
        const mainLayoutContainer = document.createElement('div');
        mainLayoutContainer.className = 'dialog-lab-layout-container';

        let numLeftDesks = Math.round(capacity * (25 / 70));
        let numMiddleDesks = Math.round(capacity * (20 / 70));
        let numRightDesks = capacity - numLeftDesks - numMiddleDesks;

        if (numLeftDesks < 0) numLeftDesks = 0;
        if (numMiddleDesks < 0) numMiddleDesks = 0;
        if (numRightDesks < 0) numRightDesks = 0;
        
        let currentTotal = numLeftDesks + numMiddleDesks + numRightDesks;
        let diff = capacity - currentTotal;
        if (diff > 0) { // Distribute remaining capacity
            numLeftDesks += Math.floor(diff / 2);
            numRightDesks += Math.ceil(diff / 2);
        } else if (diff < 0) { // Reduce excess capacity
             let reduceAmount = Math.abs(diff);
             while(reduceAmount > 0) {
                if(numLeftDesks > numMiddleDesks && numLeftDesks > numRightDesks && numLeftDesks > 0) { numLeftDesks--; reduceAmount--; }
                else if (numRightDesks > numMiddleDesks && numRightDesks > 0) { numRightDesks--; reduceAmount--;}
                else if (numMiddleDesks > 0) { numMiddleDesks--; reduceAmount--;}
                else if (numLeftDesks > 0) { numLeftDesks--; reduceAmount--;}
                else { break; } 
             }
        }


        let seatIndexRef = { index: 0 }; 

        mainLayoutContainer.appendChild(createDeskSection(labId, numLeftDesks, 3, seatIndexRef, seatStatuses));
        mainLayoutContainer.appendChild(createDeskSection(labId, numMiddleDesks, 2, seatIndexRef, seatStatuses));
        mainLayoutContainer.appendChild(createDeskSection(labId, numRightDesks, 3, seatIndexRef, seatStatuses));
        
        dialogLabLayoutVisualization.appendChild(mainLayoutContainer);
        if (window.lucide) window.lucide.createIcons();
    }


    async function showSlotDetails(labId, date, timeSlot, booking) {
        let lab;
        try {
            const labResponse = await fetch(`${API_BASE_URL_GRID_VIEW}/labs/${labId}`,{
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!labResponse.ok) throw new Error('Failed to fetch lab details for dialog');
            lab = await labResponse.json();
        } catch(error) {
            alert(`Error loading lab details: ${error.message}`);
            return;
        }

        if (dialogTitle) dialogTitle.textContent = `Details for ${lab.name}`;
        if (dialogDescription) dialogDescription.textContent = `Date: ${window.formatDateForDisplay(new Date(date))}, Time: ${timeSlot.displayTime}`;
        
        if (dialogSlotInfoContainer) dialogSlotInfoContainer.innerHTML = ''; 
        if (dialogBookButton) dialogBookButton.style.display = 'none';

        const now = new Date();
        const slotDateTime = new Date(`${date}T${timeSlot.startTime}`);

        if (slotDateTime < now && !booking) {
            const pStatus = document.createElement('p');
            pStatus.innerHTML = `<strong>Status:</strong> Past (Unavailable for booking)`;
            if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pStatus);
        } else if (booking) {
            const pStatus = document.createElement('p');
            pStatus.innerHTML = `<strong>Status:</strong> <span class="font-bold text-lg">${booking.status.replace(/-/g, ' ').toUpperCase()}</span>`;
           if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pStatus);

            const pPurpose = document.createElement('p');
            pPurpose.innerHTML = `<strong>Purpose:</strong> ${booking.purpose || 'N/A'}`;
            if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pPurpose);

            const pUser = document.createElement('p');
            // userName is joined in the backend query for /api/bookings
            pUser.innerHTML = `<strong>Booked By:</strong> ${booking.userName || booking.userId || 'N/A'} (${booking.requestedByRole || 'N/A'})`;
            if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pUser);

            if (booking.batchIdentifier) {
                const pBatch = document.createElement('p');
                pBatch.innerHTML = `<strong>Batch/Class:</strong> ${booking.batchIdentifier}`;
                if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pBatch);
            }
        } else { 
            const pStatus = document.createElement('p');
            pStatus.innerHTML = `<strong>Status:</strong> <span class="font-bold text-lg text-green-600">Available</span>`;
            if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pStatus);
            
            const currentUserRole = window.getCurrentUserRole(); 
            if ((currentUserRole === window.USER_ROLES_OBJ.FACULTY || currentUserRole === window.USER_ROLES_OBJ.ASSISTANT) && dialogBookButton) { 
                 dialogBookButton.style.display = 'inline-flex';
                 dialogBookButton.onclick = () => {
                    let bookPage = currentUserRole === window.USER_ROLES_OBJ.ASSISTANT ? 'assistant_request_lab.html' : 'book_slot.html';
                    window.location.href = `${bookPage}?labId=${labId}&date=${date}&timeSlotId=${timeSlot.id}`;
                 };
            }
        }
        
        await renderLabLayoutVisualization(labId); 
        if (slotDetailDialog) slotDetailDialog.classList.add('open');
        if (window.lucide) window.lucide.createIcons(); 
    }

    fetchLabsForSelector();
}

// Helper to format date for display (e.g., Jul 18, 2024)
window.formatDateForDisplay = function(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
     if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper to format date for <input type="date"> (YYYY-MM-DD)
window.formatDateForInput = function(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
};


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLabGrid);
} else {
    initializeLabGrid();
}
