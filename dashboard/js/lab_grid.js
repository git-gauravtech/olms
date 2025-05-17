
const API_BASE_URL_GRID = 'http://localhost:5001/api'; // Adjust if needed

function initializeLabGrid() {
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


    let currentSelectedLabId = '';
    let currentDate = new Date(); 
    let ALL_LAB_SEAT_STATUSES_CACHE = {}; 
    let currentBookingsForGrid = []; // Cache bookings for selected lab & week

    async function fetchLabsForSelector() {
        if (!labSelector) return;
        try {
            const response = await fetch(`${API_BASE_URL_GRID}/labs`, {
                 headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) throw new Error('Failed to fetch labs');
            const labs = await response.json();
            
            labs.forEach(lab => {
                const option = document.createElement('option');
                option.value = lab.id;
                option.textContent = `${lab.name} (Capacity: ${lab.capacity})`;
                labSelector.appendChild(option);
            });
            if (labs.length > 0) {
                currentSelectedLabId = labs[0].id;
                labSelector.value = currentSelectedLabId;
                await renderGrid(); // Initial render
            }
        } catch (error) {
            console.error("Error fetching labs for selector:", error);
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
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
        startOfWeek.setDate(diff);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        return { start: startOfWeek, end: endOfWeek };
    }

    async function fetchBookingsForGrid(labId, startDate, endDate) {
        if (!labId) return [];
        // In a real app, you'd filter by date range on the backend
        // For now, fetching all and filtering client-side for simplicity with current backend
        try {
            const response = await fetch(`${API_BASE_URL_GRID}/bookings?labId=${labId}`, { // Hypothetical labId filter
                 headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if(!response.ok) throw new Error('Failed to fetch bookings');
            const allBookings = await response.json();
            // Filter client-side by labId (if backend doesn't) and date range
            return allBookings.filter(b => {
                const bookingDate = new Date(b.date);
                return b.labId == labId && // Ensure labId matches (== because one might be string, other number)
                       bookingDate >= startDate && bookingDate <= endDate;
            });
        } catch (error) {
            console.error("Error fetching bookings for grid:", error);
            return [];
        }
    }


    async function renderGrid() {
        if (!currentSelectedLabId || !gridContainer) return;
        gridContainer.innerHTML = '<p>Loading grid...</p>'; 

        const { start, end } = getWeekDateRange(currentDate);
        if (currentWeekDisplay) {
            currentWeekDisplay.textContent = `${window.formatDate(start)} - ${window.formatDate(end)}`;
        }

        currentBookingsForGrid = await fetchBookingsForGrid(currentSelectedLabId, start, end);

        gridContainer.innerHTML = ''; // Clear loading
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

        window.MOCK_TIME_SLOTS.forEach(slot => { // Assuming MOCK_TIME_SLOTS is globally available
            const timeCell = document.createElement('div');
            timeCell.className = 'lab-grid-time-cell';
            timeCell.textContent = slot.displayTime.replace(' - ', '\\n');
            gridContainer.appendChild(timeCell);

            weekDates.forEach(date => {
                const cell = document.createElement('div');
                cell.className = 'lab-grid-cell interactive';
                const dateString = window.formatDate(date); // YYYY-MM-DD
                
                const booking = currentBookingsForGrid.find(b => 
                    b.date === dateString && // Ensure date formats match
                    b.timeSlotId === slot.id // timeSlotId should be string
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
                    cellStatusSpan.textContent = booking.status;
                    cellPurposeSpan.textContent = booking.purpose || `Booked by ${booking.userId}`;
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
        // Similar to assistant_seat_updater, but might not need to store in this module's cache
        // if it's only for display. Or use a shared cache. For now, direct fetch.
        try {
            const response = await fetch(`${API_BASE_URL_GRID}/labs/${labId}/seats`, {
                 headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) {
                 if (response.status === 404) return {}; // No statuses yet
                 throw new Error('Failed to fetch seat statuses');
            }
            return await response.json();
        } catch (error) {
            console.error("Error fetching seat statuses for dialog:", error);
            return {}; // Return empty on error
        }
    }

    function renderDeskWithPersistedStatus(labId, seatIndex, seatStatuses) {
        const deskDiv = document.createElement('div');
        deskDiv.className = 'lab-layout-desk';

        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'armchair');
        
        const seatStatus = seatStatuses[seatIndex.toString()] || 'working'; // Default to 'working'

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
                row.appendChild(renderDeskWithPersistedStatus(labId, currentSeatIndexRef.index++, seatStatuses));
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
            const labResponse = await fetch(`${API_BASE_URL_GRID}/labs/${labId}`,{
                 headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!labResponse.ok) throw new Error('Failed to fetch lab details');
            lab = await labResponse.json();
            seatStatuses = await loadSeatStatusesForDialog(labId);
        } catch (error) {
            dialogLabLayoutVisualization.innerHTML = `<p class="error-message visible">Error loading layout: ${error.message}</p>`;
            return;
        }
        
        dialogLabLayoutVisualization.innerHTML = ''; // Clear loading
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
        if (numRightDesks < 0) {
            numMiddleDesks += numRightDesks; numRightDesks = 0;
            if (numMiddleDesks < 0) { numLeftDesks += numMiddleDesks; numMiddleDesks = 0; }
            if (numLeftDesks < 0) numLeftDesks = 0;
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
            const labResponse = await fetch(`${API_BASE_URL_GRID}/labs/${labId}`,{
                 headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!labResponse.ok) throw new Error('Failed to fetch lab details for dialog');
            lab = await labResponse.json();
        } catch(error) {
            alert(`Error loading lab details: ${error.message}`);
            return;
        }

        if (dialogTitle) dialogTitle.textContent = `Details for ${lab.name}`;
        if (dialogDescription) dialogDescription.textContent = `Date: ${date}, Time: ${timeSlot.displayTime}`;
        
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
            pStatus.innerHTML = `<strong>Status:</strong> <span class="font-bold text-lg">${booking.status.toUpperCase()}</span>`;
           if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pStatus);

            const pPurpose = document.createElement('p');
            pPurpose.innerHTML = `<strong>Purpose:</strong> ${booking.purpose || 'N/A'}`;
            if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pPurpose);

            const pUser = document.createElement('p');
            // In a real app, fetch user details if only userId is available
            pUser.innerHTML = `<strong>Booked By:</strong> ${booking.userName || booking.userId} (${booking.requestedByRole})`;
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
            
            const currentUserRole = window.getCurrentUserRole(); // From utils.js
            if ((currentUserRole === window.USER_ROLES.FACULTY || currentUserRole === window.USER_ROLES.ASSISTANT) && dialogBookButton) { 
                 dialogBookButton.style.display = 'inline-flex';
                 dialogBookButton.onclick = () => {
                    // Redirect to booking form, pre-filling details
                    let bookPage = 'book_slot.html'; // Default for faculty
                    if (currentUserRole === window.USER_ROLES.ASSISTANT) {
                        bookPage = 'assistant_request_lab.html';
                    }
                    window.location.href = `${bookPage}?labId=${labId}&date=${date}&timeSlotId=${timeSlot.id}`;
                 };
            }
        }
        
        await renderLabLayoutVisualization(labId); 
        if (slotDetailDialog) slotDetailDialog.classList.add('open');
        if (window.lucide) window.lucide.createIcons(); 
    }

    // Initial call to fetch labs for the selector
    fetchLabsForSelector();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLabGrid);
} else {
    initializeLabGrid();
}
