
# LabLink - Optimized Lab Management System

This project is a web-based system for managing laboratory schedules, equipment, and resources. It consists of a Node.js/Express backend and a static HTML, CSS, and JavaScript frontend.

## Tech Stack

-   **Frontend:** HTML, CSS, JavaScript
-   **Backend:** Node.js, Express.js, MySQL
-   **Styling:** Custom CSS
-   **Icons:** Lucide Icons (via CDN)

## Project Structure

-   `/`: Root directory containing frontend files (HTML, CSS, JS) and this README.
    -   `css/`: Global stylesheets.
    -   `js/`: Frontend JavaScript files.
    -   `dashboard/`: HTML files for user-specific dashboards.
    -   `*.html`: Root HTML files like `landing.html`, `index.html` (login), `signup.html`.
-   `backend/`: Contains the Node.js backend application.
    -   `config/`: Database configuration.
    -   `middleware/`: Custom middleware (e.g., authentication).
    -   `routes/`: API route definitions.
    -   `server.js`: The main backend server file.
    -   `.env`: Environment configuration (you'll need to create this).

## Getting Started

This project requires two main components to be run separately: the **Backend Server** and the **Frontend Server**.

### 1. Backend Setup & Server

The backend handles API requests and database interactions.

1.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Configuration:**
    Create a `.env` file in the `backend` directory. Copy the contents of `.env.example` (if provided, otherwise create it) and fill in your actual details:
    ```env
    DB_HOST=localhost
    DB_USER=your_mysql_user
    DB_PASSWORD=your_mysql_password
    DB_NAME=lablink_db
    JWT_SECRET=a_strong_and_long_random_secret_key_for_jwt
    PORT=5001
    ```
4.  **Database Setup:**
    Ensure your MySQL database server is running. Create the database specified in `DB_NAME` (e.g., `lablink_db`). Apply the database schema using a `schema.sql` file (you'll need to create this schema based on the application's needs, including tables for Users, Courses, Sections, Labs, Bookings, etc.).
5.  **Start the backend server:**
    ```bash
    npm start
    ```
    (or `npm run dev` if you have `nodemon` configured for development, which is recommended).
    The backend API should now be running, typically at `http://localhost:5001/api`.

### 2. Frontend Server

The frontend consists of static HTML, CSS, and JavaScript files.

1.  **Navigate to the project's root directory** (where this README and the root `package.json` are located).
2.  **Install frontend development dependencies:**
    ```bash
    npm install
    ```
    (This primarily installs `live-server` if you haven't already).
3.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    This command uses `live-server` to serve the frontend files. It should automatically open `landing.html` in your default web browser, typically at `http://localhost:8080`.

### 3. Frontend and Backend Integration Model

-   The **Frontend** (served by `live-server`, e.g., at `http://localhost:8080`) and the **Backend** (Node.js/Express server, e.g., at `http://localhost:5001`) run as **separate processes**.
-   The Frontend communicates with the Backend by making **API calls**.
-   The JavaScript code in the frontend (specifically in `js/constants.js`) defines `window.API_BASE_URL = 'http://localhost:5001/api';`. All API requests from the frontend's JavaScript will be directed to this base URL.
-   Ensure your backend server is running and accessible at the URL specified in `js/constants.js` for the frontend to function correctly.

You should now be able to access the application by opening `http://localhost:8080` (or whatever port `live-server` uses) in your browser.
The backend API will be available at `http://localhost:5001/api`.

