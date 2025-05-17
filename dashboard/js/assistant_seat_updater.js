
let ALL_LAB_SEAT_STATUSES = {}; // In-memory cache of all lab seat statuses

function initializeSeatUpdaterPage() {
    const labSelector = document.getElementById('labSelectorForSeatUpdate');
    const layoutContainer = document.getElementById('interactiveLabLayoutContainer');

    ALL_LAB_SEAT_STATUSES = window.loadLabSeatStatuses(); // From constants.js

    if (labSelector && layoutContainer && window.MOCK_LABS) {
        // Populate lab selector
        window.MOCK_LABS.forEach(lab => {
            const option = document.createElement('option');
            option.value = lab.id;
            option.textContent = `${lab.name} (Capacity: ${lab.capacity})`;
            labSelector.appendChild(option);
        });

        labSelector.addEventListener('change', (e) => {
            renderInteractiveLabLayout(e.target.value, layoutContainer);
        });

        // Initial render for the first lab (if any)
        if (window.MOCK_LABS.length > 0) {
            labSelector.value = window.MOCK_LABS[0].id;
            renderInteractiveLabLayout(window.MOCK_LABS[0].id, layoutContainer);
        } else {
            layoutContainer.innerHTML = '<p class="text-muted-foreground text-center">No labs available to configure.</p>';
        }
    }
     if (window.lucide) window.lucide.createIcons(); // For legend icons
}

function getSeatStatus(labId, seatIndex) {
    // Ensure seatIndex is a string for consistent key access
    const status = ALL_LAB_SEAT_STATUSES[labId]?.[seatIndex.toString()] || 'working';
    return status; 
}

function setSeatStatus(labId, seatIndex, status) {
    if (!ALL_LAB_SEAT_STATUSES[labId]) {
        ALL_LAB_SEAT_STATUSES[labId] = {};
    }
    // Ensure seatIndex is a string for consistent key storage
    ALL_LAB_SEAT_STATUSES[labId][seatIndex.toString()] = status;
    window.saveLabSeatStatuses(ALL_LAB_SEAT_STATUSES); // From constants.js
}

function renderInteractiveLabLayout(labId, container) {
    container.innerHTML = ''; // Clear previous layout

    const lab = window.MOCK_LABS.find(l => l.id === labId);
    if (!lab) {
        container.innerHTML = '<p class="text-muted-foreground text-center">Selected lab not found.</p>';
        return;
    }
    const capacity = lab.capacity;

    const title = document.createElement('h4');
    title.className = 'text-lg font-semibold mb-3 text-center text-gray-700';
    title.textContent = `Lab Layout: ${lab.name} (${capacity} Desks)`;
    container.appendChild(title);

    // Teacher's Desk (non-interactive for status updates)
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
        noDesksMsg.className = 'text-xs text-center text-muted-foreground mt-2';
        noDesksMsg.textContent = 'This lab has no student desks to configure.';
        container.appendChild(noDesksMsg);
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

    let seatIndexCounter = 0; 

    function createInteractiveDeskSection(totalDesks, desksPerRow) {
        const section = document.createElement('div');
        section.className = 'dialog-lab-layout-section';
        if (totalDesks <= 0) return section;

        let desksCreated = 0;
        while (desksCreated < totalDesks) {
            const row = document.createElement('div');
            row.className = 'lab-layout-row';
            const desksInThisRow = Math.min(desksPerRow, totalDesks - desksCreated);
            for (let i = 0; i < desksInThisRow; i++) {
                const currentSeatIndex = seatIndexCounter++; 
                const deskDiv = document.createElement('div');
                deskDiv.className = 'lab-layout-desk interactive-seat';
                deskDiv.setAttribute('data-seat-index', currentSeatIndex.toString()); 

                const icon = document.createElement('i');
                icon.setAttribute('data-lucide', 'armchair');
                const currentStatus = getSeatStatus(labId, currentSeatIndex.toString());
                icon.classList.add(currentStatus === 'not-working' ? 'system-not-working' : 'system-working');
                
                deskDiv.appendChild(icon);
                // Pass deskDiv (the container of the icon) to handleSeatClick
                deskDiv.addEventListener('click', () => handleSeatClick(labId, currentSeatIndex.toString(), deskDiv));
                row.appendChild(deskDiv);
                desksCreated++;
            }
            section.appendChild(row);
        }
        return section;
    }
    
    mainLayoutContainer.appendChild(createInteractiveDeskSection(numLeftDesks, 3));
    mainLayoutContainer.appendChild(createInteractiveDeskSection(numMiddleDesks, 2));
    mainLayoutContainer.appendChild(createInteractiveDeskSection(numRightDesks, 3));
    
    container.appendChild(mainLayoutContainer);
    if (window.lucide) window.lucide.createIcons();
}

function handleSeatClick(labId, seatIndex, seatContainerElement) {
    const iconElement = seatContainerElement.querySelector('i[data-lucide="armchair"]');
    if (!iconElement) {
        console.error("Armchair icon not found within the seat container:", seatContainerElement);
        return;
    }

    const currentStatus = getSeatStatus(labId, seatIndex);
    const newStatus = currentStatus === 'working' ? 'not-working' : 'working';

    setSeatStatus(labId, seatIndex, newStatus);

    // Update icon style
    iconElement.classList.remove('system-working', 'system-not-working');
    iconElement.classList.add(newStatus === 'not-working' ? 'system-not-working' : 'system-working');
    
    // console.log(`Seat ${seatIndex} in lab ${labId} changed to ${newStatus}`);
}
