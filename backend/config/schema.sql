-- Main database for LabLink: Optimized Lab Management System
CREATE DATABASE IF NOT EXISTS lab_management_db;
USE lab_management_db;

-- Users Table: Stores information about all users of the system.
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    secretWordHash VARCHAR(255) NOT NULL COMMENT 'For password recovery validation',
    role VARCHAR(50) NOT NULL COMMENT 'Admin, Faculty, Student, Assistant',
    department VARCHAR(255) NULL COMMENT 'User''s academic department',
    resetPasswordToken VARCHAR(255) NULL,
    resetPasswordExpires DATETIME NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Courses Table: Stores academic courses offered.
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NULL COMMENT 'Department offering the course',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sections Table: Stores sections for each course, linking to faculty.
CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    faculty_user_id INT NULL COMMENT 'Faculty member assigned to teach this section',
    section_name VARCHAR(255) NOT NULL,
    semester VARCHAR(50) NULL COMMENT 'e.g., Fall, Spring, Summer',
    year INT NULL COMMENT 'e.g., 2024',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY idx_course_section_sem_year (course_id, section_name, semester, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Labs Table: Stores information about physical laboratories.
CREATE TABLE IF NOT EXISTS labs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    roomNumber VARCHAR(50) NOT NULL,
    location VARCHAR(255) NULL COMMENT 'e.g., Building Name, Floor',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipment Table: Stores details of lab equipment.
CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'e.g., Oscilloscope Unit #1',
    type VARCHAR(100) NOT NULL COMMENT 'e.g., Oscilloscope, Microscope',
    status VARCHAR(50) NOT NULL COMMENT 'available, in-use, maintenance, broken',
    labId INT NULL COMMENT 'Lab where the equipment is currently located/assigned',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bookings Table: Stores all lab booking requests and their statuses.
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'User who made the booking (typically Faculty)',
    section_id INT NOT NULL COMMENT 'Section for which the lab is booked',
    labId INT NOT NULL,
    date DATE NOT NULL,
    timeSlotId VARCHAR(255) NOT NULL COMMENT 'Reference to MOCK_TIME_SLOTS_CONST ID',
    start_time TIME NOT NULL COMMENT 'Derived from timeSlotId',
    end_time TIME NOT NULL COMMENT 'Derived from timeSlotId',
    purpose TEXT NULL,
    equipmentIds JSON NULL COMMENT 'Array of equipment IDs requested, e.g., [1, 5, 10]',
    status VARCHAR(50) NOT NULL COMMENT 'pending, booked, rejected, cancelled, pending-admin-approval, approved-by-admin, rejected-by-admin',
    submittedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE CASCADE,
    INDEX idx_booking_lab_date_time (labId, date, start_time, end_time) COMMENT 'For efficient conflict checking'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seats Table: Stores the working status of individual seats/systems within labs.
CREATE TABLE IF NOT EXISTS seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT NOT NULL,
    seat_number INT NOT NULL COMMENT '0-indexed seat number within the lab',
    status VARCHAR(50) NOT NULL DEFAULT 'working' COMMENT 'working, not-working',
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE,
    UNIQUE KEY idx_lab_seat (lab_id, seat_number) COMMENT 'Ensures one status entry per seat per lab'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample Data (Optional - uncomment to insert some initial data for testing)
/*
-- Sample Admin User (Password: adminpassword, Secret: adminsecret)
INSERT INTO users (fullName, email, passwordHash, secretWordHash, role, department) VALUES
('Admin User', 'admin@example.com', '$2a$10$gL7Oq3hZpT6rD7eQxYt5r.uYQjXzL4wN.cW5t3jO8bK2s7.K9HjZa', '$2a$10$gL7Oq3hZpT6rD7eQxYt5r.uYQjXzL4wN.cW5t3jO8bK2s7.K9HjZa', 'Admin', 'IT Department');

-- Sample Faculty User (Password: facultypassword, Secret: facultysecret)
INSERT INTO users (fullName, email, passwordHash, secretWordHash, role, department) VALUES
('Dr. Faculty One', 'faculty@example.com', '$2a$10$gL7Oq3hZpT6rD7eQxYt5r.uYQjXzL4wN.cW5t3jO8bK2s7.K9HjZa', '$2a$10$gL7Oq3hZpT6rD7eQxYt5r.uYQjXzL4wN.cW5t3jO8bK2s7.K9HjZa', 'Faculty', 'CSE (Computer Science & Engineering)');

-- Sample Student User (Password: studentpassword, Secret: studentsecret)
INSERT INTO users (fullName, email, passwordHash, secretWordHash, role, department) VALUES
('Student Alpha', 'student@example.com', '$2a$10$gL7Oq3hZpT6rD7eQxYt5r.uYQjXzL4wN.cW5t3jO8bK2s7.K9HjZa', '$2a$10$gL7Oq3hZpT6rD7eQxYt5r.uYQjXzL4wN.cW5t3jO8bK2s7.K9HjZa', 'Student', 'CSE (Computer Science & Engineering)');

-- Sample Assistant User (Password: assistantpassword, Secret: assistantsecret)
INSERT INTO users (fullName, email, passwordHash, secretWordHash, role, department) VALUES
('Lab Assistant Beta', 'assistant@example.com', '$2a$10$gL7Oq3hZpT6rD7eQxYt5r.uYQjXzL4wN.cW5t3jO8bK2s7.K9HjZa', '$2a$10$gL7Oq3hZpT6rD7eQxYt5r.uYQjXzL4wN.cW5t3jO8bK2s7.K9HjZa', 'Assistant', 'Central Lab Services');

-- Sample Courses
INSERT INTO courses (name, department) VALUES
('Introduction to Programming', 'CSE (Computer Science & Engineering)'),
('Data Structures and Algorithms', 'CSE (Computer Science & Engineering)'),
('Digital Logic Design', 'ECE (Electronics & Communication Engineering)');

-- Sample Sections
INSERT INTO sections (course_id, faculty_user_id, section_name, semester, year) VALUES
((SELECT id from courses WHERE name='Introduction to Programming'), (SELECT id from users WHERE email='faculty@example.com'), 'Section A', 'Fall', 2024),
((SELECT id from courses WHERE name='Data Structures and Algorithms'), (SELECT id from users WHERE email='faculty@example.com'), 'Section B', 'Fall', 2024);

-- Sample Labs
INSERT INTO labs (name, capacity, roomNumber, location) VALUES
('Computer Lab 101', 30, 'C-101', 'Block C, First Floor'),
('Electronics Lab 205', 20, 'E-205', 'Block E, Second Floor');

-- Sample Equipment
INSERT INTO equipment (name, type, status, labId) VALUES
('Oscilloscope Unit #1', 'Oscilloscope', 'available', (SELECT id from labs WHERE name='Electronics Lab 205')),
('Desktop PC #15', 'Computer', 'available', (SELECT id from labs WHERE name='Computer Lab 101'));

-- Sample Seats (Computer Lab 101 - first 2 seats working, seat 3 not-working)
INSERT INTO seats (lab_id, seat_number, status) VALUES
((SELECT id from labs WHERE name='Computer Lab 101'), 0, 'working'),
((SELECT id from labs WHERE name='Computer Lab 101'), 1, 'working'),
((SELECT id from labs WHERE name='Computer Lab 101'), 2, 'not-working');
*/