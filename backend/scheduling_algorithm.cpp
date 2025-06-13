
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <map>
#include <algorithm>
#include <chrono> // Required for date/time
#include <iomanip> // For put_time, if needed, and string formatting
#include <ctime>   // For tm structure and mktime

#include "include/json.hpp" // Assuming nlohmann/json.hpp is in backend/include/

using json = nlohmann::json;

// Define structures to hold data
struct Lab {
    int id;
    std::string name;
    int capacity;
    std::string type; 
    bool is_available;
};

struct Course {
    int id;
    std::string name;
};

struct Section {
    int id;
    int course_id;
    std::string name;
    std::string course_name; 
    int expected_students; 
    int labs_per_week; 
};

struct Faculty {
    int id;
    std::string full_name;
};

struct Booking {
    int lab_id;
    int section_id;
    int user_id; // faculty_id
    std::string start_time_str; 
    std::string end_time_str;   
    std::string purpose;
    std::string status = "Scheduled";
    int created_by_user_id = 1; // Placeholder for system/admin user, will be overridden by backend
};

void to_json(json& j, const Booking& b) {
    j = json{
        {"lab_id", b.lab_id},
        {"section_id", b.section_id},
        {"user_id", b.user_id},
        {"start_time", b.start_time_str}, 
        {"end_time", b.end_time_str},     
        {"purpose", b.purpose},
        {"status", b.status},
        {"created_by_user_id", b.created_by_user_id}
    };
}

struct TimeSlot {
    int day_of_week; // 0=Mon, 1=Tue, ..., 4=Fri
    int slot_index;  // 0=9-11, 1=11-13, 2=14-16 (example 2-hour slots)

    std::string toString() const {
        return std::to_string(day_of_week) + "_" + std::to_string(slot_index);
    }
};

// Function to get the date of the upcoming Monday and format ISO datetime strings
std::tm get_upcoming_monday_date() {
    auto now = std::chrono::system_clock::now();
    std::time_t now_time_t = std::chrono::system_clock::to_time_t(now);
    std::tm current_tm = *std::localtime(&now_time_t); // Use localtime to handle timezone

    // tm_wday: 0=Sun, 1=Mon, ..., 6=Sat
    int days_until_monday = (1 - current_tm.tm_wday + 7) % 7;
    if (days_until_monday == 0) { // If today is Monday
        // Schedule for *next* Monday if today is Monday.
        days_until_monday = 7;
    }
    
    current_tm.tm_mday += days_until_monday;
    std::mktime(&current_tm); 
    
    return current_tm;
}

std::string get_iso_datetime_for_slot(const std::tm& base_monday_tm, int day_offset_from_monday, int hour) {
    std::tm slot_tm = base_monday_tm; 
    slot_tm.tm_mday += day_offset_from_monday; 
    slot_tm.tm_hour = hour;
    slot_tm.tm_min = 0;
    slot_tm.tm_sec = 0;

    std::mktime(&slot_tm);

    char buffer[20]; 
    std::strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%S", &slot_tm);
    return std::string(buffer);
}


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
            if (!item.value("is_available", true)) continue;
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
                item.value("capacity", 30), 
                item.value("labs_per_week", 1) 
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
    json output_json; // Declare output_json earlier to use for messages
    
    std::vector<TimeSlot> time_slots;
    int slot_start_hours[] = {9, 11, 14}; 
    int lab_duration_hours = 2;

    for (int day = 0; day < 5; ++day) { // Mon to Fri
        for (int slot_idx = 0; slot_idx < 3; ++slot_idx) {
            time_slots.push_back({day, slot_idx});
        }
    }

    std::map<std::string, bool> lab_slot_booked;    
    std::map<std::string, bool> faculty_slot_booked; 
    std::map<std::string, int> section_labs_scheduled_count; 

    std::tm base_monday_date_tm = get_upcoming_monday_date();

    if (labs.empty()) {
        output_json["message"] = "No available labs to schedule. Cannot generate timetable.";
        output_json["proposed_bookings"] = proposed_bookings; // Empty
        std::cout << output_json.dump(4) << std::endl;
        return 0; 
    }
    if (sections.empty()) {
        output_json["message"] = "No sections require scheduling. Cannot generate timetable.";
        output_json["proposed_bookings"] = proposed_bookings; // Empty
        std::cout << output_json.dump(4) << std::endl;
        return 0;
    }


    for (const auto& section : sections) {
        int labs_to_schedule_for_section = section.labs_per_week;
        if (section_labs_scheduled_count.count(std::to_string(section.id)) && 
            section_labs_scheduled_count[std::to_string(section.id)] >= labs_to_schedule_for_section) {
            continue; 
        }
        int current_scheduled_for_this_section = section_labs_scheduled_count.count(std::to_string(section.id)) ? section_labs_scheduled_count[std::to_string(section.id)] : 0;

        for (const auto& slot : time_slots) {
            if (current_scheduled_for_this_section >= labs_to_schedule_for_section) break;

            for (const auto& lab : labs) {
                if (!lab.is_available || lab.capacity < section.expected_students) continue;

                std::string lab_slot_key = std::to_string(lab.id) + "_" + slot.toString();
                if (lab_slot_booked.count(lab_slot_key) && lab_slot_booked[lab_slot_key]) {
                    continue; 
                }

                int faculty_id_to_assign = -1; 
                bool faculty_available_for_slot = false;

                if (!faculty_list.empty()) {
                    for (const auto& faculty : faculty_list) {
                        std::string faculty_slot_key = std::to_string(faculty.id) + "_" + slot.toString();
                        if (!faculty_slot_booked.count(faculty_slot_key) || !faculty_slot_booked[faculty_slot_key]) {
                            faculty_id_to_assign = faculty.id;
                            faculty_available_for_slot = true;
                            break;
                        }
                    }
                    if (!faculty_available_for_slot) continue; 
                } else {
                    faculty_available_for_slot = true; 
                }

                Booking booking;
                booking.lab_id = lab.id;
                booking.section_id = section.id;
                booking.user_id = (faculty_id_to_assign != -1) ? faculty_id_to_assign : 0;
                
                int start_hour = slot_start_hours[slot.slot_index];
                booking.start_time_str = get_iso_datetime_for_slot(base_monday_date_tm, slot.day_of_week, start_hour);
                booking.end_time_str = get_iso_datetime_for_slot(base_monday_date_tm, slot.day_of_week, start_hour + lab_duration_hours);
                
                std::string purpose_str = "Lab for " + section.course_name + " - Section " + section.name;
                booking.purpose = purpose_str;

                proposed_bookings.push_back(booking);

                lab_slot_booked[lab_slot_key] = true;
                if (faculty_id_to_assign != -1 && !faculty_list.empty()) {
                     faculty_slot_booked[std::to_string(faculty_id_to_assign) + "_" + slot.toString()] = true;
                }
                current_scheduled_for_this_section++;
                section_labs_scheduled_count[std::to_string(section.id)] = current_scheduled_for_this_section;
                
                if (current_scheduled_for_this_section >= labs_to_schedule_for_section) break; 
            }
            if (current_scheduled_for_this_section >= labs_to_schedule_for_section) break;
        }
    }
    
    if (proposed_bookings.empty() && !output_json.contains("message")) { // Only add this if no specific message (like no labs/sections) was set
        output_json["message"] = "Scheduling algorithm ran, but no new bookings could be proposed based on current constraints and availability.";
    }
    output_json["proposed_bookings"] = proposed_bookings;
    std::cout << output_json.dump(4) << std::endl;

    return 0;
}

