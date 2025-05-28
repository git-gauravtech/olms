
# Optimized Lab Management System (HTML, CSS, JS Version)

This is a lab management system frontend built with plain HTML, CSS, and JavaScript, along with a Node.js/Express/MySQL backend.

## Project Aims (DAA Focus)

The system is designed to address inefficiencies in manual lab scheduling by leveraging Design and Analysis of Algorithms (DAA) techniques. Key aims include:
- Automating conflict-free lab session scheduling (using concepts like Graph Coloring).
- Optimally allocating scarce lab resources (using concepts like 0/1 Knapsack).
- Prioritizing and quickly filling lab slots (using concepts like Greedy Algorithms).
- (Future) Planning logistics like assigning nearest available labs (using concepts like Dijkstra’s Algorithm).

The core DAA algorithms are intended to be implemented in C++ and integrated with the Node.js backend. The backend then serves data and manages interactions with the HTML/JS frontend.

## To Run This Project:

**Prerequisites:**
1.  Node.js and npm installed.
2.  MySQL Server installed and running.

**Backend Setup:**
1.  **Navigate to the `backend` directory**: `cd backend`
2.  **Create MySQL Database**:
    *   Ensure your MySQL server is running.
    *   Create a database (e.g., `lab_management_db`).
        ```sql
        CREATE DATABASE IF NOT EXISTS lab_management_db;
        USE lab_management_db;
        ```
3.  **Create Tables**:
    *   Run the SQL script located at `backend/config/schema.sql` against your `lab_management_db`. This will create the necessary tables (`users`, `labs`, `equipment`, `bookings`, `lab_seat_statuses`).
4.  **Create `.env` file**:
    *   In the `backend` directory, copy `backend/.env.example` to `backend/.env`.
5.  **Edit `.env`**:
    *   Open `backend/.env` and fill in your MySQL database credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), a strong `JWT_SECRET` (e.g., a long random string), and optionally `JWT_EXPIRES_IN` and `PORT_BACKEND`.
6.  **Install Backend Dependencies**:
    *   While in the `backend` directory, run:
        ```bash
        npm install
        ```

**Running the Application (Frontend + Backend):**
1.  **Navigate to the project's root directory** (e.g., `olms-main`).
2.  **Install Root Dependencies** (mainly for dev tools if any, `live-server` is still listed but not primary):
    ```bash
    npm install
    ```
3.  **Start the Server**:
    *   From the **root directory**, run:
        ```bash
        npm start
        ```
    *   This command will now navigate into the `backend` directory and run `npm run dev` there.
    *   The Node.js backend server will start (typically on port 5001, or as configured in `backend/.env`). This server now handles **both** the API requests and serves the static frontend HTML, CSS, and JS files.
    *   You should see messages like "MySQL Connected successfully..." and "Frontend is now served from http://localhost:5001".

**Accessing the Application:**
*   Open your browser and go to `http://localhost:5001` (or the port your backend server is running on). This will serve `index.html` by default.
*   The frontend will make API calls to `/api/...` on the same server.

**(Optional) Running Frontend with `live-server` Separately (for isolated frontend development):**
If you only want to work on frontend HTML/CSS/JS changes without running the full backend or if there are issues with the unified server setup:
1.  Ensure your backend API server is running separately (`cd backend && npm run dev`).
2.  From the **root directory**, run:
    ```bash
    npm run frontend-only
    ```
    This will use `live-server` to serve the frontend (typically on `http://localhost:9002`).
    **Important:** In this mode, ensure `js/constants.js` has `API_BASE_URL_CONST` set to the full backend URL (e.g., `http://localhost:5001/api`). For unified serving, it should be `/api`.

## Project Structure

**Root (`olms-main/`):**
*   `index.html`: The login page and main entry point.
*   `signup.html`: The user registration page.
*   `forgot_password.html`: Page to request a password reset.
*   `reset_password.html`: Page to set a new password using a reset token.
*   `css/`: Contains the global stylesheet (`style.css`).
*   `js/`: Contains global frontend JavaScript files:
    *   `constants.js`: API base URL, user roles, navigation links, UI constants (time slots, etc.).
    *   `auth.js`: Handles login, signup, and password reset related API calls.
    *   `utils.js`: Helper utility functions for the frontend (role guards, password visibility toggle, etc.).
*   `dashboard/`: Contains HTML pages for different dashboard views and their specific JavaScript files.
    *   `admin.html`, `faculty.html`, `assistant.html`, `student.html`: Main dashboard pages for each role.
    *   Other HTML files for specific features (e.g., `labs.html`, `book_slot.html`, `admin_manage_labs.html`).
    *   `dashboard/js/`: Contains JavaScript files for shared dashboard logic and page-specific functionalities:
        *   `dashboard.js`: Shared JavaScript for dashboard layout (sidebar, user nav) and common functionalities.
        *   `admin_management.js`: Logic for Admin's lab and equipment management (CRUD operations).
        *   `assistant_seat_updater.js`: Logic for Assistant updating seat statuses.
        *   `booking_form.js`: Logic for the lab booking/request form.
        *   `lab_grid.js`: Logic for the lab availability grid.
*   `package.json`: Root project dependencies and scripts.
*   `README.md`: This file.

**Backend (`olms-main/backend/`):**
*   `server.js`: The main Node.js/Express backend server file. Now also serves static frontend files.
*   `config/`:
    *   `db.js`: MySQL database connection pool setup.
    *   `schema.sql`: SQL script to create database tables.
*   `routes/`: API route definitions (e.g., `authRoutes.js`, `labRoutes.js`, `equipmentRoutes.js`, `bookingRoutes.js`, `adminRoutes.js`).
*   `middleware/`: Custom Express middleware (e.g., `authMiddleware.js` for JWT authentication and role checks).
*   `.env` (you create this from `.env.example`): Environment variables (database credentials, JWT secret - **DO NOT COMMIT THIS FILE if it contains sensitive data**).
*   `package.json`: Backend dependencies and scripts.

## Notes
*   The frontend uses plain HTML, CSS, and vanilla JavaScript.
*   The backend uses Node.js with the Express.js framework and MySQL as the database.
*   The backend now serves the static frontend files, unifying the application under one server process for easier running.
*   Authentication is handled using JWT (JSON Web Tokens).
*   Icons are from the [Lucide Icons](https://lucide.dev/) library, loaded via CDN on the frontend.
*   The C++ algorithm integration points are simulated in the backend (`POST /api/admin/algorithms/:algorithmName`). The actual execution of C++ code from Node.js (e.g., via `child_process`) is a subsequent implementation step.
