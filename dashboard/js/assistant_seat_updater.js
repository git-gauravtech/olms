
// Global variable for the current page context
let ALL_LAB_SEAT_STATUSES = {}; // In-memory cache, labId -> { seatIndex: status }

async function initializeSeatUpdaterPage() {
    const labSelector = document.getElementById('labSelectorForSeatUpdate');
    const layoutContainer = document.getElementById('interactiveLabLayoutContainer');
    const token = localStorage.getItem('token');

    if (labSelector && layoutContainer) {
        try {
            const labsResponse = await fetch(`${window.API_BASE_URL}/labs`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!labsResponse.ok) throw new Error('Failed to fetch labs for selector');
            const labs = await labsResponse.json();

            labSelector.innerHTML = ''; // Clear previous options
            if (labs.length > 0) {
                labs.forEach(lab => {
                    const option = document.createElement('option');
                    option.value = lab.id; 
                    option.textContent = `${lab.name} (Capacity: ${lab.capacity})`;
                    labSelector.appendChild(option);
                });

                labSelector.addEventListener('change', async (e) => {
                    await renderInteractiveLabLayout(e.target.value, layoutContainer);
                });
                
                // Default to first lab
                await renderInteractiveLabLayout(labs[0].id, layoutContainer);
            } else {
                labSelector.innerHTML = '<option value="">No labs available</option>';
                layoutContainer.innerHTML = '<p class="text-muted-foreground text-center">No labs available to configure.</p>';
            }
        } catch (error) {
            // console.error("Error initializing seat updater page:", error);
            layoutContainer.innerHTML = `<p class="error-message visible">Error loading labs: ${error.message}</p>`;
        }
    }
     if (window.lucide) window.lucide.createIcons();
}

async function loadSeatStatusesForLab(labId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${window.API_BASE_URL}/labs/${labId}/seats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            if (response.status === 404) { // No statuses set for this lab yet
                 ALL_LAB_SEAT_STATUSES[labId] = {}; 
                 return {};
            }
            const errorData = await response.json();
            throw new Error(errorData.msg || `Failed to fetch seat statuses for lab ${labId}`);
        }
        const statuses = await response.json();
        ALL_LAB_SEAT_STATUSES[labId] = statuses; // Update cache
        return statuses;
    } catch (error) {
        // console.error(`Error fetching seat statuses for lab ${labId}:`, error);
        ALL_LAB_SEAT_STATUSES[labId] = {}; // Reset on error
        return {}; // Return empty object on error
    }
}


function getSeatStatus(labId, seatIndex) {
    const labStatuses = ALL_LAB_SEAT_STATUSES[labId] || {};
    return labStatuses[String(seatIndex)] || 'working'; // Default to 'working' if not found
}

async function setSeatStatus(labId, seatIndex, status) {
    const token = localStorage.getItem('token');
    if (!ALL_LAB_SEAT_STATUSES[labId]) { // Ensure labId key exists in cache
        ALL_LAB_SEAT_STATUSES[labId] = {};
    }
    ALL_LAB_SEAT_STATUSES[labId][String(seatIndex)] = status; // Update cache
    
    try {
        const response = await fetch(`${window.API_BASE_URL}/labs/${labId}/seats/${seatIndex}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || `Failed to update seat status for lab ${labId}, seat ${seatIndex}`);
        }
        // console.log(`Seat ${seatIndex} in lab ${labId} updated to ${status} on backend.`);
    } catch (error) {
        // console.error('Error saving seat status to backend:', error);
        alert(`Error saving seat status: ${error.message}. Please try again.`);
        // Optionally, revert the UI change or ALL_LAB_SEAT_STATUSES cache if save fails
    }
}

async function renderInteractiveLabLayout(labId, container) {
    container.innerHTML = '<p>Loading lab layout...</p>'; 
    const token = localStorage.getItem('token');

    let lab;
    try {
        const labResponse = await fetch(`${window.API_BASE_URL}/labs/${labId}`,{
             headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!labResponse.ok) throw new Error('Failed to fetch lab details');
        lab = await labResponse.json();
        
        await loadSeatStatusesForLab(labId); // Pre-load statuses into cache

    } catch (error) {
        // console.error("Error fetching lab details for layout:", error);
        container.innerHTML = `<p class="error-message visible">Error loading lab layout: ${error.message}</p>`;
        return;
    }
    
    container.innerHTML = ''; 

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
                else if (numRightDesks > 0) { numRightDesks--; reduceAmount--;} // Added to ensure reduction if left and middle are zero
                else { break; } 
             }
        }


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

                const iconTag = document.createElement('i'); 
                iconTag.setAttribute('data-lucide', 'armchair');
                
                deskDiv.appendChild(iconTag);
                // Pass deskDiv to handleSeatClick so it can find the SVG icon within it
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
        window.lucide.createIcons(); 
        // After icons are created, apply initial styling based on loaded statuses
        const allSeatDivs = mainLayoutContainer.querySelectorAll('.interactive-seat');
        allSeatDivs.forEach(seatDiv => {
            const seatIdx = seatDiv.getAttribute('data-seat-index');
            const initialStatus = getSeatStatus(labId, seatIdx); 
            const svgIcon = seatDiv.querySelector('svg.lucide-armchair'); // Target the SVG
            if (svgIcon) {
                svgIcon.classList.remove('system-working', 'system-not-working'); // Clear previous
                svgIcon.classList.add(initialStatus === 'not-working' ? 'system-not-working' : 'system-working');
            } else {
                 // console.warn("Could not find SVG icon for seat index:", seatIdx, "in div:", seatDiv);
            }
        });
    }
}

async function handleSeatClick(labId, seatIndexStr, seatContainerElement) {
    const svgIconElement = seatContainerElement.querySelector('svg.lucide-armchair'); 

    if (!svgIconElement) {
        // console.error("Armchair SVG icon not found for click handling in:", seatContainerElement);
        // Check if it's still an <i> tag (Lucide might have failed for this one)
        const iTag = seatContainerElement.querySelector('i.lucide-armchair');
        if(iTag) {
            // console.error("Found <i> tag instead of <svg>. Lucide might not have processed this icon.");
        }
        return;
    }

    const currentStatus = getSeatStatus(labId, seatIndexStr); 
    const newStatus = currentStatus === 'working' ? 'not-working' : 'working';

    svgIconElement.classList.remove('system-working', 'system-not-working');
    svgIconElement.classList.add(newStatus === 'not-working' ? 'system-not-working' : 'system-working');

    await setSeatStatus(labId, seatIndexStr, newStatus); 
}

    