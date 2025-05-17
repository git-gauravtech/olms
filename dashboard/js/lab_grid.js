
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
    const dialogCloseButtonSecondary = document.getElementById('dialogCloseButtonSecondary'); // In footer
    const token = localStorage.getItem('token');

    let currentSelectedLabId = '';
    let currentDate = new Date(); 
    let ALL_BOOKINGS_CACHE = []; // Cache for all bookings to avoid re-fetching constantly for filtering
    let ALL_LABS_CACHE = []; // Cache for lab details

    async function fetchLabsForSelector() {
        if (!labSelector) return;
        try {
            const response = await fetch(`${window.API_BASE_URL}/labs`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch labs');
            ALL_LABS_CACHE = await response.json();
            
            labSelector.innerHTML = ''; 
            if (ALL_LABS_CACHE.length > 0) {
                ALL_LABS_CACHE.forEach(lab => {
                    const option = document.createElement('option');
                    option.value = lab.id;
                    option.textContent = `${lab.name} (Capacity: ${lab.capacity})`;
                    labSelector.appendChild(option);
                });
                currentSelectedLabId = ALL_LABS_CACHE[0].id; // Default to first lab
                labSelector.value = currentSelectedLabId;
                 await renderGrid(); 
            } else {
                labSelector.innerHTML = '<option value="">No labs available</option>';
                if(gridContainer) gridContainer.innerHTML = '<p class="text-muted-foreground">No labs found to display availability.</p>';
            }
        } catch (error) {
            if(gridContainer) gridContainer.innerHTML = `<p class="error-message visible">Error loading labs: ${error.message}</p>`;
        }
    }

    async function fetchAllBookingsOnce() {
        try {
            const response = await fetch(`${window.API_BASE_URL}/bookings`, {
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (!response.ok) throw new Error('Failed to fetch bookings');
            ALL_BOOKINGS_CACHE = await response.json();
        } catch (error) {
            // console.error("Error fetching all bookings for cache:", error);
            ALL_BOOKINGS_CACHE = []; // Reset on error
        }
    }

    if (labSelector) {
        labSelector.addEventListener('change', async (e) => {
            currentSelectedLabId = e.target.value;
            await renderGrid(); // This will use cached bookings but filter for the new labId
        });
    }

    // Navigation button listeners
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

    // Dialog close listeners
    function closeDialog() {
        if(slotDetailDialog) slotDetailDialog.classList.remove('open');
    }
    if (dialogCloseButton) dialogCloseButton.addEventListener('click', closeDialog);
    if (dialogCloseButtonSecondary) dialogCloseButtonSecondary.addEventListener('click', closeDialog);
    if (slotDetailDialog) slotDetailDialog.addEventListener('click', (event) => {
        if (event.target === slotDetailDialog) closeDialog();
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

    function getBookingsForGridData(labId, startDate, endDate) {
        if (!labId || !ALL_BOOKINGS_CACHE) return [];
        
        const startDateString = window.formatDate(startDate); // YYYY-MM-DD
        const endDateString = window.formatDate(endDate);   // YYYY-MM-DD

        return ALL_BOOKINGS_CACHE.filter(b => {
            return String(b.labId) === String(labId) && 
                   b.date >= startDateString && b.date <= endDateString;
        });
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

        const currentBookingsForSelectedLabAndWeek = getBookingsForGridData(currentSelectedLabId, start, end);

        gridContainer.innerHTML = ''; 
        gridContainer.style.gridTemplateColumns = `minmax(80px, auto) repeat(${window.DAYS_OF_WEEK.length}, 1fr)`;
        
        const emptyHeaderCell = document.createElement('div');
        emptyHeaderCell.className = 'lab-grid-header-cell';
        gridContainer.appendChild(emptyHeaderCell);

        const weekDates = [];
        for (let i = 0; i < window.DAYS_OF_WEEK.length; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'lab-grid-header-cell';
            const currentDayDate = new Date(start);
            currentDayDate.setDate(start.getDate() + i);
            weekDates.push(currentDayDate);
            dayCell.textContent = `${window.DAYS_OF_WEEK[i]} (${currentDayDate.getDate()})`;
            gridContainer.appendChild(dayCell);
        }

        window.MOCK_TIME_SLOTS.forEach(slot => { 
            const timeCell = document.createElement('div');
            timeCell.className = 'lab-grid-time-cell';
            timeCell.textContent = slot.displayTime.replace(' - ', '\\n');
            gridContainer.appendChild(timeCell);

            weekDates.forEach(date => {
                const cell = document.createElement('div');
                cell.className = 'lab-grid-cell interactive';
                const dateString = window.formatDate(date); 
                
                const booking = currentBookingsForSelectedLabAndWeek.find(b => 
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
                if (slotDateTime < now && !booking) { // Check if slot is in the past
                     cell.classList.add('status-past');
                     cellStatusSpan.textContent = 'Past';
                     cell.classList.remove('interactive');
                } else if (booking) {
                    cell.classList.add(`status-${booking.status.toLowerCase()}`); // Ensure lowercase for class name consistency
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

    let ALL_LAB_SEAT_STATUSES_CACHE = {}; // Cache for seat statuses

    async function loadSeatStatusesForDialog(labId) {
        if (ALL_LAB_SEAT_STATUSES_CACHE[labId]) { // Check cache first
            return ALL_LAB_SEAT_STATUSES_CACHE[labId];
        }
        try {
            const response = await fetch(`${window.API_BASE_URL}/labs/${labId}/seats`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                 if (response.status === 404) { // No statuses set yet
                    ALL_LAB_SEAT_STATUSES_CACHE[labId] = {};
                    return {}; 
                 }
                 const errorData = await response.json();
                 throw new Error(errorData.msg || 'Failed to fetch seat statuses');
            }
            const statuses = await response.json();
            ALL_LAB_SEAT_STATUSES_CACHE[labId] = statuses; // Store in cache
            return statuses;
        } catch (error) {
            // console.error("Error fetching seat statuses for dialog:", error);
            ALL_LAB_SEAT_STATUSES_CACHE[labId] = {}; // Store empty on error to avoid re-fetch
            return {}; 
        }
    }

    function renderDeskWithPersistedStatus(labId, seatIndex, seatStatuses) {
        const deskDiv = document.createElement('div');
        deskDiv.className = 'lab-layout-desk';

        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'armchair');
        
        const seatStatus = seatStatuses[String(seatIndex)] || 'working'; // Default to working if not specified

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
                // Pass the seatStatuses to the rendering function
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

        const lab = ALL_LABS_CACHE.find(l => String(l.id) === String(labId));
        if (!lab) {
            dialogLabLayoutVisualization.innerHTML = `<p class="error-message visible">Lab details not found.</p>`;
            return;
        }
        
        const seatStatuses = await loadSeatStatusesForDialog(labId);
        
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
        if (diff > 0) { 
            numLeftDesks += Math.floor(diff / 2);
            numRightDesks += Math.ceil(diff / 2);
        } else if (diff < 0) { 
             let reduceAmount = Math.abs(diff);
             while(reduceAmount > 0) {
                if(numLeftDesks > numMiddleDesks && numLeftDesks > numRightDesks && numLeftDesks > 0) { numLeftDesks--; reduceAmount--; }
                else if (numRightDesks > numMiddleDesks && numRightDesks > 0) { numRightDesks--; reduceAmount--;}
                else if (numMiddleDesks > 0) { numMiddleDesks--; reduceAmount--;}
                else if (numLeftDesks > 0) { numLeftDesks--; reduceAmount--;}
                else if (numRightDesks > 0) { numRightDesks--; reduceAmount--;}
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
        const lab = ALL_LABS_CACHE.find(l => String(l.id) === String(labId));
        if (!lab) {
            alert('Error: Lab details could not be loaded for the dialog.');
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
            if ((currentUserRole === window.USER_ROLES.FACULTY || currentUserRole === window.USER_ROLES.ASSISTANT) && dialogBookButton) { 
                 dialogBookButton.style.display = 'inline-flex';
                 dialogBookButton.onclick = () => {
                    let bookPage = currentUserRole === window.USER_ROLES.ASSISTANT ? 'assistant_request_lab.html' : 'book_slot.html';
                    window.location.href = `${bookPage}?labId=${labId}&date=${date}&timeSlotId=${timeSlot.id}`;
                 };
            }
        }
        
        await renderLabLayoutVisualization(labId); 
        if (slotDetailDialog) slotDetailDialog.classList.add('open');
        if (window.lucide) window.lucide.createIcons(); 
    }
    
    // Initial fetch of all data
    await fetchAllBookingsOnce(); // Fetch all bookings once on page load
    await fetchLabsForSelector(); // This will also trigger the first renderGrid
    
    // Set query params from URL if present
    const urlParams = new URLSearchParams(window.location.search);
    if (labSelector && urlParams.has('labId') && ALL_LABS_CACHE.find(l => l.id == urlParams.get('labId'))) {
        labSelector.value = urlParams.get('labId');
        currentSelectedLabId = urlParams.get('labId');
    }
    if (urlParams.has('date')) {
        // Validate date format if necessary
        const dateFromParam = new Date(urlParams.get('date'));
        if (!isNaN(dateFromParam.getTime())) {
            currentDate = dateFromParam;
        }
    }
    // After setting params, re-render if anything changed from default
    await renderGrid();
}

// Helper to format date for display (e.g., Jul 18, 2024)
window.formatDateForDisplay = function(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
     if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper to format date for <input type="date"> (YYYY-MM-DD) - already in constants.js but ensure availability
if (!window.formatDate) {
    window.formatDate = function(date) {
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
}


if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLabGrid);
} else {
    initializeLabGrid();
}

    