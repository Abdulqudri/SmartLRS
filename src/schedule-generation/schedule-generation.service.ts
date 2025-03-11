import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { spawn } from 'child_process';
import { CoursesService } from '../courses/courses.service';
import { RoomsService } from '../rooms/rooms.service';
import { TimeslotsService } from '../timeslots/timeslots.service';
import { UsersService } from '../users/users.service';
import { SchedulesService } from '../scheduling/scheduling.service';
import { Schedule } from 'src/scheduling/schemas/scheduling.schema';
import { Types } from 'mongoose';

@Injectable()
export class ScheduleGenerationService {
  private readonly logger = new Logger(ScheduleGenerationService.name);

  constructor(
    private coursesService: CoursesService,
    private roomsService: RoomsService,
    private timeslotsService: TimeslotsService,
    private usersService: UsersService,
    private schedulesService: SchedulesService,
  ) {}

  async generateTimetable(): Promise<void> {
    // Fetch all necessary data
    const courses = await this.coursesService.findAll();
    const rooms = await this.roomsService.findAll();
    const timeslots = await this.timeslotsService.findAll();
    const lecturers = await this.usersService.findAllLecturers();

    if (!courses.length || !rooms.length || !timeslots.length) {
      throw new BadRequestException('Insufficient data to generate timetable');
    }

    // Prepare data for Python script
    const data = {
      courses: courses.map((c) => ({
        id: c._id.toString(),
        lecturerId: c.lecturerId,
        numberOfStudents: c.numberOfStudents,
        duration: c.duration,
      })),
      rooms: rooms.map((r) => ({
        id: r._id.toString(),
        capacity: r.capacity,
      })),
      timeslots: timeslots.map((t) => ({
        id: t._id.toString(),
        day: t.day,
        startTime: t.startTime,
        endTime: t.endTime,
      })),
      lecturer_availability: lecturers.reduce((acc, lecturer) => {
        acc[lecturer._id.toString()] = lecturer.availableTimeslots || [];
        return acc;
      }, {}),
    };

    // Spawn Python process
    const pythonPath = process.platform === 'win32' ? 'venv\\Scripts\\python' : 'venv/bin/python';
    const pythonProcess = spawn(pythonPath, ['src/python/solve_timetable.py']);

    // Send input data to Python script
    const inputData = JSON.stringify(data);
    pythonProcess.stdin.write(inputData);
    pythonProcess.stdin.end();

    // Capture output
    let output = '';
    pythonProcess.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });

    // Handle process completion
    return new Promise((resolve, reject) => {
      pythonProcess.on('close', async (code) => {
        if (code !== 0) {
          this.logger.error(`Python script exited with code ${code}`);
          return reject(new BadRequestException('Failed to generate timetable'));
        }

        let solution;
        try {
          solution = JSON.parse(output);
        } catch (error) {
          this.logger.error('Invalid JSON received from Python script');
          return reject(new BadRequestException('Invalid timetable data received'));
        }

        if (!solution) {
          return reject(new BadRequestException('No feasible timetable solution found'));
        }

        // Clear existing schedules
        await this.schedulesService.deleteAll();

        // Map the Python solution (which uses indices) to schedule objects
        const schedules: Partial<Schedule>[] = Object.entries(solution)
          .map(([courseId, assignment]: [string, any]) => {
            const roomIndex = assignment.room;
            const timeslotIndex = assignment.timeslot;

            // Validate indexes
            if (
              roomIndex < 0 || roomIndex >= rooms.length ||
              timeslotIndex < 0 || timeslotIndex >= timeslots.length
            ) {
              this.logger.warn(`Invalid index for course ${courseId}: room index ${roomIndex} or timeslot index ${timeslotIndex}`);
              return null; // Skip if index is invalid
            }

            return {
              courseId: new Types.ObjectId(courseId),
              roomId: new Types.ObjectId(rooms[roomIndex]._id.toString()),
              timeslotId: new Types.ObjectId(timeslots[timeslotIndex]._id.toString()),
            };
          })
          .filter((schedule) => schedule !== null) as Partial<Schedule>[];

        await this.schedulesService.createMany(schedules);

        this.logger.log('Timetable generated successfully');
        resolve();
      });

      pythonProcess.stderr.on('data', (data) => {
        this.logger.error(`Python error: ${data.toString()}`);
        reject(new BadRequestException('Error in timetable generation script'));
      });
    });
  }
}