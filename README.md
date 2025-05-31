
# LabLink: Optimized Lab Management System (OLMS)

LabLink is a web-based system designed to efficiently manage laboratory schedules, equipment, and resources. It leverages Design and Analysis of Algorithms (DAA) principles (simulated via C++ program integration) to optimize scheduling and resource allocation, moving beyond manual, error-prone methods. This system is tailored for educational institutions, allowing for course and section-based lab bookings.

## 1. Project Goal

*   Build a web-based system for managing laboratory schedules, equipment, and resources efficiently.
*   Use advanced Design and Analysis of Algorithms (DAA) to optimize scheduling and resource allocation, replacing slow and error-prone manual methods.
*   Support course and section-based lab bookings for faculty.

## 2. Technology Stack

*   **Frontend:** HTML, CSS, Vanilla JavaScript
    *   Role-based dashboards and interactive calendar/grids for lab availability.
    *   API calls to the backend for data retrieval and actions.
*   **Backend:** Node.js with the Express.js framework
    *   Handles business logic, RESTful API endpoints.
    *   Integrates with external C++ programs (simulated) for DAA optimizations via `child_process.spawn`.
*   **Database:** MySQL
    *   Stores data for users, labs, equipment, courses, sections, bookings, and lab seat statuses.
*   **DAA Integration (Simulated):**
    *   The system incorporates algorithms like Graph Coloring, 0/1 Knapsack, Greedy algorithms, and Dijkstra’s algorithm.
    *   These are conceptualized as C++ programs. The Node.js backend simulates calling these programs, providing input (including course/section data), and receiving output.
    *   Admins can trigger these optimization simulations from a dedicated page. The system displays the simulated inputs, outputs, and potential database impact for Admin review. The actual application of these algorithm-driven suggestions to the live database is a conceptual next step, maintaining the current semi-automated approach.

## 3. User Roles and Permissions

| Role      | Description                                  | Key Functionalities                                                                                                     |
| :-------- | :------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **Admin**   | Manages the entire system, users, labs, courses, sections.  | CRUD users, labs, equipment, courses, sections; trigger DAA algorithm simulations; review and approve/reject booking requests from Faculty. |
| **Faculty** | Teaching staff who book labs for course sections. | Request lab bookings for their assigned sections; view personal booking schedule; view lab availability.             |
| **Student** | Lab users with primarily viewing rights.     | View personal lab schedule (for enrolled sections - *enrollment feature simplified/mocked*); view lab availability.         |
| **Assistant**| Lab support staff, maintains lab conditions. | Update the working status of individual seats/systems within labs.                                                        |

## 4. System Components and Features

### 4.1. Authentication & User Management
*   **Signup & Login:** Secure user registration and login using JWT for session management.
*   **Password Reset:** Users can reset forgotten passwords by verifying their email and a pre-set secret word.
*   **Role-Based Access Control (RBAC):** Frontend and backend mechanisms ensure users only access features appropriate for their role.
*   **Profile Management:** Users can view their profile details and change their password.

### 4.2. Core Academic Structure (Admin)
*   **Courses Management:** Admins can create, read, update, and delete courses (name, department).
*   **Sections Management:** Admins can create, read, update, and delete sections for each course (section name, assigned faculty, semester, year).

### 4.3. Lab & Equipment Management (Admin)
*   **Labs:** Admins can create, read, update, and delete lab entries (name, capacity, room number, location).
*   **Equipment:** Admins manage equipment inventory (name, type, status, assignment to specific labs).

### 4.4. Seat Status Management (Assistant)
*   Assistants can update the working status (e.g., "working", "not-working") of individual computer systems or seats within each lab using a dedicated interface that visualizes the lab layout.

### 4.5. Booking Requests & Scheduling
*   **Faculty Booking:** Faculty can submit requests for lab slots, selecting one of their assigned course sections, the lab, date, time, purpose, and optionally required equipment.
*   **Conflict Handling:** The system checks for time conflicts for the selected lab. If a Faculty's request conflicts with an existing 'booked' slot, it's saved with a `pending-admin-approval` status. Otherwise, it's booked directly with `booked` status.
*   **My Bookings (Faculty):** Faculty can view their booking history and cancel their own bookings/requests.
*   **Admin Approval (Faculty Requests):** Admins can review `pending-admin-approval` requests from Faculty and approve or reject them.

### 4.6. Lab Availability & Visualization
*   **Weekly Grid:** A dynamic, calendar-style grid displays lab availability for a selected lab, showing booked, pending, and available slots. Users can navigate weekly.
*   **Slot Details Dialog:** Clicking a slot reveals:
    *   Detailed booking information (status, purpose, user, course, section).
    *   Admin actions (cancel booking, modify purpose).
    *   A "Book This Slot" button for Faculty/Admin if the slot is available.
    *   **Lab Layout Visualization:** A schematic diagram of the selected lab's desk/seat layout, with each seat color-coded by its working status. Includes a summary of working/non-working systems.
    *   **Warning for Zero Working Systems:** If an "Available" slot is in a lab with 0 working systems, a warning is displayed, and users are prompted for confirmation if they attempt to book it.

### 4.7. DAA Algorithm Integration (Admin Simulation)
*   Admins can trigger simulations of DAA algorithms from a dedicated page:
    *   **Graph Coloring:** For conflict-free lab session scheduling based on course sections, faculty, labs, and time slots.
    *   **0/1 Knapsack:** For optimal allocation of scarce equipment to booking requests based on resource availability and request priority.
    *   **Greedy Algorithm:** For efficient filling of empty lab slots with pending bookings or tasks.
    *   **Dijkstra’s Algorithm:** For assigning labs nearest to a faculty's department/location based on a campus layout graph.
*   The backend simulates preparing input data (now including course/section information), calling a C++ executable, receiving output, and summarizing potential database changes. This simulation (input, output, summary) is displayed to the Admin for review. The actual application of these suggestions to the live database is a conceptual next step.

### 4.8. System Activity Log (Admin)
*   Admins can view a mock system activity log displaying important events like user logins, creations, and algorithm triggers.

## 5. Algorithm Usage & Integration (PRD Aligned)

The system integrates the following DAA algorithms (simulated as C++ calls) for optimization:

### 5.1 Graph Coloring Algorithm
*   **Purpose:** Schedule lab sessions for course sections to avoid time conflicts among labs or for faculty teaching multiple sections.
*   **Input (Simulated):** Graph nodes (course sections needing lab time), available labs, time slots, faculty assignments to sections, and existing booked slots.
*   **Output (Simulated):** Assignment of time slots and labs (colors) to sections to achieve a conflict-free schedule, or identification of unschedulable sections.
*   **Usage:** Admin triggers simulation; backend builds a conceptual conflict graph and runs the "Graph Coloring" simulation. The output displayed suggests an optimized schedule for Admin review.

### 5.2 Knapsack Algorithm
*   **Purpose:** Allocate scarce lab equipment to booking requests (associated with sections/courses), maximizing total priority or utility.
*   **Input (Simulated):** List of booking requests needing specific equipment (with priority values based on section needs or course level), and total available units of scarce resources.
*   **Output (Simulated):** An optimal subset of bookings to allocate equipment to, without exceeding availability, maximizing total priority.
*   **Usage:** Admin triggers simulation; backend gathers equipment demands from bookings and runs the "Knapsack" simulation. The output suggests an optimal equipment allocation for Admin review.

### 5.3 Greedy Algorithm
*   **Purpose:** Fill free lab slots or seats efficiently with smaller pending bookings (for sections) or tasks.
*   **Input (Simulated):** Identified free time slots in the schedule and a list of pending bookings (for sections) or tasks with priorities and requirements.
*   **Output (Simulated):** Assignments of tasks/bookings to free slots that maximize lab utilization based on a greedy strategy.
*   **Usage:** Admin triggers simulation; backend identifies gaps and runs the "Greedy" simulation. The output suggests slot fillings for Admin review.

### 5.4 Dijkstra’s Algorithm
*   **Purpose:** Assign labs or resources nearest to a faculty's department or a section's primary location for convenience.
*   **Input (Simulated):** A graph representing the campus/building layout with weighted edges (distances), a faculty/section's source location, and a list of target available labs.
*   **Output (Simulated):** The nearest available lab(s) and the shortest path(s) to them.
*   **Usage:** Admin triggers simulation; backend models the layout and runs "Dijkstra's" simulation. The output suggests the most convenient lab(s) for Admin review for assigning to section bookings.

## 6. Detailed System Workflow (Summary)
1.  **Admin Setup:** Admin creates labs, courses, sections (assigning faculty), and users.
2.  **Faculty Booking Request:** Faculty logs in, selects one of their course sections, desired lab, date, time, and submits a request.
3.  **Conflict Check:** Backend checks for conflicts. Non-conflicting requests are auto-approved (`booked`). Conflicting requests become `pending-admin-approval`.
4.  **Admin Reviews Pending Faculty Requests:** Admin dashboard lists `pending-admin-approval` requests for action (approve/reject).
5.  **Admin Triggers Algorithmic Optimizations:** Admin uses a dedicated page to run simulations of the DAA algorithms.
6.  **Admin Reviews Algorithm Suggestions:** Frontend displays simulated inputs, outputs, and database impact summaries.
7.  **Schedule Update:** Bookings are updated (e.g., admin approval, faculty direct booking).
8.  **Daily Lab Operations:** Assistants update seat statuses; users view real-time lab availability and seat conditions.

## 7. To Run This Project:

**Prerequisites:**
1.  Node.js and npm installed.
2.  MySQL Server installed and running.

**Backend Setup:**
1.  **Navigate to the `backend` directory**: `cd backend`
2.  **Create MySQL Database**:
    *   Ensure your MySQL server is running.
    *   Create a database (e.g., `lab_management_db`).
    *   Execute the SQL statements from `backend/config/schema.sql` in your `lab_management_db` to create all tables.
3.  **Create `.env` file**: In `backend`, copy `backend/.env.example` to `backend/.env`.
4.  **Edit `.env`**: Fill in MySQL credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), a `JWT_SECRET`, and optionally `PORT_BACKEND`.
5.  **Install Backend Dependencies**: `npm install` (inside `backend` directory).

**Running the Application:**
1.  **From the project's root directory**, run: `npm start`
    *   This starts the backend server (typically on port 5001), which also serves the frontend static files.
2.  **Access:** Open your browser to `http://localhost:5001`.

## 8. Project Structure (Simplified)

*   **Root (`LabLink/`):**
    *   `index.html`, `signup.html`, etc. (Auth pages)
    *   `css/`: Global stylesheet.
    *   `js/`: Global frontend JS (`constants.js`, `utils.js`, `auth.js`).
    *   `dashboard/`: HTML pages for dashboards and features, and their specific JS files.
        *   `js/`: Dashboard-specific JS (`dashboard.js`, `admin_management.js`, `booking_form.js`, etc.)
    *   `package.json`: Root dependencies (minimal, mostly for dev tools).
*   **Backend (`LabLink/backend/`):**
    *   `server.js`: Main Node.js/Express server.
    *   `config/`: `db.js`, `schema.sql`.
    *   `routes/`: API routes (`authRoutes.js`, `labRoutes.js`, `courseRoutes.js`, `sectionRoutes.js`, etc.).
    *   `middleware/`: `authMiddleware.js`.
    *   `.env`, `package.json`.

## Notes
*   The system is semi-automated: Admins control DAA optimization simulations and review outputs. The application of suggestions to the live database is a conceptual next step.
*   The C++ integration is simulated for this prototype.
    