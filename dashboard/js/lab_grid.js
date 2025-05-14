
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
    const dialogBody = document.getElementById('dialogBody');
    const dialogBookButton = document.getElementById('dialogBookButton');
    const dialogCloseButton = document.getElementById('dialogCloseButton');

    let currentSelectedLabId = '';
    let currentDate = new Date(); // Start with today

    // Populate lab selector
    MOCK_LABS.forEach(lab => {
        const option = document.createElement('option');
        option.value = lab.id;
        option.textContent = lab.name;
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

    prevWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderGrid();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderGrid();
    });
    
    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderGrid();
    });

    dialogCloseButton.addEventListener('click', () => {
        slotDetailDialog.classList.remove('open');
    });

    slotDetailDialog.addEventListener('click', (event) => {
        if (event.target === slotDetailDialog) { // Clicked on overlay
            slotDetailDialog.classList.remove('open');
        }
    });
    
    function getWeekDateRange(date) {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust if day is Sunday
        startOfWeek.setDate(diff);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        return { start: startOfWeek, end: endOfWeek };
    }

    function renderGrid() {
        if (!currentSelectedLabId || !gridContainer) return;
        gridContainer.innerHTML = ''; // Clear previous grid

        const { start, end } = getWeekDateRange(currentDate);
        currentWeekDisplay.textContent = `${formatDate(start)} - ${formatDate(end)}`;

        // Set grid columns: 1 for time + 7 for days
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
        if (window.lucide) window.lucide.createIcons(); // For any icons used in dialogs
    }

    function showSlotDetails(labId, date, timeSlot, booking) {
        const lab = MOCK_LABS.find(l => l.id === labId);
        dialogTitle.textContent = `Details for ${lab.name}`;
        dialogDescription.textContent = `Date: ${date}, Time: ${timeSlot.displayTime}`;
        
        dialogBody.innerHTML = ''; // Clear previous details
        dialogBookButton.style.display = 'none'; // Hide by default

        const now = new Date();
        const slotDateTime = new Date(`${date}T${timeSlot.startTime}`);

        if (slotDateTime < now && !booking) {
             const pStatus = document.createElement('p');
            pStatus.innerHTML = `<strong>Status:</strong> Past (Unavailable for booking)`;
            dialogBody.appendChild(pStatus);
        } else if (booking) {
            const pStatus = document.createElement('p');
            pStatus.innerHTML = `<strong>Status:</strong> <span class="font-bold text-lg">${booking.status.toUpperCase()}</span>`;
            dialogBody.appendChild(pStatus);

            const pPurpose = document.createElement('p');
            pPurpose.innerHTML = `<strong>Purpose:</strong> ${booking.purpose || 'N/A'}`;
            dialogBody.appendChild(pPurpose);

            const pUser = document.createElement('p');
            pUser.innerHTML = `<strong>Booked By:</strong> ${booking.userId} (${booking.requestedByRole})`;
            dialogBody.appendChild(pUser);

            if (booking.batchIdentifier) {
                const pBatch = document.createElement('p');
                pBatch.innerHTML = `<strong>Batch/Class:</strong> ${booking.batchIdentifier}`;
                dialogBody.appendChild(pBatch);
            }
        } else { // Available
            const pStatus = document.createElement('p');
            pStatus.innerHTML = `<strong>Status:</strong> <span class="font-bold text-lg text-green-600">Available</span>`;
            dialogBody.appendChild(pStatus);
            
            const currentUserRole = getCurrentUserRole();
            // Allow Faculty and CR to see the book button
            if (currentUserRole === USER_ROLES.FACULTY || currentUserRole === USER_ROLES.CR) {
                 dialogBookButton.style.display = 'inline-flex';
                 dialogBookButton.onclick = () => {
                    // Redirect to booking page, pre-filling details
                    window.location.href = `book_slot.html?labId=${labId}&date=${date}&timeSlotId=${timeSlot.id}`;
                 };
            }
        }
        slotDetailDialog.classList.add('open');
    }

    renderGrid(); // Initial render
}
