import json
import sys
from ortools.sat.python import cp_model

def solve_timetable(courses, rooms, timeslots, lecturer_availability):
    # Initialize the CP model
    model = cp_model.CpModel()

    # Define variables
    course_timeslot = {}
    course_room = {}
    for course in courses:
        course_timeslot[course['id']] = model.NewIntVar(0, len(timeslots) - 1, f'timeslot_{course["id"]}')
        course_room[course['id']] = model.NewIntVar(0, len(rooms) - 1, f'room_{course["id"]}')

    # Constraint 1: Room capacity
    for course in courses:
        for room_idx, room in enumerate(rooms):
            if room['capacity'] < course['numberOfStudents']:
                model.AddForbiddenAssignments([course_room[course['id']]], [room_idx])

    # Constraint 2: Lecturer availability
    for course in courses:
        lecturer_timeslots = lecturer_availability[course['lecturerId']]
        possible_timeslots = [ts_idx for ts_idx, ts in enumerate(timeslots) if ts['id'] in lecturer_timeslots]
        model.AddAllowedAssignments([course_timeslot[course['id']]], [(ts,) for ts in possible_timeslots])

    # Constraint 3: No overlapping courses in the same room
    for room_idx in range(len(rooms)):
        for ts_idx in range(len(timeslots)):
            courses_in_room_ts = [
                model.NewBoolVar(f'course_{course["id"]}_room_{room_idx}_ts_{ts_idx}')
                for course in courses
            ]
            for i, course in enumerate(courses):
                model.Add(course_room[course['id']] == room_idx).OnlyEnforceIf(courses_in_room_ts[i])
                model.Add(course_timeslot[course['id']] == ts_idx).OnlyEnforceIf(courses_in_room_ts[i])
            model.Add(sum(courses_in_room_ts) <= 1)

    # Constraint 4: No overlapping courses for the same lecturer
    for lecturer_id in set(course['lecturerId'] for course in courses):
        lecturer_courses = [course for course in courses if course['lecturerId'] == lecturer_id]
        for ts_idx in range(len(timeslots)):
            courses_at_ts = [
                model.NewBoolVar(f'course_{course["id"]}_ts_{ts_idx}')
                for course in lecturer_courses
            ]
            for i, course in enumerate(lecturer_courses):
                model.Add(course_timeslot[course['id']] == ts_idx).OnlyEnforceIf(courses_at_ts[i])
            model.Add(sum(courses_at_ts) <= 1)

    # Solve the model
    solver = cp_model.CpSolver()
    status = solver.Solve(model)

    # Process the solution
    if status == cp_model.FEASIBLE or status == cp_model.OPTIMAL:
        solution = {
            course['id']: {
                'timeslot': solver.Value(course_timeslot[course['id']]),
                'room': solver.Value(course_room[course['id']])
            }
            for course in courses
        }
        return solution
    return None

# Read input from stdin
input_data = sys.stdin.read()
data = json.loads(input_data)

# Solve and output result
solution = solve_timetable(
    data['courses'],
    data['rooms'],
    data['timeslots'],
    data['lecturer_availability']
)

# Write solution to stdout
print(json.dumps(solution))