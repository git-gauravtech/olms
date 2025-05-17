
let ALL_LAB_SEAT_STATUSES = {}; // In-memory cache of all lab seat statuses, specific to this module

function initializeSeatUpdaterPage() {
    const labSelector = document.getElementById('labSelectorForSeatUpdate');
    const layoutContainer = document.getElementById('interactiveLabLayoutContainer');

    // Load all statuses from localStorage into the module-level cache ONCE.
    ALL_LAB_SEAT_STATUSES = window.loadLabSeatStatuses();

    if (labSelector && layoutContainer && window.MOCK_LABS) {
        window.MOCK_LABS.forEach(lab => {
            const option = document.createElement('option');
            option.value = lab.id;
            option.textContent = `${lab.name} (Capacity: ${lab.capacity})`;
            labSelector.appendChild(option);
        });

        labSelector.addEventListener('change', (e) => {
            renderInteractiveLabLayout(e.target.value, layoutContainer);
        });

        if (window.MOCK_LABS.length > 0) {
            labSelector.value = window.MOCK_LABS[0].id;
            renderInteractiveLabLayout(window.MOCK_LABS[0].id, layoutContainer);
        } else {
            layoutContainer.innerHTML = '<p class="text-muted-foreground text-center">No labs available to configure.</p>';
        }
    }
     if (window.lucide) window.lucide.createIcons();
}

// Reads from the module-level cache
function getSeatStatus(labId, seatIndex) {
    const status = ALL_LAB_SEAT_STATUSES[labId]?.[seatIndex.toString()] || 'working';
    return status;
}

// Updates the module-level cache AND saves to localStorage
function setSeatStatus(labId, seatIndex, status) {
    if (!ALL_LAB_SEAT_STATUSES[labId]) {
        ALL_LAB_SEAT_STATUSES[labId] = {};
    }
    ALL_LAB_SEAT_STATUSES[labId][seatIndex.toString()] = status;
    window.saveLabSeatStatuses(ALL_LAB_SEAT_STATUSES); // Pass the entire updated object to be saved
}

function renderInteractiveLabLayout(labId, container) {
    container.innerHTML = ''; // Clear previous layout

    const lab = window.MOCK_LABS.find(l => l.id === labId);
    if (!lab) {
        container.innerHTML = '<p class="text-muted-foreground text-center">Selected lab not found.</p>';
        return;
    }
    const capacity = lab.capacity;

    const title = document.createElement('h3');
    title.className = 'text-xl font-semibold mb-4 text-center text-gray-700'; // Made title more prominent
    title.textContent = `Update Seat Status: ${lab.name}`;
    container.appendChild(title);

    const teacherDeskContainer = document.createElement('div');
    teacherDeskContainer.className = 'lab-layout-teacher-desk';
    const teacherIcon = document.createElement('i');
    teacherIcon.setAttribute('data-lucide', 'user-cog');
    teacherDeskContainer.appendChild(teacherIcon);
    const teacherLabel = document.createElement('span');
    teacherLabel.textContent = 'Teacher';
    teacherLabel.className = 'teacher-desk-label';
    teacherDeskContainer.appendChild(teacherLabel);
    container.appendChild(teacherDeskContainer);

    if (capacity === 0) {
        const noDesksMsg = document.createElement('p');
        noDesksMsg.className = 'text-sm text-center text-muted-foreground mt-2';
        noDesksMsg.textContent = 'This lab has no student desks to configure.';
        container.appendChild(noDesksMsg);
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    const mainLayoutContainer = document.createElement('div');
    mainLayoutContainer.className = 'dialog-lab-layout-container'; // Re-using dialog class for consistent structure

    // Dynamically calculate desk distribution
    let numLeftDesks = Math.round(capacity * (25 / 70));
    let numMiddleDesks = Math.round(capacity * (20 / 70));
    let numRightDesks = capacity - numLeftDesks - numMiddleDesks;
    // Ensure no negative desk counts due to rounding
    if (numRightDesks < 0) { numMiddleDesks += numRightDesks; numRightDesks = 0; }
    if (numMiddleDesks < 0) { numLeftDesks += numMiddleDesks; numMiddleDesks = 0; }
    if (numLeftDesks < 0) { numLeftDesks = 0; }


    let seatIndexCounter = 0; // Keep track of a unique index for each seat

    function createInteractiveDeskSection(totalDesksInSec, desksPerRow) {
        const section = document.createElement('div');
        section.className = 'dialog-lab-layout-section';
        if (totalDesksInSec <= 0) return section;

        let desksRenderedInSec = 0;
        while (desksRenderedInSec < totalDesksInSec) {
            const row = document.createElement('div');
            row.className = 'lab-layout-row';
            const desksInThisRow = Math.min(desksPerRow, totalDesksInSec - desksRenderedInSec);
            for (let i = 0; i < desksInThisRow; i++) {
                const currentSeatIndexStr = seatIndexCounter.toString(); // Use the global counter for a unique ID
                
                const deskDiv = document.createElement('div');
                deskDiv.className = 'lab-layout-desk interactive-seat'; // Make it interactive
                deskDiv.setAttribute('data-seat-index', currentSeatIndexStr); // Store index for identification

                const icon = document.createElement('i');
                icon.setAttribute('data-lucide', 'armchair');
                const currentStatus = getSeatStatus(labId, currentSeatIndexStr); // Get persisted status
                icon.classList.add(currentStatus === 'not-working' ? 'system-not-working' : 'system-working');

                deskDiv.appendChild(icon);
                // Pass the deskDiv itself to handleSeatClick
                deskDiv.addEventListener('click', () => handleSeatClick(labId, currentSeatIndexStr, deskDiv));
                row.appendChild(deskDiv);
                
                desksRenderedInSec++;
                seatIndexCounter++; // Increment global counter
            }
            section.appendChild(row);
        }
        return section;
    }

    // Create sections based on calculated desk counts
    mainLayoutContainer.appendChild(createInteractiveDeskSection(numLeftDesks, 3));
    mainLayoutContainer.appendChild(createInteractiveDeskSection(numMiddleDesks, 2));
    mainLayoutContainer.appendChild(createInteractiveDeskSection(numRightDesks, 3));

    container.appendChild(mainLayoutContainer);
    if (window.lucide) window.lucide.createIcons();
}

function handleSeatClick(labId, seatIndexStr, seatContainerElement) {
    // seatContainerElement is the div.lab-layout-desk.interactive-seat
    const iconElement = seatContainerElement.querySelector('i[data-lucide="armchair"]');
    if (!iconElement) {
        console.error("Armchair icon not found within the seat container:", seatContainerElement);
        return;
    }

    const currentStatus = getSeatStatus(labId, seatIndexStr); // Reads from cache
    const newStatus = currentStatus === 'working' ? 'not-working' : 'working';

    setSeatStatus(labId, seatIndexStr, newStatus); // Updates cache and saves to localStorage

    iconElement.classList.remove('system-working', 'system-not-working');
    iconElement.classList.add(newStatus === 'not-working' ? 'system-not-working' : 'system-working');

    // console.log(`Seat ${seatIndexStr} in lab ${labId} changed to ${newStatus}. Statuses:`, ALL_LAB_SEAT_STATUSES);
}
