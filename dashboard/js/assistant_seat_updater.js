
let ALL_LAB_SEAT_STATUSES = {}; // In-memory cache of all lab seat statuses, specific to this module

function initializeSeatUpdaterPage() {
    const labSelector = document.getElementById('labSelectorForSeatUpdate');
    const layoutContainer = document.getElementById('interactiveLabLayoutContainer');

    // Load all statuses from localStorage into the module-level cache ONCE.
    ALL_LAB_SEAT_STATUSES = window.loadLabSeatStatuses(); // From constants.js

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
            labSelector.value = window.MOCK_LABS[0].id; // Default to first lab
            renderInteractiveLabLayout(window.MOCK_LABS[0].id, layoutContainer);
        } else {
            layoutContainer.innerHTML = '<p class="text-muted-foreground text-center">No labs available to configure.</p>';
        }
    }
     if (window.lucide) window.lucide.createIcons();
}

// Reads from the module-level cache
function getSeatStatus(labId, seatIndex) {
    // Ensure seatIndex is a string for consistent key access
    const status = ALL_LAB_SEAT_STATUSES[labId]?.[String(seatIndex)] || 'working'; // Default to 'working'
    return status;
}

// Updates the module-level cache AND saves to localStorage
function setSeatStatus(labId, seatIndex, status) {
    // Ensure labId entry exists in the cache
    if (!ALL_LAB_SEAT_STATUSES[labId]) {
        ALL_LAB_SEAT_STATUSES[labId] = {};
    }
    // Ensure seatIndex is a string for consistent key access
    ALL_LAB_SEAT_STATUSES[labId][String(seatIndex)] = status;
    window.saveLabSeatStatuses(ALL_LAB_SEAT_STATUSES); // Pass the entire updated object to be saved in constants.js
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
    title.className = 'text-xl font-semibold mb-4 text-center text-gray-700';
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
    mainLayoutContainer.className = 'dialog-lab-layout-container';

    let numLeftDesks = Math.round(capacity * (25 / 70));
    let numMiddleDesks = Math.round(capacity * (20 / 70));
    let numRightDesks = capacity - numLeftDesks - numMiddleDesks;
    if (numRightDesks < 0) { numMiddleDesks += numRightDesks; numRightDesks = 0; }
    if (numMiddleDesks < 0) { numLeftDesks += numMiddleDesks; numMiddleDesks = 0; }
    if (numLeftDesks < 0) { numLeftDesks = 0; }


    let seatIndexCounter = 0;

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
                const currentSeatIndexStr = seatIndexCounter.toString();
                
                const deskDiv = document.createElement('div');
                deskDiv.className = 'lab-layout-desk interactive-seat';
                deskDiv.setAttribute('data-seat-index', currentSeatIndexStr);

                const icon = document.createElement('i'); // Create the <i> tag for Lucide
                icon.setAttribute('data-lucide', 'armchair');
                // Initial status application will be handled by Lucide after it creates the SVG
                // and then potentially by a re-style if needed, but handleSeatClick will manage active changes.
                
                deskDiv.appendChild(icon);
                deskDiv.addEventListener('click', () => handleSeatClick(labId, currentSeatIndexStr, deskDiv));
                row.appendChild(deskDiv);
                
                desksRenderedInSec++;
                seatIndexCounter++;
            }
            section.appendChild(row);
        }
        return section;
    }

    mainLayoutContainer.appendChild(createInteractiveDeskSection(numLeftDesks, 3));
    mainLayoutContainer.appendChild(createInteractiveDeskSection(numMiddleDesks, 2));
    mainLayoutContainer.appendChild(createInteractiveDeskSection(numRightDesks, 3));

    container.appendChild(mainLayoutContainer);
    if (window.lucide) {
        window.lucide.createIcons(); // Create icons from <i> tags
        // After icons are created, apply initial styles based on saved status
        const allSeatDivs = mainLayoutContainer.querySelectorAll('.interactive-seat');
        allSeatDivs.forEach(seatDiv => {
            const seatIdx = seatDiv.getAttribute('data-seat-index');
            const initialStatus = getSeatStatus(labId, seatIdx);
            const svgIcon = seatDiv.querySelector('svg.lucide-armchair');
            if (svgIcon) {
                svgIcon.classList.add(initialStatus === 'not-working' ? 'system-not-working' : 'system-working');
            }
        });
    }
}

function handleSeatClick(labId, seatIndexStr, seatContainerElement) {
    // After lucide.createIcons(), the <i> tag is replaced by an <svg>
    // So, we need to target the SVG element for class manipulation.
    const iconElement = seatContainerElement.querySelector('svg.lucide-armchair'); 

    if (!iconElement) {
        console.error("Armchair SVG icon not found within the seat container:", seatContainerElement);
        // As a fallback, it's possible the click happened before SVG replacement or some other edge case
        const iTag = seatContainerElement.querySelector('i[data-lucide="armchair"]');
        if(iTag) console.error("Found <i> tag instead:", iTag);
        return;
    }

    const currentStatus = getSeatStatus(labId, seatIndexStr);
    const newStatus = currentStatus === 'working' ? 'not-working' : 'working';

    setSeatStatus(labId, seatIndexStr, newStatus); // This saves to localStorage

    // Update visual style
    iconElement.classList.remove('system-working', 'system-not-working');
    iconElement.classList.add(newStatus === 'not-working' ? 'system-not-working' : 'system-working');

    // console.log(`Seat ${seatIndexStr} in lab ${labId} changed to ${newStatus}. Current all statuses:`, JSON.parse(JSON.stringify(ALL_LAB_SEAT_STATUSES)));
}
