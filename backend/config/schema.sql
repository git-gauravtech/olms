
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullName VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    secretWordHash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Faculty', 'Student', 'Assistant') NOT NULL,
    department VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS labs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INT NOT NULL,
    roomNumber VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    status ENUM('available', 'in-use', 'maintenance', 'broken') NOT NULL DEFAULT 'available',
    labId INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    faculty_user_id INT, 
    section_name VARCHAR(100) NOT NULL, 
    semester VARCHAR(50), 
    year INT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (faculty_user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_section (course_id, section_name, semester, year) 
);

CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, 
    section_id INT, 
    labId INT NOT NULL,
    date DATE NOT NULL,
    timeSlotId VARCHAR(50) NOT NULL, 
    start_time TIME, 
    end_time TIME,   
    purpose TEXT,
    equipmentIds JSON, 
    status ENUM('pending', 'booked', 'rejected', 'cancelled', 'pending-admin-approval', 'approved-by-admin', 'rejected-by-admin') NOT NULL DEFAULT 'pending',
    submittedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (labId) REFERENCES labs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS seats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lab_id INT NOT NULL,
    seat_number INT NOT NULL, 
    status ENUM('working', 'not-working') NOT NULL DEFAULT 'working',
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE,
    UNIQUE KEY unique_seat_in_lab (lab_id, seat_number)
);

    