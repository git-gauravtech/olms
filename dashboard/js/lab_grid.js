

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

    let currentSelectedLabId = '';
    let currentDate = new Date(); // Start with today

    // Populate lab selector
    if (labSelector) {
        MOCK_LABS.forEach(lab => {
            const option = document.createElement('option');
            option.value = lab.id;
            option.textContent = `${lab.name} (Capacity: ${lab.capacity})`;
            labSelector.appendChild(option);
        });
        if (MOCK_LABS.length > 0) {
            currentSelectedLabId = MOCK_LABS[0].id;
            labSelector.value = currentSelectedLabId;
        }

        labSelector.addEventListener('change', (e) => {
            currentSelectedLabId = e.target.value;
            renderGrid();
        });
    }


    if (prevWeekBtn) prevWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderGrid();
    });

    if (nextWeekBtn) nextWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderGrid();
    });
    
    if (todayBtn) todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderGrid();
    });

    if (dialogCloseButton) dialogCloseButton.addEventListener('click', () => {
        slotDetailDialog.classList.remove('open');
    });

    if (slotDetailDialog) slotDetailDialog.addEventListener('click', (event) => {
        if (event.target === slotDetailDialog) { // Clicked on overlay
            slotDetailDialog.classList.remove('open');
        }
    });
    
    function getWeekDateRange(date) {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        // Adjust to make Monday the start of the week (day 1) and Sunday the end (day 0 or 7)
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
        startOfWeek.setDate(diff);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Monday + 6 days = Sunday
        
        return { start: startOfWeek, end: endOfWeek };
    }

    function renderGrid() {
        if (!currentSelectedLabId || !gridContainer) return;
        gridContainer.innerHTML = ''; // Clear previous grid

        const { start, end } = getWeekDateRange(currentDate);
        if (currentWeekDisplay) {
            currentWeekDisplay.textContent = `${formatDate(start)} - ${formatDate(end)}`;
        }


        // Set grid columns: 1 for time + 7 for days (Mon-Sun)
        gridContainer.style.gridTemplateColumns = `minmax(80px, auto) repeat(${DAYS_OF_WEEK.length}, 1fr)`;
        
        // Header Row (Days of Week)
        const emptyHeaderCell = document.createElement('div');
        emptyHeaderCell.className = 'lab-grid-header-cell';
        gridContainer.appendChild(emptyHeaderCell); // Top-left empty cell

        const weekDates = [];
        for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'lab-grid-header-cell';
            const currentDayDate = new Date(start);
            currentDayDate.setDate(start.getDate() + i);
            weekDates.push(currentDayDate);
            dayCell.textContent = `${DAYS_OF_WEEK[i]} (${currentDayDate.getDate()})`;
            gridContainer.appendChild(dayCell);
        }

        // Grid Cells (Time Slots vs Days)
        MOCK_TIME_SLOTS.forEach(slot => {
            const timeCell = document.createElement('div');
            timeCell.className = 'lab-grid-time-cell';
            timeCell.textContent = slot.displayTime.replace(' - ', '\n');
            gridContainer.appendChild(timeCell);

            weekDates.forEach(date => {
                const cell = document.createElement('div');
                cell.className = 'lab-grid-cell interactive'; // All cells interactive initially
                const dateString = formatDate(date);
                
                const booking = MOCK_BOOKINGS.find(b => 
                    b.labId === currentSelectedLabId &&
                    b.date === dateString &&
                    b.timeSlotId === slot.id
                );

                const cellStatusSpan = document.createElement('span');
                cellStatusSpan.className = 'lab-grid-cell-status';

                const cellPurposeSpan = document.createElement('span');
                cellPurposeSpan.className = 'lab-grid-cell-purpose';

                // Check if the slot is in the past
                const slotDateTime = new Date(`${dateString}T${slot.startTime}`);
                const now = new Date();
                if (slotDateTime < now && !booking) { // Past and not booked (implicitly available but past)
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

    function renderDesk() { // Number parameter removed as it's not used for icons
        const deskDiv = document.createElement('div');
        deskDiv.className = 'lab-layout-desk';

        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'armchair');
        deskDiv.appendChild(icon);
        return deskDiv;
    }

    function createDeskSection(totalDesks, desksPerRow) {
        const section = document.createElement('div');
        section.className = 'dialog-lab-layout-section';
        if (totalDesks <= 0) return section; 

        let desksCreated = 0;
        while (desksCreated < totalDesks) {
            const row = document.createElement('div');
            row.className = 'lab-layout-row';
            const desksInThisRow = Math.min(desksPerRow, totalDesks - desksCreated);
            for (let i = 0; i < desksInThisRow; i++) {
                row.appendChild(renderDesk());
                desksCreated++;
            }
            section.appendChild(row);
        }
        return section;
    }

    function renderLabLayoutVisualization(labId) {
        dialogLabLayoutVisualization.innerHTML = ''; 

        const lab = MOCK_LABS.find(l => l.id === labId);
        const capacity = lab ? lab.capacity : 0;

        const title = document.createElement('h4');
        title.className = 'text-sm font-medium mb-3 text-center text-muted-foreground';
        title.textContent = `Lab Layout for ${capacity} Desks`;
        dialogLabLayoutVisualization.appendChild(title);

        // Teacher's Desk
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
            return;
        }
        
        const mainLayoutContainer = document.createElement('div');
        mainLayoutContainer.className = 'dialog-lab-layout-container';

        const baseTotal = 70;
        const baseLeft = 25;
        const baseMiddle = 20;
        
        let numLeftDesks = Math.round(capacity * (baseLeft / baseTotal));
        let numMiddleDesks = Math.round(capacity * (baseMiddle / baseTotal));
        let numRightDesks = capacity - numLeftDesks - numMiddleDesks;

        if (numRightDesks < 0) {
            numMiddleDesks += numRightDesks; 
            numRightDesks = 0;
            if (numMiddleDesks < 0) {
                numLeftDesks += numMiddleDesks;
                numMiddleDesks = 0;
            }
            if (numLeftDesks < 0) numLeftDesks = 0;
        }

        mainLayoutContainer.appendChild(createDeskSection(numLeftDesks, 3));
        mainLayoutContainer.appendChild(createDeskSection(numMiddleDesks, 2));
        mainLayoutContainer.appendChild(createDeskSection(numRightDesks, 3));
        
        dialogLabLayoutVisualization.appendChild(mainLayoutContainer);
    }


    function showSlotDetails(labId, date, timeSlot, booking) {
        const lab = MOCK_LABS.find(l => l.id === labId);
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
            pUser.innerHTML = `<strong>Booked By:</strong> ${booking.userId} (${booking.requestedByRole})`;
            if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pUser);

            if (booking.batchIdentifier) {
                const pBatch = document.createElement('p');
                pBatch.innerHTML = `<strong>Batch/Class:</strong> ${booking.batchIdentifier}`;
                if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pBatch);
            }
        } else { // Available
            const pStatus = document.createElement('p');
            pStatus.innerHTML = `<strong>Status:</strong> <span class="font-bold text-lg text-green-600">Available</span>`;
            if (dialogSlotInfoContainer) dialogSlotInfoContainer.appendChild(pStatus);
            
            const currentUserRole = getCurrentUserRole();
            if ((currentUserRole === USER_ROLES.FACULTY || currentUserRole === USER_ROLES.CR) && dialogBookButton) {
                 dialogBookButton.style.display = 'inline-flex';
                 dialogBookButton.onclick = () => {
                    window.location.href = `book_slot.html?labId=${labId}&date=${date}&timeSlotId=${timeSlot.id}`;
                 };
            }
        }
        
        renderLabLayoutVisualization(labId); 
        if (slotDetailDialog) slotDetailDialog.classList.add('open');
        if (window.lucide) window.lucide.createIcons(); // Ensure icons are created after dialog content is set
    }

    renderGrid(); // Initial render
}

// Ensure this script runs after the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLabGrid);
} else {
    initializeLabGrid();
}
