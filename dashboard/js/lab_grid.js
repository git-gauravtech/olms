
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
    let ALL_BOOKINGS_CACHE = [];
    let ALL_LABS_CACHE = [];
    let ALL_LAB_SEAT_STATUSES_CACHE = {};

    async function fetchLabsForSelector() {
        if (!labSelector || !token) {
            if(gridContainer) gridContainer.innerHTML = '<p class="error-message visible">Initialization error (token or selector missing).</p>';
            return;
        }
        try {
            const response = await fetch(`${window.API_BASE_URL}/labs`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ msg: `Server error: ${response.status}`}));
                throw new Error(errorData.msg || 'Failed to fetch labs');
            }
            ALL_LABS_CACHE = await response.json();

            labSelector.innerHTML = '';
            if (ALL_LABS_CACHE.length > 0) {
                ALL_LABS_CACHE.forEach(lab => {
                    const option = document.createElement('option');
                    option.value = lab.id;
                    option.textContent = `${lab.name} (Capacity: ${lab.capacity})`;
                    labSelector.appendChild(option);
                });
                currentSelectedLabId = ALL_LABS_CACHE[0].id;
                labSelector.value = currentSelectedLabId;
                 await fetchBookingsForGrid(); // Fetch bookings after labs are loaded
            } else {
                labSelector.innerHTML = '<option value="">No labs available</option>';
                if(gridContainer) gridContainer.innerHTML = '<p class="text-muted-foreground">No labs found to display availability.</p>';
            }
        } catch (error) {
            console.error("Error fetching labs:", error);
            if(gridContainer) gridContainer.innerHTML = `<p class="error-message visible">Error loading labs: ${error.message}</p>`;
        }
    }

    async function fetchBookingsForGrid() {
        if (!token) {
             if(gridContainer) gridContainer.innerHTML = '<p class="error-message visible">Authentication token not found. Cannot fetch bookings.</p>';
            await renderGrid(); // Render empty grid
            return;
        }
        try {
            const response = await fetch(`${window.API_BASE_URL}/bookings`, { // Fetches ALL bookings now
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ msg: `Server error: ${response.status}`}));
                throw new Error(errorData.msg || 'Failed to fetch bookings');
            }
            ALL_BOOKINGS_CACHE = await response.json();
            await renderGrid(); // Render grid after bookings are fetched
        } catch (error) {
            console.error("Error fetching bookings:", error);
            ALL_BOOKINGS_CACHE = []; // Clear cache on error
            if(gridContainer) gridContainer.innerHTML = `<p class="error-message visible">Error loading bookings: ${error.message}. Displaying empty grid.</p>`;
            await renderGrid(); // Render grid even if bookings fail to show availability
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

        const startDateString = window.formatDate(startDate);
        const endDateString = window.formatDate(endDate);

        return ALL_BOOKINGS_CACHE.filter(b => {
            // Ensure b.date exists and is a valid date string before comparison
            const bookingDate = b.date ? window.formatDate(new Date(b.date)) : null;
            return String(b.labId) === String(labId) &&
                   bookingDate && // Make sure bookingDate is not null
                   bookingDate >= startDateString && bookingDate <= endDateString;
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
            timeCell.textContent = slot.displayTime.replace(' - ', '\\n'); // For potential CSS word break
            gridContainer.appendChild(timeCell);

            weekDates.forEach(date => {
                const cell = document.createElement('div');
                cell.className = 'lab-grid-cell interactive';
                const dateString = window.formatDate(date);

                const booking = currentBookingsForSelectedLabAndWeek.find(b =>
                    b.date === dateString &&
                    String(b.timeSlotId) === String(slot.id) &&
                    (b.status === 'booked' || b.status === 'pending' || b.status === 'pending-admin-approval' || b.status === 'approved-by-admin') // Include admin approved
                );

                const cellStatusSpan = document.createElement('span');
                cellStatusSpan.className = 'lab-grid-cell-status';

                const cellPurposeSpan = document.createElement('span');
                cellPurposeSpan.className = 'lab-grid-cell-purpose';

                const slotDateTime = new Date(`${dateString}T${slot.startTime}`);
                const now = new Date();
                now.setHours(0,0,0,0); // Compare dates only for "past"
                const slotDateOnly = new Date(dateString);
                slotDateOnly.setHours(0,0,0,0);


                if (slotDateOnly < now && !booking) { // If the date is in the past
                     cell.classList.add('status-past');
                     cellStatusSpan.textContent = 'Past';
                     cell.classList.remove('interactive');
                } else if (booking) {
                    cell.classList.add(`status-${booking.status.toLowerCase().replace(/-/g, '_')}`); // Replace hyphens for CSS class
                    cellStatusSpan.textContent = booking.status.replace(/-/g, ' ').toUpperCase();
                    cellPurposeSpan.textContent = booking.purpose || `By: ${booking.userName || 'N/A'}`;
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
        if (ALL_LAB_SEAT_STATUSES_CACHE[labId]) {
            return ALL_LAB_SEAT_STATUSES_CACHE[labId];
        }
        if (!token) {
            console.warn("No token, cannot fetch seat statuses for dialog.");
            return {};
        }
        try {
            const response = await fetch(`${window.API_BASE_URL}/labs/${labId}/seats`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                 if (response.status === 404) {
                    ALL_LAB_SEAT_STATUSES_CACHE[labId] = {};
                    return {};
                 }
                 const errorData = await response.json().catch(() => ({ msg: `Server error: ${response.status}`}));
                 throw new Error(errorData.msg || 'Failed to fetch seat statuses');
            }
            const statuses = await response.json();
            ALL_LAB_SEAT_STATUSES_CACHE[labId] = statuses;
            return statuses;
        } catch (error) {
            console.error(`Error fetching seat statuses for lab ${labId}:`, error);
            ALL_LAB_SEAT_STATUSES_CACHE[labId] = {};
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
        if (!token) {
             dialogLabLayoutVisualization.innerHTML = '<p class="error-message visible">Authentication error loading layout.</p>';
            return;
        }

        let lab;
        try {
            const labResponse = await fetch(`${window.API_BASE_URL}/labs/${labId}`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!labResponse.ok) {
                const errorData = await labResponse.json().catch(() => ({msg: 'Failed to fetch lab details.'}));
                throw new Error(errorData.msg);
            }
            lab = await labResponse.json();
        } catch (error) {
            console.error("Error fetching lab details for layout:", error);
            dialogLabLayoutVisualization.innerHTML = `<p class="error-message visible">Error loading lab details: ${error.message}</p>`;
            return;
        }

        if (!lab) {
            dialogLabLayoutVisualization.innerHTML = `<p class="error-message visible">Lab details not found.</p>`;
            return;
        }

        const seatStatuses = await loadSeatStatusesForDialog(labId);

        dialogLabLayoutVisualization.innerHTML = '';
        const capacity = lab ? lab.capacity : 0;

        const title = document.createElement('h4');
        title.className = 'text-sm font-medium mb-3 text-center text-muted-foreground';
        title.textContent = `Lab Layout for ${capacity} Desk${capacity !== 1 ? 's' : ''}`;
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

        if (numRightDesks < 0) { numMiddleDesks += numRightDesks; numRightDesks = 0; }
        if (numMiddleDesks < 0) { numLeftDesks += numMiddleDesks; numMiddleDesks = 0; }
        if (numLeftDesks < 0) { numLeftDesks = 0; }

        let currentTotal = numLeftDesks + numMiddleDesks + numRightDesks;
        let diff = capacity - currentTotal;
        if (diff !== 0 && capacity > 0) {
            if (diff > 0) {
                numLeftDesks += Math.ceil(diff / 2);
                numRightDesks += Math.floor(diff / 2);
            } else {
                let reduceAmount = Math.abs(diff);
                while (reduceAmount > 0) {
                    if (numLeftDesks > 0) { numLeftDesks--; reduceAmount--; if (reduceAmount === 0) break; }
                    if (numRightDesks > 0) { numRightDesks--; reduceAmount--; if (reduceAmount === 0) break; }
                    if (numMiddleDesks > 0) { numMiddleDesks--; reduceAmount--; if (reduceAmount === 0) break; }
                    if (reduceAmount > 0 && (numLeftDesks > 0 || numRightDesks > 0 || numMiddleDesks > 0)) continue;
                    else break;
                }
            }
        }
        currentTotal = numLeftDesks + numMiddleDesks + numRightDesks;
        if(currentTotal !== capacity && capacity > 0) {
            let finalDiff = capacity - currentTotal;
            if (numLeftDesks + finalDiff >= 0) numLeftDesks += finalDiff;
            else if (numMiddleDesks + finalDiff >=0) numMiddleDesks += finalDiff;
            else if (numRightDesks + finalDiff >=0) numRightDesks += finalDiff;
        }
        numLeftDesks = Math.max(0, numLeftDesks);
        numMiddleDesks = Math.max(0, numMiddleDesks);
        numRightDesks = Math.max(0, numRightDesks);


        let seatIndexRef = { index: 0 };

        mainLayoutContainer.appendChild(createDeskSection(labId, numLeftDesks, 3, seatIndexRef, seatStatuses));
        mainLayoutContainer.appendChild(createDeskSection(labId, numMiddleDesks, 2, seatIndexRef, seatStatuses));
        mainLayoutContainer.appendChild(createDeskSection(labId, numRightDesks, 3, seatIndexRef, seatStatuses));

        dialogLabLayoutVisualization.appendChild(mainLayoutContainer);
        if (window.lucide) window.lucide.createIcons();
    }

    async function showSlotDetails(labId, date, timeSlot, booking) {
        if (!token) {
            alert("Authentication error. Please log in again.");
            return;
        }
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
        const slotDateTime = new Date(`${date}T${slot.startTime}`);
        const slotDateOnly = new Date(date);
        slotDateOnly.setHours(0,0,0,0);
        const nowDateOnly = new Date();
        nowDateOnly.setHours(0,0,0,0);

        if (slotDateOnly < nowDateOnly && !booking) { // If the date is in the past
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
            pUser.innerHTML = `<strong>Booked By:</strong> ${booking.userName || 'N/A'} (${booking.requestedByRole || 'N/A'})`;
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
            if (currentUserRole && (currentUserRole === window.USER_ROLES.FACULTY || currentUserRole === window.USER_ROLES.ASSISTANT) && dialogBookButton) {
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

    await fetchLabsForSelector(); // Initial fetch

    const urlParams = new URLSearchParams(window.location.search);
    if (labSelector && urlParams.has('labId') && ALL_LABS_CACHE.some(l => String(l.id) === urlParams.get('labId'))) {
        labSelector.value = urlParams.get('labId');
        currentSelectedLabId = urlParams.get('labId');
    }
    if (urlParams.has('date')) {
        const dateFromParam = new Date(urlParams.get('date'));
        if (!isNaN(dateFromParam.getTime())) {
            currentDate = dateFromParam;
        }
    }
    // await fetchBookingsForGrid(); // This is called after labs are fetched or if lab selection changes.
    await renderGrid(); // Render grid after params are set
}

window.formatDateForDisplay = function(date) {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
     if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Ensure window.formatDate exists and handles YYYY-MM-DD string format correctly
if (!window.formatDate) {
    window.formatDate = function(dateInput) {
        if (!dateInput && dateInput !== 0) return '';
        let d;
        if (dateInput instanceof Date) {
            d = dateInput;
        } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
            const potentialDate = new Date(dateInput);
            // Check if the input string is primarily YYYY-MM-DD to avoid timezone issues
            // when creating date from string
            if (String(dateInput).length >= 10 && String(dateInput).includes('-') && !isNaN(potentialDate.getTime())) {
                const parts = String(dateInput).split('T')[0].split('-');
                if (parts.length === 3) {
                    d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                } else {
                    d = potentialDate; // Fallback if not YYYY-MM-DD
                }
            } else if (!isNaN(potentialDate.getTime())) {
                 d = potentialDate;
            } else {
                return 'Invalid Date String';
            }
        } else {
            return 'Invalid Date Type';
        }

        if (isNaN(d.getTime())) {
            return 'Invalid Date Value';
        }
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
