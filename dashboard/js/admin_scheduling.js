
function initializeAdminSchedulingPage() {
    const runSchedulingBtn = document.getElementById('runSchedulingBtn');
    const algorithmStatusMessage = document.getElementById('algorithmStatusMessage');
    const TOKEN = localStorage.getItem(window.TOKEN_KEY);

    if (!runSchedulingBtn || !algorithmStatusMessage) {
        console.error('Required elements for scheduling page are missing.');
        return;
    }

    runSchedulingBtn.addEventListener('click', async () => {
        if (!TOKEN) {
            showPageMessage(algorithmStatusMessage, 'Authentication error. Please log in again.', 'error', 0);
            return;
        }

        runSchedulingBtn.disabled = true;
        runSchedulingBtn.innerHTML = '<i data-lucide="loader-2" class="animate-spin mr-2"></i> Initiating...';
        if (window.lucide) window.lucide.createIcons();
        showPageMessage(algorithmStatusMessage, 'Attempting to initiate scheduling process...', 'loading', 0);

        try {
            const response = await fetch(`${window.API_BASE_URL}/scheduling/run`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`,
                    'Content-Type': 'application/json'
                },
                // body: JSON.stringify({ parameters: {} }) // Future: pass parameters if needed
            });

            const result = await response.json();

            if (response.ok) {
                showPageMessage(algorithmStatusMessage, `${result.message} ${result.details || ''}`, 'success', 0);
            } else {
                throw new Error(result.message || `Failed to initiate scheduling: ${response.status}`);
            }

        } catch (error) {
            console.error('Error initiating scheduling:', error);
            showPageMessage(algorithmStatusMessage, `Error: ${error.message}`, 'error', 0);
        } finally {
            runSchedulingBtn.disabled = false;
            runSchedulingBtn.innerHTML = '<i data-lucide="play-circle" class="mr-2"></i> Run Scheduling Algorithm';
            if (window.lucide) window.lucide.createIcons();
        }
    });
}
