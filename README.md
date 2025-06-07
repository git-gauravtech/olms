
# LabLink - Optimized Lab Management System

This project is a web-based system for managing laboratory schedules, equipment, and resources.

## Tech Stack

-   **Frontend:** HTML, CSS, JavaScript
-   **Backend:** Node.js, Express.js, MySQL
-   **Styling:** Custom CSS (potentially with a utility framework if added)
-   **Icons:** Lucide Icons (via CDN or local setup)

## Project Structure

-   `/`: Root HTML files (landing, login, signup, etc.)
-   `css/`: Global stylesheets.
-   `js/`: Frontend JavaScript files (authentication, utilities, page-specific logic).
-   `dashboard/`: HTML files for user-specific dashboards (admin, faculty, student, assistant).
-   `backend/`: Contains the Node.js backend application (server, routes, database configuration, etc.).

## Getting Started

### Backend Setup

1.  Navigate to the `backend` directory: `cd backend`
2.  Install dependencies: `npm install`
3.  Ensure your MySQL database is running and the `.env` file in the `backend` directory is configured with your database credentials (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) and JWT_SECRET.
4.  Create the database schema using the provided `schema.sql` file.
5.  Start the backend server: `npm start` (or `npm run dev` for development with nodemon).

### Frontend Setup

1.  Open the HTML files (e.g., `landing.html` or `index.html`) directly in your browser.
2.  For a better development experience with live reloading, you can use a tool like `live-server`:
    -   Install it globally: `npm install -g live-server`
    -   Run it from the project's root directory: `live-server`
    (Alternatively, if you installed it as a dev dependency in the root `package.json`: `npx live-server`)

The backend API will typically be available at `http://localhost:5001/api` (or the port configured in your backend `.env`). Ensure the `API_BASE_URL` in `js/constants.js` matches this.
