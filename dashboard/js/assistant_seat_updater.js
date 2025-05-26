
// Global variable for the current page context
let ALL_LAB_SEAT_STATUSES_CACHE_ASSISTANT = {}; // Renamed to avoid conflict with lab_grid.js if both are ever loaded on same conceptual "page" (unlikely here)
let CURRENT_SELECTED_LAB_ID_ASSISTANT = null;
let CURRENT_LAB_CAPACITY_ASSISTANT = 0;

async function initializeSeatUpdaterPage() {
    const labSelector = document.getElementById('labSelectorForSeatUpdate');
    const layoutContainer = document.getElementById('interactiveLabLayoutContainer');
    const token = localStorage.getItem('token');

    if (labSelector && layoutContainer) {
        try {
            // Fetch labs for the selector
            const labsResponse = await fetch(`${window.API_BASE_URL}/labs`, {
                 headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!labsResponse.ok) {
                const errorData = await labsResponse.json().catch(() => ({ msg: 'Failed to fetch labs and parse error' }));
                throw new Error(errorData.msg || 'Failed to fetch labs for selector');
            }
            const labs = await labsResponse.json();

            labSelector.innerHTML = '<option value="">Select a Lab</option>'; // Clear previous options
            if (labs.length > 0) {
                labs.forEach(lab => {
                    const option = document.createElement('option');
                    option.value = lab.id; 
                    option.setAttribute('data-capacity', lab.capacity); // Store capacity
                    option.textContent = `${lab.name} (Capacity: ${lab.capacity})`;
                    labSelector.appendChild(option);
                });

                labSelector.addEventListener('change', async (e) => {
                    CURRENT_SELECTED_LAB_ID_ASSISTANT = e.target.value;
                    const selectedOption = e.target.options[e.target.selectedIndex];
                    CURRENT_LAB_CAPACITY_ASSISTANT = selectedOption ? parseInt(selectedOption.getAttribute('data-capacity')) : 0;
                    
                    if (CURRENT_SELECTED_LAB_ID_ASSISTANT) {
                        await loadSeatStatusesForLab_Assistant(CURRENT_SELECTED_LAB_ID_ASSISTANT);
                        await renderInteractiveLabLayout(CURRENT_SELECTED_LAB_ID_ASSISTANT, CURRENT_LAB_CAPACITY_ASSISTANT, layoutContainer);
                    } else {
                        layoutContainer.innerHTML = '<p class="text-muted-foreground text-center">Please select a lab to view its layout.</p>';
                        updateLegendCounts_Assistant(0); // Reset counts
                    }
                });
                
                // Optionally, load the first lab by default if you want something pre-selected
                // CURRENT_SELECTED_LAB_ID_ASSISTANT = labs[0].id;
                // CURRENT_LAB_CAPACITY_ASSISTANT = labs[0].capacity;
                // labSelector.value = CURRENT_SELECTED_LAB_ID_ASSISTANT;
                // await loadSeatStatusesForLab_Assistant(CURRENT_SELECTED_LAB_ID_ASSISTANT);
                // await renderInteractiveLabLayout(CURRENT_SELECTED_LAB_ID_ASSISTANT, CURRENT_LAB_CAPACITY_ASSISTANT, layoutContainer);

            } else {
                labSelector.innerHTML = '<option value="">No labs available</option>';
                layoutContainer.innerHTML = '<p class="text-muted-foreground text-center">No labs available to configure.</p>';
            }
        } catch (error) {
            console.error("Error initializing seat updater page:", error);
            layoutContainer.innerHTML = `<p class="error-message visible">Error loading labs: ${error.message}</p>`;
        }
    }
     if (window.lucide) window.lucide.createIcons();
}

async function loadSeatStatusesForLab_Assistant(labId) {
    const token = localStorage.getItem('token');
    if (!labId) {
        ALL_LAB_SEAT_STATUSES_CACHE_ASSISTANT[labId] = {};
        return;
    }
    try {
        const response = await fetch(`${window.API_BASE_URL}/labs/${labId}/seats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            if (response.status === 404) { // No statuses set for this lab yet
                 ALL_LAB_SEAT_STATUSES_CACHE_ASSISTANT[labId] = {}; 
                 return;
            }
            const errorData = await response.json().catch(() => ({ msg: `Server error: ${response.status}` }));
            throw new Error(errorData.msg || `Failed to fetch seat statuses for lab ${labId}`);
        }
        const statuses = await response.json();
        ALL_LAB_SEAT_STATUSES_CACHE_ASSISTANT[labId] = statuses; // Update cache
    } catch (error) {
        console.error(`Error fetching seat statuses for lab ${labId}:`, error);
        ALL_LAB_SEAT_STATUSES_CACHE_ASSISTANT[labId] = {}; // Reset on error
    }
}

function getSeatStatus_Assistant(labId, seatIndex) {
    const labStatuses = ALL_LAB_SEAT_STATUSES_CACHE_ASSISTANT[labId] || {};
    return labStatuses[String(seatIndex)] || 'working'; // Default to 'working' if not found
}

async function setSeatStatus_Assistant(labId, seatIndex, status) {
    const token = localStorage.getItem('token');
    if (!ALL_LAB_SEAT_STATUSES_CACHE_ASSISTANT[labId]) { // Ensure labId key exists in cache
        ALL_LAB_SEAT_STATUSES_CACHE_ASSISTANT[labId] = {};
    }
    ALL_LAB_SEAT_STATUSES_CACHE_ASSISTANT[labId][String(seatIndex)] = status; // Update cache
    
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
            const errorData = await response.json().catch(() => ({ msg: `Failed to update status for ${labId}-${seatIndex}` }));
            throw new Error(errorData.msg);
        }
        // console.log(`Seat ${seatIndex} in lab ${labId} updated to ${status} on backend.`);
        // Update counts in legend after successful save
        updateLegendCounts_Assistant(CURRENT_LAB_CAPACITY_ASSISTANT, labId);
    } catch (error) {
        console.error('Error saving seat status to backend:', error);
        alert(`Error saving seat status: ${error.message}. Please try again.`);
        // Optionally, revert the UI change or cache if save fails
        // For now, we assume optimistic update and let user retry if backend fails.
    }
}

function updateLegendCounts_Assistant(totalCapacity, labIdForCounts = null) {
    const workingCountEl = document.getElementById('workingCount');
    const notWorkingCountEl = document.getElementById('notWorkingCount');

    if (!workingCountEl || !notWorkingCountEl) return;

    if (totalCapacity === 0 || !labIdForCounts) {
        workingCountEl.textContent = '0';
        notWorkingCountEl.textContent = '0';
        return;
    }

    let working = 0;
    let notWorking = 0;
    const currentLabStatuses = ALL_LAB_SEAT_STATUSES_CACHE_ASSISTANT[labIdForCounts] || {};

    for (let i = 0; i < totalCapacity; i++) {
        const status = currentLabStatuses[String(i)] || 'working'; // Default to working if not explicitly set
        if (status === 'working') {
            working++;
        } else {
            notWorking++;
        }
    }
    // It's possible that fewer statuses are stored than total capacity if some seats were never explicitly set.
    // The loop above assumes all seats default to 'working'.
    // If you only want to count explicitly set statuses, the logic would need to iterate over keys in currentLabStatuses.
    // For now, assuming all un-set seats are 'working' up to capacity.

    workingCountEl.textContent = String(working);
    notWorkingCountEl.textContent = String(notWorking);
}


async function renderInteractiveLabLayout(labId, capacity, container) {
    if (!labId) {
        container.innerHTML = '<p class="text-muted-foreground text-center">Please select a lab to view its layout.</p>';
        updateLegendCounts_Assistant(0);
        return;
    }
    container.innerHTML = '<p>Loading lab layout...</p>'; 
    
    const labName = document.getElementById('labSelectorForSeatUpdate').selectedOptions[0]?.textContent.split(' (Capacity:')[0] || 'Selected Lab';

    container.innerHTML = ''; 

    const title = document.createElement('h3');
    title.className = 'text-xl font-semibold mb-4 text-center text-gray-700';
    title.textContent = `Update Seat Status: ${labName}`;
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
        updateLegendCounts_Assistant(0, labId); // Pass labId
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
            else if (numRightDesks > 0) { numRightDesks--; reduceAmount--;} 
            else { break; } 
        }
    }
    // Ensure no negative desk counts
    numLeftDesks = Math.max(0, numLeftDesks);
    numMiddleDesks = Math.max(0, numMiddleDesks);
    numRightDesks = Math.max(0, numRightDesks);


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
                if (seatIndexCounter >= capacity) break; // Stop if we've rendered all desks based on capacity

                const currentSeatIndexStr = String(seatIndexCounter);
                
                const deskDiv = document.createElement('div');
                deskDiv.className = 'lab-layout-desk interactive-seat';
                deskDiv.setAttribute('data-seat-index', currentSeatIndexStr);

                const iconTag = document.createElement('i'); 
                iconTag.setAttribute('data-lucide', 'armchair');
                
                deskDiv.appendChild(iconTag);
                deskDiv.addEventListener('click', () => handleSeatClick_Assistant(labId, currentSeatIndexStr, deskDiv));
                row.appendChild(deskDiv);
                
                desksRenderedInSec++;
                seatIndexCounter++;
            }
            section.appendChild(row);
            if (seatIndexCounter >= capacity) break;
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
            const initialStatus = getSeatStatus_Assistant(labId, seatIdx); 
            const svgIcon = seatDiv.querySelector('svg.lucide-armchair'); 
            if (svgIcon) {
                svgIcon.classList.remove('system-working', 'system-not-working'); 
                svgIcon.classList.add(initialStatus === 'not-working' ? 'system-not-working' : 'system-working');
            } else {
                 // console.warn("Could not find SVG icon for seat index:", seatIdx, "in div:", seatDiv);
            }
        });
    }
    updateLegendCounts_Assistant(capacity, labId); // Update legend counts after rendering
}

async function handleSeatClick_Assistant(labId, seatIndexStr, seatContainerElement) {
    const svgIconElement = seatContainerElement.querySelector('svg.lucide-armchair'); 

    if (!svgIconElement) {
        console.error("Armchair SVG icon not found for click handling in:", seatContainerElement);
        const iTag = seatContainerElement.querySelector('i.lucide-armchair');
        if(iTag) {
            console.error("Found <i> tag instead of <svg>. Lucide might not have processed this icon or it was re-added incorrectly.");
        }
        return;
    }

    const currentStatus = getSeatStatus_Assistant(labId, seatIndexStr); 
    const newStatus = currentStatus === 'working' ? 'not-working' : 'working';

    svgIconElement.classList.remove('system-working', 'system-not-working');
    svgIconElement.classList.add(newStatus === 'not-working' ? 'system-not-working' : 'system-working');

    await setSeatStatus_Assistant(labId, seatIndexStr, newStatus); 
    // Note: setSeatStatus_Assistant already calls updateLegendCounts_Assistant on successful save.
}
// Ensure the main initialization function is exposed if not already
if (typeof window.initializeSeatUpdaterPage === 'undefined') {
    window.initializeSeatUpdaterPage = initializeSeatUpdaterPage;
}
