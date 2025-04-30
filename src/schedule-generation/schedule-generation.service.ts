import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { CoursesService } from '../courses/courses.service';
import { RoomsService } from '../rooms/rooms.service';
import { TimeslotsService } from '../timeslots/timeslots.service';
import { UsersService } from '../users/users.service';
import { SchedulesService } from '../scheduling/scheduling.service';
import { Course } from '../courses/schema/course.schema';
import { Room } from '../rooms/schemas/room.schema';
import { Timeslot } from '../timeslots/schemas/timeslot.schema';
import { User } from '../users/schema/user.schema';
import { Types } from 'mongoose';
import * as path from 'path';

// Define types for data exchange with Python
interface PythonCourse {
  id: string;
  lecturerId: string;
  numberOfStudents: number;
  duration: number;
}

interface PythonRoom {
  id: string;
  capacity: number;
}

interface PythonTimeslot {
  id: string; // Use string, representing ObjectId
  day: string;
  startTime: string;
  endTime: string;
}

interface PythonLecturerAvailability {
  [lecturerId: string]: string[]; // Keep as string[] of ObjectIds
}

interface PythonData {
  courses: PythonCourse[];
  rooms: PythonRoom[];
  timeslots: PythonTimeslot[];
  lecturer_availability: PythonLecturerAvailability;
  holidays: [];
}

interface PythonSolution {
  schedule: {
    courseId: string;
    roomId: string;
    timeslotId: string; // Use string, representing ObjectId
    timeslotIdString: string;
  }[];
}
export interface validSchedule {
  courseId: Types.ObjectId;
  roomId: Types.ObjectId;
  timeslotId: Types.ObjectId;
}

@Injectable()
export class ScheduleGenerationService {
  private readonly logger = new Logger(ScheduleGenerationService.name);
  private readonly pythonScriptPath = path.join(
    __dirname,
    '..',
    '..',
    'src',
    'python',
    'solve_timetable.py',
  );

  constructor(
    private readonly coursesService: CoursesService,
    private readonly roomsService: RoomsService,
    private readonly timeslotsService: TimeslotsService,
    private readonly usersService: UsersService,
    private readonly schedulesService: SchedulesService,
  ) {}

  async generateTimetable(): Promise<void> {
    try {
      this.logger.log('Starting timetable generation');

      const [courses, rooms, timeslots, lecturers] = await Promise.all([
        this.coursesService.findAll(),
        this.roomsService.findAll(),
        this.timeslotsService.findAll(),
        this.usersService.findAllLecturers(),
      ]);

      this.validateData(courses, rooms, timeslots);

      const pythonData = this.createPythonData(
        courses,
        rooms,
        timeslots,
        lecturers,
      );
      console.log(pythonData);
      const solution = await this.runPythonScript(pythonData);

      this.validateSolution(solution);

      await this.schedulesService.deleteAll();

      const validSchedules = this.processSolution(
        solution,
        courses,
        rooms,
        timeslots,
      );

      if (validSchedules.length > 0) {
        await this.schedulesService.createMany(validSchedules);
        this.logger.log(`Created ${validSchedules.length} schedule entries`);
      } else {
        this.logger.warn(
          'No valid schedule entries generated from the solution.',
        );
        throw new BadRequestException('No valid schedule entries generated');
      }

      this.logger.log('Timetable generation completed successfully');
    } catch (error) {
      this.handleError(error);
    }
  }

  private validateData(
    courses: Course[],
    rooms: Room[],
    timeslots: Timeslot[],
  ): void {
    if (!courses.length || !rooms.length || !timeslots.length) {
      throw new BadRequestException('Insufficient data to generate timetable');
    }
  }

  private createPythonData(
    courses: Course[],
    rooms: Room[],
    timeslots: Timeslot[],
    lecturers: User[],
  ): PythonData {
    return {
      courses: courses.map((course) => ({
        id: course._id.toString(),
        lecturerId: course.lecturerId?.userId.toString() || '',
        numberOfStudents: course.numberOfStudents,
        duration: course.duration,
      })),
      rooms: rooms.map((room) => ({
        id: room._id.toString(),
        capacity: room.capacity,
      })),
      timeslots: timeslots.map((timeslot) => ({
        id: timeslot._id.toString(), // Use toString() to get string representation
        day: timeslot.day,
        startTime: timeslot.startTime,
        endTime: timeslot.endTime,
      })),
      lecturer_availability: lecturers.reduce((availability, lecturer) => {
        availability[lecturer._id.toString()] =
          lecturer.availableTimeslots?.map((slotId) => slotId._id.toString()) ||
          []; // Ensure string representation
        return availability;
      }, {} as PythonLecturerAvailability),
      holidays: [],
    };
  }

  private async runPythonScript(data: PythonData): Promise<PythonSolution> {
    const pythonPath =
      process.platform === 'win32'
        ? 'venv\\Scripts\\python'
        : 'venv/bin/python';
    const pythonProcess: ChildProcessWithoutNullStreams = spawn(pythonPath, [
      this.pythonScriptPath,
    ]);
    let output = '';

    pythonProcess.stdin.write(JSON.stringify(data));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (chunk: Buffer | string) => {
      output += chunk.toString();
    });

    return new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        this.logger.log(
          `Python script exited with code ${code}, output: ${output}`,
        );
        if (code !== 0) {
          reject(new Error(`Python script exited with code ${code}`));
          return;
        }
        try {
          const parsedOutput = JSON.parse(output) as PythonSolution;
          resolve(parsedOutput);
        } catch (parseError: any) {
          this.logger.error(
            `Failed to parse Python output: ${parseError.message}`,
          );
          reject(new Error('Failed to parse Python script output'));
        }
      });

      pythonProcess.stderr.on('data', (error: Error) => {
        this.logger.error(`Python error: ${error.message}`);
        reject(new Error('Python script error'));
      });
    });
  }

  private validateSolution(solution: PythonSolution): void {
    if (!solution?.schedule) {
      throw new BadRequestException('No feasible timetable solution found');
    }
  }

  private processSolution(
    solution: PythonSolution,
    courses: Course[],
    rooms: Room[],
    timeslots: Timeslot[],
  ): validSchedule[] {
    const validSchedules: validSchedule[] = [];

    // Create Maps for efficient lookups
    const courseMap = new Map(
      courses.map((course) => [course._id.toString(), course]),
    );
    const roomMap = new Map(rooms.map((room) => [room._id.toString(), room]));
    const timeslotMap = new Map(
      timeslots.map((timeslot) => [timeslot._id.toString(), timeslot]), // Use _id.toString()
    );

    for (const assignment of solution.schedule) {
      try {
        const timeslotId = assignment.timeslotId; // This is already a string

        const course = courseMap.get(assignment.courseId);
        const room = roomMap.get(assignment.roomId);
        const timeslot = timeslotMap.get(timeslotId);

        if (!course) {
          this.logger.warn(`Course not found for ID: ${assignment.courseId}`);
          throw new Error(`Course not found for ID: ${assignment.courseId}`);
        }
        if (!room) {
          this.logger.warn(`Room not found for ID: ${assignment.roomId}`);
          throw new Error(`Room not found for ID: ${assignment.roomId}`);
        }
        if (!timeslot) {
          this.logger.warn(`Timeslot not found for ID: ${timeslotId}`);
          throw new Error('Missing reference data for assignment');
        }

        const courseId = Types.ObjectId.createFromHexString(
          assignment.courseId,
        );
        const roomId = Types.ObjectId.createFromHexString(assignment.roomId);

        validSchedules.push({
          courseId: courseId,
          roomId: roomId,
          timeslotId: timeslot._id, // Use the timeslot._id  which is an ObjectId
        });
      } catch (error: any) {
        this.logger.warn(`Failed to process assignment: ${error.message}`);
      }
    }
    return validSchedules;
  }

  private handleError(error: unknown): void {
    if (error instanceof Error) {
      this.logger.error(`Timetable generation failed: ${error.message}`);
      throw new BadRequestException(error.message);
    }
    this.logger.error(`Timetable generation failed: ${error}`);
    throw new BadRequestException('Timetable generation failed');
  }
}
