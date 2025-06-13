
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <map>
#include <algorithm>
#include "include/json.hpp" // Assuming nlohmann/json.hpp is in backend/include/

using json = nlohmann::json;

// Define structures to hold data
struct Lab {
    int id;
    std::string name;
    int capacity;
    std::string type; // For future use: match lab type with course needs
    bool is_available;
};

struct Course {
    int id;
    std::string name;
    // Add lab_type_required, lab_duration_hours if needed
};

struct Section {
    int id;
    int course_id;
    std::string name;
    std::string course_name; // For easier reference
    int expected_students; // For capacity checks, assuming 1 student per capacity unit
    int labs_per_week; // How many lab sessions this section needs
};

struct Faculty {
    int id;
    std::string full_name;
    // Add availability if needed
};

struct Booking {
    int lab_id;
    int section_id;
    int user_id; // faculty_id
    std::string start_time_str; // ISO format: "YYYY-MM-DDTHH:MM:SS"
    std::string end_time_str;   // ISO format: "YYYY-MM-DDTHH:MM:SS"
    std::string purpose;
    std::string status = "Scheduled";
    int created_by_user_id = 1; // Placeholder for system/admin user
};

// Helper to convert our structures to JSON for the Booking output
void to_json(json& j, const Booking& b) {
    j = json{
        {"lab_id", b.lab_id},
        {"section_id", b.section_id},
        {"user_id", b.user_id},
        {"start_time", b.start_time_str}, // Match backend expectation
        {"end_time", b.end_time_str},     // Match backend expectation
        {"purpose", b.purpose},
        {"status", b.status},
        {"created_by_user_id", b.created_by_user_id}
    };
}

// Basic time slot representation (DayOfWeek_SlotIndex, e.g., "Mon_0", "Mon_1")
struct TimeSlot {
    int day_of_week; // 0=Mon, 1=Tue, ..., 4=Fri
    int slot_index;  // 0=9-11, 1=11-13, 2=14-16 (example 2-hour slots)

    std::string toString() const {
        return std::to_string(day_of_week) + "_" + std::to_string(slot_index);
    }
};

// --- Simplified Date/Time Logic for C++ (replace with robust library for production) ---
// This is very basic and assumes scheduling for the "next week" starting from a hypothetical Monday
std::string get_iso_datetime_for_slot(int base_year, int base_month, int base_day_monday, int day_offset, int hour) {
    // This is a placeholder. A real implementation needs a proper date library.
    // For simplicity, we'll just construct strings. This won't handle month/year rollovers correctly.
    char buffer[20];
    // THIS IS HIGHLY SIMPLIFIED - assumes base_day_monday + day_offset stays within current month
    sprintf(buffer, "%04d-%02d-%02dT%02d:00:00", base_year, base_month, base_day_monday + day_offset, hour);
    return std::string(buffer);
}
// --- End Simplified Date/Time Logic ---


int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(NULL);

    json input_data;
    try {
        std::cin >> input_data;
    } catch (json::parse_error& e) {
        json error_output;
        error_output["error"] = "Failed to parse input JSON";
        error_output["details"] = e.what();
        std::cout << error_output.dump(4) << std::endl;
        return 1;
    }

    std::vector<Lab> labs;
    std::vector<Course> courses;
    std::vector<Section> sections;
    std::vector<Faculty> faculty_list;

    try {
        for (const auto& item : input_data["labs"]) {
            if (!item.value("is_available", true)) continue; // Skip unavailable labs
            labs.push_back({
                item["lab_id"],
                item["name"],
                item["capacity"],
                item.value("type", "General"),
                item.value("is_available", true)
            });
        }
        for (const auto& item : input_data["courses"]) {
            courses.push_back({item["course_id"], item["name"]});
        }
        for (const auto& item : input_data["sections"]) {
            sections.push_back({
                item["section_id"],
                item["course_id"],
                item["name"],
                item["course_name"],
                item.value("capacity", 30), // Default if not provided by backend
                item.value("labs_per_week", 1) // Default, should come from course data ideally
            });
        }
        if (input_data.contains("faculty_users")) {
            for (const auto& item : input_data["faculty_users"]) {
                faculty_list.push_back({item["user_id"], item["full_name"]});
            }
        }
    } catch (json::exception& e) {
        json error_output;
        error_output["error"] = "Error processing input data fields";
        error_output["details"] = e.what();
        std::cout << error_output.dump(4) << std::endl;
        return 1;
    }


    std::vector<Booking> proposed_bookings;
    
    // Define available time slots (Mon-Fri, 3 slots per day)
    std::vector<TimeSlot> time_slots;
    int slot_start_hours[] = {9, 11, 14}; // 9-11, 11-13, 14-16
    int lab_duration_hours = 2;

    for (int day = 0; day < 5; ++day) { // Mon to Fri
        for (int slot_idx = 0; slot_idx < 3; ++slot_idx) {
            time_slots.push_back({day, slot_idx});
        }
    }

    // Keep track of resource usage for this scheduling run
    std::map<std::string, bool> lab_slot_booked;    // key: "labID_day_slot"
    std::map<std::string, bool> faculty_slot_booked; // key: "facultyID_day_slot"
    std::map<std::string, int> section_labs_scheduled_count; // key: "sectionID"

    // Placeholder for "next week's Monday" - IN A REAL APP, GET CURRENT DATE
    int base_year = 2024; // TODO: Get current year
    int base_month = 7;   // TODO: Get current month
    int base_day_monday = 29; // TODO: Calculate actual next Monday's date

    if (labs.empty()) {
        json error_output;
        error_output["error"] = "No available labs to schedule.";
        std::cout << error_output.dump(4) << std::endl;
        return 0; // Not an error, but no bookings can be made.
    }

    for (const auto& section : sections) {
        int labs_to_schedule_for_section = section.labs_per_week;
        if (section_labs_scheduled_count.count(std::to_string(section.id)) && 
            section_labs_scheduled_count[std::to_string(section.id)] >= labs_to_schedule_for_section) {
            continue; // Already scheduled enough labs for this section
        }

        bool section_scheduled_this_iteration = false;
        for (const auto& slot : time_slots) {
            if (section_scheduled_this_iteration && section_labs_scheduled_count[std::to_string(section.id)] >= labs_to_schedule_for_section) break;

            for (const auto& lab : labs) {
                if (lab.capacity < section.expected_students) continue; // Lab too small

                std::string lab_slot_key = std::to_string(lab.id) + "_" + slot.toString();
                if (lab_slot_booked.count(lab_slot_key) && lab_slot_booked[lab_slot_key]) {
                    continue; // Lab already booked in this slot by the algorithm
                }

                int faculty_id_to_assign = -1; // -1 means no specific faculty, or use first available.
                bool faculty_available = false;

                if (!faculty_list.empty()) {
                    for (const auto& faculty : faculty_list) {
                        std::string faculty_slot_key = std::to_string(faculty.id) + "_" + slot.toString();
                        if (!faculty_slot_booked.count(faculty_slot_key) || !faculty_slot_booked[faculty_slot_key]) {
                            faculty_id_to_assign = faculty.id;
                            faculty_available = true;
                            break;
                        }
                    }
                    if (!faculty_available) continue; // No faculty available for this slot
                } else {
                    faculty_available = true; // No faculty to assign, proceed without one
                    faculty_id_to_assign = 1; // Assign to placeholder Admin/System if no faculty list
                }


                // If all checks pass, create a booking
                Booking booking;
                booking.lab_id = lab.id;
                booking.section_id = section.id;
                booking.user_id = faculty_id_to_assign; // This is faculty_id
                
                int start_hour = slot_start_hours[slot.slot_index];
                booking.start_time_str = get_iso_datetime_for_slot(base_year, base_month, base_day_monday, slot.day_of_week, start_hour);
                booking.end_time_str = get_iso_datetime_for_slot(base_year, base_month, base_day_monday, slot.day_of_week, start_hour + lab_duration_hours);
                
                std::string purpose_str = "Lab for " + section.course_name + " - Section " + section.name;
                booking.purpose = purpose_str;

                proposed_bookings.push_back(booking);

                // Mark resources as used for this run
                lab_slot_booked[lab_slot_key] = true;
                if (faculty_id_to_assign != -1 && faculty_id_to_assign != 1 && !faculty_list.empty()) {
                     faculty_slot_booked[std::to_string(faculty_id_to_assign) + "_" + slot.toString()] = true;
                }
                section_labs_scheduled_count[std::to_string(section.id)]++;
                section_scheduled_this_iteration = true;
                
                if (section_labs_scheduled_count[std::to_string(section.id)] >= labs_to_schedule_for_section) break; // Enough labs for this section
            }
            if (section_scheduled_this_iteration && section_labs_scheduled_count[std::to_string(section.id)] >= labs_to_schedule_for_section) break;
        }
    }

    json output_json;
    output_json["proposed_bookings"] = proposed_bookings;
    std::cout << output_json.dump(4) << std::endl; // Pretty print JSON

    return 0;
}
