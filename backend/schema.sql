
-- Main Users table
DROP TABLE IF EXISTS Users;
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'faculty', 'assistant', 'student') NOT NULL,
    contact_number VARCHAR(20),
    -- Fields for faculty/assistant
    department VARCHAR(100),          -- Department for faculty/assistant
    employee_id VARCHAR(50) UNIQUE,   -- Employee ID for faculty/assistant
    -- Fields for student
    enrollment_number VARCHAR(50) UNIQUE, -- Enrollment number for student
    course VARCHAR(100),              -- Course name/ID for student (consider normalizing this later)
    section VARCHAR(50),              -- Section name/ID for student (consider normalizing this later)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Courses table
DROP TABLE IF EXISTS Courses;
CREATE TABLE Courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100), -- Optional: Department offering the course
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sections table
DROP TABLE IF EXISTS Sections;
CREATE TABLE Sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    name VARCHAR(255) NOT NULL, -- e.g., "A", "B", "Morning Batch"
    semester VARCHAR(50) NOT NULL, -- e.g., "Fall", "Spring", "1st Semester"
    year INT NOT NULL, -- e.g., 2023
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE -- If a course is deleted, its sections are also deleted
);

-- Labs table
DROP TABLE IF EXISTS Labs;
CREATE TABLE Labs (
    lab_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    room_number VARCHAR(50),
    capacity INT NOT NULL,
    type VARCHAR(100), -- e.g., "Computer Lab", "Physics Lab", "Chemistry Lab"
    is_available BOOLEAN DEFAULT TRUE, -- To mark a lab as temporarily unavailable
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Equipment table
DROP TABLE IF EXISTS Equipment;
CREATE TABLE Equipment (
    equipment_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(100), -- e.g., "Microscope", "Oscilloscope", "Computer"
    quantity INT DEFAULT 1,
    status ENUM('Available', 'In Use', 'Under Maintenance', 'Out of Order') DEFAULT 'Available',
    lab_id INT, -- Optional: If the equipment is permanently assigned to a specific lab
    purchase_date DATE,
    last_maintenance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES Labs(lab_id) ON DELETE SET NULL -- If a lab is deleted, equipment assigned to it is not deleted but lab_id becomes NULL
);


-- Bookings table
DROP TABLE IF EXISTS Bookings;
CREATE TABLE Bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT NOT NULL,
    user_id INT NOT NULL, -- User who made the booking (typically faculty or admin)
    section_id INT,       -- Section for which the lab is booked (can be NULL for general bookings)
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    purpose TEXT,
    status VARCHAR(50) DEFAULT 'Scheduled', -- e.g., Scheduled, Cancelled, Completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES Labs(lab_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES Sections(section_id) ON DELETE SET NULL, -- If section is deleted, booking remains but section_id becomes NULL
    CONSTRAINT chk_end_time CHECK (end_time > start_time) -- Ensure end time is after start time
);

-- Example: Add an admin user (replace with your actual details)
-- Make sure to hash the password appropriately if inserting manually.
-- The signup route will handle hashing.
-- INSERT INTO Users (full_name, email, password_hash, role) VALUES
-- ('Admin User', 'admin@example.com', '$2a$10$your_bcrypt_hashed_password_here', 'admin');

-- Consider adding indexes for frequently queried columns, e.g.,
-- CREATE INDEX idx_bookings_lab_time ON Bookings(lab_id, start_time, end_time);
-- CREATE INDEX idx_sections_course ON Sections(course_id);

/*
Normalization Notes:
- User's course and section: For students, 'course' and 'section' are directly in the Users table.
  This is denormalized for simplicity. A more normalized approach would be a linking table
  like `UserSections` or `Enrollments` (user_id, section_id). This depends on whether a student
  can be in multiple sections/courses simultaneously or if their current section is singular.
  The current model is simpler for direct display on signup/profile.

- Lab Equipment: Could be a many-to-many relationship if specific equipment items (not just types)
  are tracked and can be moved between labs or booked. The current `Equipment` table is simpler,
  assuming a type of equipment and its quantity, optionally tied to a lab.

Data Integrity:
- Cascade vs. Restrict vs. Set Null:
  - Courses -> Sections: ON DELETE CASCADE (if a course is removed, its sections don't make sense).
  - Labs -> Bookings: ON DELETE CASCADE (if a lab is removed, its bookings are invalid).
  - Users -> Bookings: ON DELETE CASCADE (if a user is removed, their bookings are removed).
  - Sections -> Bookings: ON DELETE SET NULL (if a section is removed, a booking might still be valid as a general booking, or it could be CASCADE).
  - Labs -> Equipment: ON DELETE SET NULL (if a lab is removed, equipment assigned to it becomes unassigned rather than deleted).
  These choices depend on business rules.
*/
