# Optimized Lab Management System (HTML, CSS, JS Version)

This is a lab management system frontend built with plain HTML, CSS, and JavaScript, along with a Node.js/Express/MySQL backend.

## To run this project:

**Prerequisites:**
1.  Node.js and npm installed.
2.  MySQL Server installed and running.

**Backend Setup:**
1.  Navigate to the `backend` directory: `cd backend`
2.  Create a MySQL database (e.g., `lab_management_db`).
3.  Run the SQL script `backend/config/schema.sql` against your database to create the necessary tables.
4.  Copy `backend/.env.example` to `backend/.env`.
5.  Edit `backend/.env` and fill in your MySQL database credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) and a strong `JWT_SECRET`. You can also set `PORT_BACKEND`.
6.  Install backend dependencies: `npm install`
7.  Run the backend server: `npm run dev` (for development with nodemon) or `npm start`.
    *   The backend will typically run on `http://localhost:5001` (or the port specified in your `.env`).

**Frontend Setup:**
1.  Navigate to the project's root directory (if you're not already there).
2.  Install frontend dev dependencies (primarily for `live-server`): `npm install`
3.  Run the frontend server: `npm start`
    *   This will use `live-server` to serve the static HTML, CSS, and JS files. It will typically open `index.html` in your browser at `http://localhost:9002`.

**Accessing the Application:**
*   Open your browser and go to `http://localhost:9002` (or the port `live-server` uses for the frontend).
*   The frontend will make API calls to the backend (e.g., `http://localhost:5001/api/...`). Ensure both servers are running.

## Project Structure

**Root:**
*   `index.html`: The login page and main entry point.
*   `signup.html`: The user registration page.
*   `css/`: Contains the global stylesheet (`style.css`).
*   `js/`: Contains global frontend JavaScript files:
    *   `constants.js`: Mock data (some initial data for UI development) and application constants.
    *   `auth.js`: Handles login and signup logic by calling backend APIs.
    *   `utils.js`: Helper utility functions for the frontend.
*   `dashboard/`: Contains HTML pages for different dashboard views and their specific JavaScript files.
    *   `dashboard.js`: Shared JavaScript for dashboard layout and common functionalities.
    *   `lab_grid.js`: Logic for the lab availability grid.
    *   `booking_form.js`: Logic for the lab booking form.
    *   `admin_management.js`: Logic for Admin's lab and equipment management.
    *   `assistant_seat_updater.js`: Logic for Assistant updating seat statuses.
*   `backend/`: Contains the Node.js backend application.
    *   `server.js`: The main backend server file.
    *   `config/`: Database configuration (`db.js`, `schema.sql`).
    *   `routes/`: API route definitions (e.g., `authRoutes.js`, `labRoutes.js`).
    *   `middleware/`: Custom middleware (e.g., `authMiddleware.js`).
    *   `.env`: Environment variables (database credentials, JWT secret - **DO NOT COMMIT THIS FILE**).
    *   `package.json`: Backend dependencies.


## Notes

*   The frontend uses plain HTML, CSS, and vanilla JavaScript.
*   The backend uses Node.js with the Express.js framework and MySQL as the database.
*   Authentication is handled using JWT (JSON Web Tokens).
*   Frontend API calls are made to the backend to fetch and manipulate data.
*   Icons are from the [Lucide Icons](https://lucide.dev/) library, loaded via CDN on the frontend.

