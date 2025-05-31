
# LabLink: Optimized Lab Management System

LabLink is a web-based system designed to efficiently manage laboratory schedules, equipment, and resources. It leverages Design and Analysis of Algorithms (DAA) principles (simulated via C++ program integration) to optimize scheduling and resource allocation, moving beyond manual, error-prone methods.

## 1. Project Goal

*   Build a web-based system for managing laboratory schedules, equipment, and resources efficiently.
*   Use advanced Design and Analysis of Algorithms (DAA) to optimize scheduling and resource allocation, replacing slow and error-prone manual methods.

## 2. Technology Stack

*   **Frontend:** HTML, CSS, Vanilla JavaScript
    *   Role-based dashboards and interactive calendar/grids for lab availability.
    *   API calls to the backend for data retrieval and actions.
*   **Backend:** Node.js with the Express.js framework
    *   Handles business logic, RESTful API endpoints.
    *   Integrates with external C++ programs (simulated) for DAA optimizations via `child_process.spawn`.
*   **Database:** MySQL
    *   Stores data for users, labs, equipment, bookings, and lab seat statuses.
*   **DAA Integration (Simulated):**
    *   The system is designed to incorporate algorithms like Graph Coloring, 0/1 Knapsack, Greedy algorithms, and Dijkstra’s algorithm.
    *   These are conceptualized as C++ programs. The Node.js backend simulates calling these programs, providing input, and receiving output.
    *   Admins can trigger these optimization simulations from a dedicated page in the web application.

## 3. User Roles and Permissions

| Role      | Description                                  | Key Functionalities                                                                                                     |
| :-------- | :------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **Admin**   | Manages the entire system, users, and labs.  | CRUD users, labs, equipment; trigger DAA algorithm simulations; review and approve/reject booking requests from Faculty. |
| **Faculty** | Teaching staff who book labs.                | Request lab bookings; view personal booking schedule; view lab availability.                                             |
| **Student** | Lab users with primarily viewing rights.     | View personal lab schedule; view lab availability.                                                                       |
| **Assistant**| Lab support staff, maintains lab conditions. | Update the working status of individual seats/systems within labs.                                                        |

## 4. System Components and Features

### 4.1. Authentication & User Management
*   **Signup & Login:** Secure user registration and login using JWT for session management.
*   **Password Reset:** Users can reset forgotten passwords by verifying their email and a pre-set secret word.
*   **Role-Based Access Control (RBAC):** Frontend and backend mechanisms ensure users only access features appropriate for their role.
*   **Profile Management:** Users can view their profile details (name, email, role, department) and change their password.

### 4.2. Lab & Equipment Management (Admin)
*   **Labs:** Admins can create, read, update, and delete lab entries (name, capacity, room number, location).
*   **Equipment:** Admins manage equipment inventory (name, type, status, assignment to specific labs).

### 4.3. Seat Status Management (Assistant)
*   Assistants can update the working status (e.g., "working", "not-working") of individual computer systems or seats within each lab, providing real-time information.

### 4.4. Booking Requests & Scheduling
*   **Faculty Booking:** Faculty can submit requests for lab slots, specifying lab, date, time, purpose, required equipment (optional), and a course/batch identifier (optional).
*   **Conflict Handling:** The system checks for conflicts. If a Faculty's request conflicts with an existing 'booked' slot, it's saved with a `pending-admin-approval` status. Otherwise, it's booked directly.
*   **My Bookings (Faculty):** Faculty can view their booking history and cancel their own bookings/requests.
*   **Admin Approval (Faculty Requests):** Admins can review `pending-admin-approval` requests from Faculty and approve or reject them.

### 4.5. Lab Availability & Visualization
*   **Weekly Grid:** A dynamic, calendar-style grid displays lab availability for a selected lab, showing booked, pending, and available slots. Users can navigate weekly.
*   **Slot Details Dialog:** Clicking a slot reveals:
    *   Detailed booking information (status, purpose, user).
    *   Admin actions (cancel booking, modify purpose).
    *   A "Book This Slot" button for Faculty/Admin if the slot is available.
    *   **Lab Layout Visualization:** A schematic diagram of the selected lab's desk/seat layout, with each seat color-coded by its working status (updated by Assistants).
    *   **Warning for Zero Working Systems:** If an "Available" slot is in a lab with 0 working systems, a warning is displayed.

### 4.6. DAA Algorithm Integration (Admin Simulation)
*   Admins can trigger simulations of DAA algorithms from a dedicated page:
    *   **Graph Coloring:** For conflict-free lab session scheduling.
    *   **0/1 Knapsack:** For optimal allocation of scarce equipment.
    *   **Greedy Algorithm:** For efficient filling of empty lab slots.
    *   **Dijkstra’s Algorithm:** For assigning labs nearest to a user's location.
*   The backend simulates preparing input data, calling a C++ executable (via `child_process.spawn`), receiving output, and summarizing potential database changes. This entire simulation (input, output, summary) is displayed to the Admin.

## 5. To Run This Project:

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
    *   Execute the SQL statements from `backend/config/schema.sql` in your `lab_management_db` to create the `users`, `labs`, `equipment`, `bookings`, and `lab_seat_statuses` tables.
4.  **Create `.env` file**:
    *   In the `backend` directory, copy `backend/.env.example` to `backend/.env`.
5.  **Edit `.env`**:
    *   Open `backend/.env` and fill in your MySQL database credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), a strong `JWT_SECRET`, and optionally `JWT_EXPIRES_IN` and `PORT_BACKEND`.
6.  **Install Backend Dependencies**:
    *   While in the `backend` directory, run:
        ```bash
        npm install
        ```

**Running the Application (Frontend + Backend):**
1.  **Navigate to the project's root directory** (e.g., `LabLink/` or `olms-main/`).
2.  **Install Root Dependencies** (if any specific to root, e.g., for development tools):
    ```bash
    npm install
    ```
    *(Note: Ensure you have also run `npm install` inside the `backend` directory as per "Backend Setup")*
3.  **Start the Server**:
    *   From the **root directory**, run:
        ```bash
        npm start
        ```
    *   This command will navigate into the `backend` directory and run `npm run dev` there (which uses `nodemon` for development).
    *   The Node.js backend server will start (typically on port 5001, or as configured in `backend/.env`). This server handles **both** the API requests and serves the static frontend HTML, CSS, and JS files.
    *   You should see messages like "MySQL Connected successfully..." and "Frontend is now served from http://localhost:5001".

**Accessing the Application:**
*   Open your browser and go to `http://localhost:5001` (or the port your backend server is running on). This will serve `index.html` by default.
*   The frontend will make API calls to `/api/...` on the same server.

**(Optional) Running Frontend with `live-server` Separately (for isolated frontend development):**
If you only want to work on frontend HTML/CSS/JS changes without running the full backend:
1.  Ensure your backend API server is running separately (`cd backend && npm run dev`).
2.  From the **root directory**, run:
    ```bash
    npm run frontend-only
    ```
    This will use `live-server` to serve the frontend (typically on `http://localhost:9002`).
    **Important:** In this mode, ensure `js/constants.js` has `API_BASE_URL_CONST` set to the full backend URL (e.g., `http://localhost:5001/api`). For unified serving (default `npm start`), it should be `/api`.

## 6. Project Structure

**Root (`LabLink/` or `olms-main/`):**
*   `index.html`: The login page and main entry point.
*   `signup.html`: The user registration page.
*   `forgot_password.html`: Page to request a password reset.
*   `reset_password.html`: Page to set a new password using a reset token.
*   `css/`: Contains the global stylesheet (`style.css`).
*   `js/`: Contains global frontend JavaScript files:
    *   `constants.js`: API base URL, user roles, navigation links, UI constants (time slots, etc.), date formatting utilities.
    *   `auth.js`: Handles login, signup, and password reset related API calls.
    *   `utils.js`: Helper utility functions for the frontend (role guards, password visibility toggle, etc.).
*   `dashboard/`: Contains HTML pages for different dashboard views and their specific JavaScript files.
    *   Role-specific dashboards: `admin.html`, `faculty.html`, `assistant.html`, `student.html`.
    *   Feature pages: `labs.html` (availability grid), `book_slot.html` (booking form), `admin_manage_labs.html`, `admin_manage_equipment.html`, `admin_manage_users.html`, `admin_faculty_requests.html`, `admin_run_algorithms.html`, `admin_view_activity_log.html`, `faculty_my_bookings.html`, `student_my_bookings.html`, `assistant_update_seat_status.html`, `profile.html`.
    *   `dashboard/js/`: Contains JavaScript files for shared dashboard logic and page-specific functionalities:
        *   `dashboard.js`: Shared JavaScript for dashboard layout (sidebar, user nav) and common functionalities.
        *   `admin_management.js`: Logic for Admin's lab and equipment management.
        *   `assistant_seat_updater.js`: Logic for Assistant updating seat statuses.
        *   `booking_form.js`: Logic for the lab booking/request form.
        *   `lab_grid.js`: Logic for the lab availability grid and its detail dialog.
*   `package.json`: Root project dependencies and scripts.
*   `README.md`: This file.

**Backend (`LabLink/backend/`):**
*   `server.js`: The main Node.js/Express backend server file. Serves static frontend files.
*   `config/`:
    *   `db.js`: MySQL database connection pool setup.
    *   `schema.sql`: SQL script to create database tables.
*   `routes/`: API route definitions (`authRoutes.js`, `labRoutes.js`, `equipmentRoutes.js`, `bookingRoutes.js`, `adminRoutes.js`).
*   `middleware/`: Custom Express middleware (`authMiddleware.js` for JWT authentication and role checks).
*   `.env` (you create this from `.env.example`): Environment variables.
*   `package.json`: Backend dependencies and scripts.

## Notes
*   The system provides a semi-automated approach: Admins control when to run DAA optimization simulations and review their outputs.
*   DAA algorithms provide data-driven recommendations to improve scheduling efficiency. The actual application of these recommendations to the database is a manual step for the Admin after review (or a future enhancement).
*   Real-time updates by Assistants on seat status keep the system’s view of lab conditions accurate.
*   The C++ integration point is designed for scalability and reuse of potentially complex, tested algorithm implementations. The current project simulates this integration.
    