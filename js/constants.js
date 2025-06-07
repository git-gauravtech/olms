
// Define the base URL for API calls
if (typeof window !== 'undefined') {
    window.API_BASE_URL = 'http://localhost:5001/api'; // Assuming backend runs on port 5001
}

// User Roles (if needed for frontend logic, though backend enforces rules)
const USER_ROLES = {
    ADMIN: 'admin',
    FACULTY: 'faculty',
    ASSISTANT: 'assistant',
    STUDENT: 'student'
};

// Store JWT token
const TOKEN_KEY = 'lablink_token';
const USER_INFO_KEY = 'lablink_user';
