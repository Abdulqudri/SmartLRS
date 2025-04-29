import { BadRequestException, Injectable } from '@nestjs/common';
import * as csv from 'csv-parser';
import { CoursesService } from 'src/courses/courses.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { TimeslotsService } from 'src/timeslots/timeslots.service';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { Readable } from 'stream';
import { SchedulesService } from 'src/scheduling/scheduling.service';
import { ScheduleGenerationService } from 'src/schedule-generation/schedule-generation.service';
import { Timeslot } from 'src/timeslots/schemas/timeslot.schema';
import { UserRole } from 'src/users/schema/user.schema';
import { Room } from 'src/rooms/schemas/room.schema';
import { Schedule } from 'src/scheduling/schemas/scheduling.schema';
import { Types } from 'mongoose';

// Define types for CSV row structures to ensure type safety
type CourseCsvRow = {
  code?: string;
  name?: string;
  lecturerId?: string;
  numberOfStudents?: string;
  duration?: string;
};

type RoomCsvRow = {
  name?: string;
  capacity?: string;
  availableEquipment?: string;
};

type LecturerAvailabilityCsvRow = {
  day?: string;
  startTime?: string;
  endTime?: string;
  lecturerId?: string;
};

type UserCsvRow = {
  userId?: string;
  name?: string;
  email?: string;
  role?: string;
};

type TimeslotCsvRow = {
  day?: string;
  startTime?: string;
  endTime?: string;
};

@Injectable()
export class AdminService {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly roomsService: RoomsService,
    private readonly timeslotsService: TimeslotsService,
    private readonly usersService: UsersService,
    private readonly schedulesService: SchedulesService,
    private readonly scheduleGenerationService: ScheduleGenerationService,
  ) {}

  /**
   * Process CSV rows in batches.
   * @param file Uploaded CSV file
   * @param batchSize Number of rows to process concurrently
   * @param processRow Async function to process each row
   * @returns Array of error messages collected during processing
   */
  private async processCsvInBatches<T>(
    file: Express.Multer.File,
    batchSize: number,
    processRow: (row: T) => Promise<void>,
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const errors: string[] = [];
      let batch: T[] = [];
      Readable.from(file.buffer)
        .pipe(csv())
        .on('data', (row: T) => {
          batch.push(row);
          if (batch.length >= batchSize) {
            stream.pause();
            Promise.all(
              batch.map((r) =>
                processRow(r).catch((err: any) =>
                  errors.push(
                    `Row ${JSON.stringify(r)}: ${(err as Error)?.message}`,
                  ),
                ),
              ),
            )
              .then(() => {
                batch = [];
                stream.resume();
              })
              .catch((err: any) => {
                errors.push((err as Error)?.message);
                stream.resume();
              });
          }
        })
        .on('end', () => {
          Promise.all(
            batch.map((r) =>
              processRow(r).catch((err: any) =>
                errors.push(
                  `Row ${JSON.stringify(r)}: ${(err as Error)?.message}`,
                ),
              ),
            ),
          )
            .then(() => resolve(errors))
            .catch((err: Error) => reject(err));
        })
        .on('error', (error: any) =>
          reject(new BadRequestException((error as Error)?.message)),
        );

      const stream = Readable.from(file.buffer).pipe(csv()); // Keep this for type inference in the 'data' event
    });
  }

  async uploadCourses(file: Express.Multer.File): Promise<void> {
    if (!file) {
      throw new BadRequestException('File path is missing.');
    }

    const batchSize = 50;
    await this.processCsvInBatches<CourseCsvRow>(
      file,
      batchSize,
      async (row) => {
        if (
          !row.code ||
          !row.name ||
          !row.lecturerId ||
          !row.numberOfStudents ||
          !row.duration
        ) {
          throw new Error('Missing required fields.');
        }
        const numberOfStudents = parseInt(row.numberOfStudents, 10);
        const duration = parseInt(row.duration, 10);
        if (isNaN(numberOfStudents) || isNaN(duration)) {
          throw new Error('Invalid numeric values.');
        }
        if (await this.coursesService.findOneByCode(row.code)) {
          console.warn(`Skipping duplicate course: ${row.code}`);
          return;
        }
        const lecturer = await this.usersService.findOneById(
          new Types.ObjectId(row.lecturerId),
        );
        if (!lecturer || lecturer.role !== UserRole.LECTURER) {
          throw new Error('Invalid lecturer Id');
        }

        await this.coursesService.create({
          code: row.code,
          name: row.name,
          lecturerId: lecturer._id,
          numberOfStudents,
          duration,
        });
      },
    );
  }

  async uploadRooms(file: Express.Multer.File): Promise<void> {
    if (!file) {
      throw new BadRequestException('File path is missing.');
    }

    const batchSize = 50;
    await this.processCsvInBatches<RoomCsvRow>(file, batchSize, async (row) => {
      if (!row.name || !row.capacity) {
        throw new Error('Missing required fields.');
      }
      const capacity = parseInt(row.capacity, 10);
      if (isNaN(capacity)) {
        throw new Error('Invalid numeric value for capacity.');
      }
      if (await this.roomsService.findOneByName(row.name)) {
        console.warn(`Skipping duplicate room: ${row.name}`);
        return;
      }
      const equipments: string[] = (row.availableEquipment || '').split(',');
      const roomData: Pick<Room, 'name' | 'capacity' | 'availableEquipment'> = {
        name: row.name,
        capacity,
        availableEquipment: equipments,
      };
      await this.roomsService.create(roomData);
    });
  }

  async uploadLecturerAvailability(file: Express.Multer.File): Promise<void> {
    if (!file) {
      throw new BadRequestException('File path is missing.');
    }

    const batchSize = 50;
    await this.processCsvInBatches<LecturerAvailabilityCsvRow>(
      file,
      batchSize,
      async (row) => {
        if (!row.day || !row.startTime || !row.endTime || !row.lecturerId) {
          throw new Error('Missing required fields.');
        }

        const timeslot = await this.timeslotsService.findByDayAndTime(
          row.day,
          row.startTime,
        );

        const user = await this.usersService.findOneById(
          new Types.ObjectId(row.lecturerId),
        );
        if (user && user.role === UserRole.LECTURER) {
          const availableTimeslots: string[] =
            user.availableTimeslots?.map((id) => id.toString()) || [];

          // Use a Set to track existing timeslot IDs for efficient duplicate checking
          const existingTimeslotIds = new Set(availableTimeslots);

          // Only add the timeslot if it doesn't already exist
          let timeslotIdString: string;
          if (timeslot) {
            timeslotIdString = timeslot._id.toString();
          } else {
            const createdTimeslot = await this.timeslotsService.create({
              day: row.day,
              startTime: row.startTime,
              endTime: row.endTime,
            });
            timeslotIdString = createdTimeslot._id.toString();
          }
          if (!existingTimeslotIds.has(timeslotIdString)) {
            availableTimeslots.push(timeslotIdString);
            await this.usersService.updateAvailability(
              user._id.toString(),
              availableTimeslots,
            );
          }
        }
      },
    );
  }

  async uploadUser(file: Express.Multer.File): Promise<void> {
    if (!file) {
      throw new BadRequestException('File path is missing.');
    }

    const batchSize = 50;
    await this.processCsvInBatches<UserCsvRow>(file, batchSize, async (row) => {
      if (!row.userId || !row.name || !row.email || !row.role) {
        throw new Error('Missing required fields.');
      }
      if (await this.usersService.findOneById(new Types.ObjectId(row.userId))) {
        console.warn(`Skipping duplicate user: ${row.userId}`);
        return;
      }

      let userRole: UserRole;
      switch ((row.role || '').toLowerCase()) {
        case 'admin':
          userRole = UserRole.ADMIN;
          break;
        case 'lecturer':
          userRole = UserRole.LECTURER;
          break;
        case 'student':
          userRole = UserRole.STUDENT;
          break;
        default:
          throw new Error(`Invalid user role: ${row.role}`);
      }

      const hashedPassword = await bcrypt.hash(row.userId, 10);

      await this.usersService.create({
        name: row.name,
        email: row.email,
        userId: row.userId,
        role: userRole,
        password: hashedPassword,
      });
    });
  }

  async uploadTimeslot(file: Express.Multer.File): Promise<void> {
    if (!file) {
      throw new BadRequestException('File path is missing.');
    }

    const batchSize = 50;
    await this.processCsvInBatches<TimeslotCsvRow>(
      file,
      batchSize,
      async (row) => {
        if (!row.day || !row.startTime || !row.endTime) {
          throw new Error('Missing required fields.');
        }
        const timeslot = await this.timeslotsService.findByDayAndTime(
          row.day,
          row.startTime,
        );
        if (timeslot) {
          console.warn(
            `Skipping duplicate timeslot: ${row.day}-${row.startTime}`,
          );
          return;
        }

        await this.timeslotsService.create({
          day: row.day,
          startTime: row.startTime,
          endTime: row.endTime,
        });
      },
    );
  }

  async getAllTimeslot(): Promise<Timeslot[]> {
    return await this.timeslotsService.findAll();
  }

  async getAllTimetable(): Promise<Schedule[]> {
    // Consider creating a specific type for the timetable
    return await this.schedulesService.findAll();
  }

  async generateTimetable(): Promise<void> {
    await this.scheduleGenerationService.generateTimetable();
  }

  async deleteSchedule(): Promise<any> {
    // Consider creating a specific type for the delete response
    return await this.schedulesService.deleteAll();
  }
}
