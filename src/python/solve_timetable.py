#!/usr/bin/env python3
import json
import sys
from collections import defaultdict
from ortools.sat.python import cp_model
from datetime import datetime

class TimetableOptimizer:
    def __init__(self, input_data):
        self.input_data = input_data
        self.model = cp_model.CpModel()
        self.assignments = {}
        self.validator = self.validate_input()
        self.course_lecturer_map = {course["id"]: course["lecturerId"] for course in self.input_data["courses"]}
        self.timeslot_map = self.validator["timeslot_map"] # Store the timeslot map

    def validate_input(self):
        errors = []
        timeslot_map = {}

        # Basic timeslot validation
        for ts in self.input_data["timeslots"]:
            try:
                start = self.parse_time(ts["startTime"])
                end = self.parse_time(ts["endTime"])
                duration_seconds = (end - start).seconds
                duration_hours = duration_seconds // 3600
                if duration_seconds % 3600 != 0 or duration_seconds <= 0:
                    errors.append(f"Invalid duration in timeslot {ts['id']}")
                timeslot_map[ts["id"]] = {
                    "duration": duration_hours,
                    "day": ts["day"].lower()
                }
                ts["duration"] = duration_hours
            except ValueError as e:
                errors.append(f"Invalid time format in timeslot {ts['id']}: {e}")
            except KeyError as e:
                errors.append(f"Missing key in timeslot {ts.get('id', 'unknown')}: {e}")

        # Course duration vs timeslot duration check
        course_durations = {course["id"]: course["duration"] for course in self.input_data["courses"]}
        for course_id, duration in course_durations.items():
            valid_durations = set(ts_info["duration"] for ts_info in timeslot_map.values())
            if duration not in valid_durations:
                errors.append(f"Course {course_id} duration ({duration} hours) does not match any available timeslot duration.")

        # Lecturer availability timeslot ID check
        timeslot_ids = set(ts["id"] for ts in self.input_data["timeslots"])
        for lecturer_id, available_slots in self.input_data["lecturer_availability"].items():
            for slot_id in available_slots:
                if slot_id not in timeslot_ids:
                    errors.append(f"Lecturer {lecturer_id} has availability for non-existent timeslot {slot_id}.")

        # Course lecturer ID existence check
        lecturer_ids = set(self.input_data["lecturer_availability"].keys())
        for course in self.input_data["courses"]:
            if course["lecturerId"] not in lecturer_ids:
                errors.append(f"Course {course['id']} has an invalid lecturer ID {course['lecturerId']}.")

        # Room capacity check (basic - more checks can be added)
        if not self.input_data.get("rooms"):
            errors.append("No rooms data provided.")
        if not self.input_data.get("courses"):
            errors.append("No courses data provided.")
        if not self.input_data.get("timeslots"):
            errors.append("No timeslots data provided.")
        if not self.input_data.get("lecturer_availability"):
            errors.append("No lecturer availability data provided.")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "timeslot_map": timeslot_map  # Return the timeslot map
        }

    def parse_time(self, time_str):
        return datetime.strptime(time_str, "%H:%M")

    def create_assignments(self):
        for course in self.input_data["courses"]:
            cid = course["id"]
            lecturer_id = course["lecturerId"]
            required_duration = course["duration"]
            student_count = course["numberOfStudents"]

            valid_ts = []
            for ts in self.input_data["timeslots"]:
                try:
                    if ts["duration"] == required_duration and \
                       ts["id"] in self.input_data["lecturer_availability"].get(lecturer_id, []):
                        valid_ts.append(ts["id"])
                except KeyError as e:
                    raise  # Re-raise the exception to be caught by the main try...except


            suitable_rooms = sorted(
                [r for r in self.input_data["rooms"] if r["capacity"] >= student_count],
                key=lambda x: (-x["capacity"], x["id"])
            )

            for room in suitable_rooms:
                for ts_id in valid_ts:
                    var_name = f"{cid}|{room['id']}|{ts_id}"
                    self.assignments[var_name] = self.model.NewBoolVar(var_name)

    def add_constraints(self):
        self.add_course_constraints()
        self.add_lecturer_constraints()
        self.add_room_constraints()

    def add_course_constraints(self):
        course_vars = defaultdict(list)
        for var_name in self.assignments:
            cid = var_name.split("|")[0]
            course_vars[cid].append(self.assignments[var_name])

        for vars in course_vars.values():
            self.model.AddExactlyOne(vars)

    def add_lecturer_constraints(self):
        lecturer_timeslot_vars = defaultdict(list)
        for var_name, var in self.assignments.items():
            cid, _, ts_id = var_name.split("|")
            lecturer_id = self.course_lecturer_map.get(cid)
            if lecturer_id:
                lecturer_timeslot_vars[(lecturer_id, ts_id)].append(var) # Use ts_id as string

        for _, vars in lecturer_timeslot_vars.items():
            self.model.AddAtMostOne(vars)

    def add_room_constraints(self):
        room_timeslot_vars = defaultdict(list)
        for var_name, var in self.assignments.items():
            _, room_id, ts_id = var_name.split("|")
            room_timeslot_vars[(room_id, ts_id)].append(var) # Use ts_id as string

        for _, vars in room_timeslot_vars.items():
            self.model.Add(sum(vars) <= 1)

    def solve(self):
        if not self.validator["valid"]:
            return {
                "status": "INVALID_INPUT",
                "errors": self.validator["errors"],
                "schedule": []
            }

        solver = cp_model.CpSolver()
        solver.parameters.num_search_workers = 8
        solver.parameters.max_time_in_seconds = 60.0
        status = solver.Solve(self.model)

        if status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            return self.process_solution(solver)
        else:
            return {
                "status": "NO_SOLUTION",
                "errors": ["No valid schedule found with current constraints"],
                "schedule": [],
                "solver_status": solver.StatusName(status)
            }

    def process_solution(self, solver):
        schedule = []
        for var_name, var in self.assignments.items():
            if solver.Value(var):
                cid, room_id, ts_id = var_name.split("|")
                schedule.append({
                    "courseId": cid,
                    "roomId": room_id,
                    "timeslotId": int(ts_id),
                    "timeslotIdString": ts_id  # Add the timeslot ID string
                })
        return {
            "status": "SUCCESS",
            "schedule": schedule,
            "stats": {
                "conflicts": solver.NumConflicts(),
                "branches": solver.NumBranches(),
                "wall_time": solver.WallTime()
            }
        }

def generate_timetable(input_data):
    optimizer = TimetableOptimizer(input_data)
    if not optimizer.validator["valid"]:
        return {
            "status": "INVALID_INPUT",
            "errors": optimizer.validator["errors"],
            "schedule": []
        }

    optimizer.create_assignments()
    optimizer.add_constraints()
    return optimizer.solve()

if __name__ == "__main__":
    try:
        input_data = json.loads(sys.stdin.read())
        result = generate_timetable(input_data)
        print(json.dumps(result))
    except ValueError as ve:
        print(json.dumps({"error": f"JSON Decode Error: {str(ve)}", "status": "CRITICAL_ERROR"}))
    except Exception as e:
        print(json.dumps({"error": f"System error: {str(e)}", "status": "CRITICAL_ERROR"}))
