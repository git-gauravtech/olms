
// Define the base URL for API calls
if (typeof window !== 'undefined') {
    window.API_BASE_URL = 'http://localhost:5001/api'; // Assuming backend runs on port 5001
    window.TOKEN_KEY = 'lablink_token';
    window.USER_INFO_KEY = 'lablink_user_info'; // Changed from lablink_user for clarity

    // User Roles (for frontend logic, backend enforces rules too)
    window.USER_ROLES = {
        ADMIN: 'admin',
        FACULTY: 'faculty',
        ASSISTANT: 'assistant',
        STUDENT: 'student'
    };
}
