# Optimized Lab Management System (HTML, CSS, JS Version)

This is a lab management system frontend built with plain HTML, CSS, and JavaScript.

## To run this project:

1.  You need a simple HTTP server to serve the static files because browser security restrictions can prevent some JavaScript functionalities (like `localStorage` access across different files or dynamic loading of resources) from working correctly when opening HTML files directly from the file system (`file:///...`).

2.  **Using `live-server` (Recommended):**
    *   If you don't have `live-server` installed globally, you can install it:
        ```bash
        npm install -g live-server
        ```
    *   Navigate to the project's root directory in your terminal and run:
        ```bash
        live-server --port=9002
        ```
    *   This will automatically open the `index.html` (login page) in your default web browser.

    *   Alternatively, if you have it as a dev dependency (as per the updated `package.json`):
        ```bash
        npm install
        npm start 
        ``` 
        or
        ```bash
        npm run dev
        ```

3.  **Using Python's Simple HTTP Server:**
    *   If you have Python installed, navigate to the project's root directory and run:
        *   For Python 3: `python -m http.server 9002`
        *   For Python 2: `python -m SimpleHTTPServer 9002`
    *   Then open your browser and go to `http://localhost:9002`.

4.  **Using VS Code Live Server Extension:**
    *   If you are using Visual Studio Code, you can install the "Live Server" extension by Ritwick Dey.
    *   Right-click on `index.html` in the VS Code explorer and choose "Open with Live Server".

## Project Structure

*   `index.html`: The login page and main entry point.
*   `signup.html`: The user registration page.
*   `css/`: Contains the global stylesheet (`style.css`).
*   `js/`: Contains JavaScript files:
    *   `constants.js`: Mock data and application constants.
    *   `auth.js`: Handles login and signup logic.
    *   `utils.js`: Helper utility functions.
    *   `dashboard/`: Contains HTML pages for different dashboard views and their specific JavaScript files.
        *   `dashboard.js`: Shared JavaScript for dashboard layout and common functionalities.
        *   `lab_grid.js`: Logic for the lab availability grid.
        *   `booking_form.js`: Logic for the lab booking form.

## Notes

*   This version does not use React, Next.js, Vite, or Tailwind CSS.
*   All data is mocked and stored/managed using JavaScript and `localStorage`. There is no backend database.
*   Styling is done with plain CSS.
*   Interactivity is handled by vanilla JavaScript.
*   Icons are from the [Lucide Icons](https://lucide.dev/) library, loaded via CDN.