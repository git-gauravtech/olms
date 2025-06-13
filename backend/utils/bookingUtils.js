
const pool = require('../config/db');

/**
 * Checks for overlapping bookings for a given lab and time range.
 * @param {number} lab_id - The ID of the lab.
 * @param {string|Date} start_time - The start time of the new booking.
 * @param {string|Date} end_time - The end time of the new booking.
 * @param {number|null} [exclude_booking_id=null] - An optional booking ID to exclude from the check (used when updating an existing booking).
 * @returns {Promise<boolean>} - True if an overlap is found, false otherwise.
 */
async function checkOverlappingBookings(lab_id, start_time, end_time, exclude_booking_id = null) {
    const startTimeObj = new Date(start_time);
    const endTimeObj = new Date(end_time);

    // Ensure proper ISO string format for MySQL DATETIME comparison if not already Date objects
    const startIso = startTimeObj.toISOString().slice(0, 19).replace('T', ' ');
    const endIso = endTimeObj.toISOString().slice(0, 19).replace('T', ' ');

    let query = `
        SELECT booking_id FROM Bookings 
        WHERE lab_id = ? 
        AND status != 'Cancelled'  -- Don't consider cancelled bookings as conflicts
        AND (
            (? < end_time AND ? > start_time) OR -- New booking overlaps existing
            (start_time < ? AND end_time > ?) OR -- Existing booking overlaps new
            (start_time = ? AND end_time = ?)    -- Exact same slot (less likely with precise times, but good to cover)
        )
    `;
    // Parameters: lab_id, new_start, new_start, new_end, new_end, new_start, new_end
    const params = [lab_id, startIso, startIso, endIso, endIso, startIso, endIso];

    if (exclude_booking_id) {
        query += ` AND booking_id != ?`;
        params.push(exclude_booking_id);
    }

    const [overlappingBookings] = await pool.query(query, params);
    return overlappingBookings.length > 0;
}

module.exports = { checkOverlappingBookings };
