
-- Drop tables in reverse order of dependency if they exist, to avoid foreign key constraint errors
DROP TABLE IF EXISTS Bookings;
DROP TABLE IF EXISTS Sections;
DROP TABLE IF EXISTS Labs;
DROP TABLE IF EXISTS Courses;
DROP TABLE IF EXISTS Users;

-- Users Table
CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'faculty', 'assistant', 'student')),
    contact_number VARCHAR(20) NULL,
    department VARCHAR(100) NULL,         -- For faculty/assistant
    employee_id VARCHAR(50) NULL,         -- For faculty/assistant
    enrollment_number VARCHAR(50) NULL,   -- For student
    course VARCHAR(100) NULL,             -- For student (Consider if this should be a FK to a Courses table if structured differently)
    section VARCHAR(50) NULL,             -- For student (Consider if this should be a FK to a Sections table if structured differently)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE Courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Labs Table
CREATE TABLE Labs (
    lab_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    room_number VARCHAR(50) NULL,
    capacity INT NOT NULL,
    type VARCHAR(100) NULL, -- e.g., 'Computer Lab', 'Physics Lab'
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sections Table
CREATE TABLE Sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    name VARCHAR(255) NOT NULL, -- e.g., 'A', 'B', 'Morning Batch'
    semester VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE
);

-- Bookings Table
CREATE TABLE Bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT NOT NULL,
    user_id INT NOT NULL, -- Represents the faculty/user who booked or is responsible
    section_id INT NOT NULL, -- Represents the student section for which the lab is booked
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    purpose VARCHAR(255) NULL,
    status VARCHAR(50) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Cancelled', 'Completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES Labs(lab_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES Sections(section_id) ON DELETE CASCADE,
    INDEX idx_booking_lab_time (lab_id, start_time, end_time), -- For checking overlaps
    INDEX idx_booking_user_time (user_id, start_time, end_time), -- For checking user overlaps
    INDEX idx_booking_section_time (section_id, start_time, end_time) -- For checking section overlaps
);

-- Sample data (optional, for testing)

-- Add some departments to Courses for variety if desired
-- INSERT INTO Courses (name, department) VALUES
-- ('Introduction to Programming', 'Computer Science'),
-- ('Data Structures', 'Computer Science'),
-- ('Calculus I', 'Mathematics'),
-- ('Linear Algebra', 'Mathematics'),
-- ('Physics for Engineers', 'Physics');

-- INSERT INTO Users (full_name, email, password_hash, role) VALUES
-- ('Admin User', 'admin@lablink.com', '$2a$10$yourbcryptedordummyhash1', 'admin'),
-- ('Faculty User', 'faculty@lablink.com', '$2a$10$yourbcryptedordummyhash2', 'faculty'),
-- ('Student User', 'student@lablink.com', '$2a$10$yourbcryptedordummyhash3', 'student');

-- Note: For real password_hash values, you'd generate them via the signup process.
-- The sample users above are just illustrative.

