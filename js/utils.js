
// Utility functions

/**
 * Displays a message on a page-level message element.
 * @param {HTMLElement} element The HTML element to display the message in.
 * @param {string} message The message text.
 * @param {('info'|'success'|'error'|'loading')} [type='info'] The type of message.
 * @param {number} [timeout=3000] Duration in ms before auto-hiding. 0 for no auto-hide. 'loading' type will not auto-hide by default.
 */
function showPageMessage(element, message, type = 'info', timeout) {
    if (!element) return;
    element.textContent = message;
    element.className = `form-message ${type}`;
    element.style.display = 'block';

    let autoHideTimeout = timeout;
    if (timeout === undefined) {
        autoHideTimeout = (type === 'loading' || type === 'error') ? 0 : 3000;
    }
    
    if (autoHideTimeout > 0) {
        setTimeout(() => {
            // Only hide if the message hasn't changed in the meantime
            if (element.textContent === message && element.style.display !== 'none') {
                 element.style.display = 'none';
            }
        }, autoHideTimeout);
    }
}

/**
 * Displays a message on a form-level message element.
 * @param {HTMLElement} element The HTML element to display the message in.
 * @param {string} message The message text.
 * @param {('info'|'success'|'error')} [type='error'] The type of message.
 */
function showFormMessage(element, message, type = 'error') {
    if(!element) return;
    element.textContent = message;
    element.className = `form-message ${type}`; // Ensure .form-message is the base class
    element.style.display = 'block';
}

/**
 * Hides a message element.
 * @param {HTMLElement} element The HTML element to hide.
 */
function hideMessage(element) {
    if(!element) return;
    element.style.display = 'none';
}

// Add other utility functions here as needed
