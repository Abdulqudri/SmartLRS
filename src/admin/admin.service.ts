import { BadRequestException, Injectable } from '@nestjs/common';
import * as csv from 'csv-parser';
import { unlink } from 'fs';
import { promisify } from 'util';
import { CoursesService } from 'src/courses/courses.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { TimeslotsService } from 'src/timeslots/timeslots.service';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { Readable } from 'stream';


const unlinkAsync = promisify(unlink);

@Injectable()
export class AdminService {
  constructor(
    private coursesService: CoursesService,
    private roomsService: RoomsService,
    private timeslotsService: TimeslotsService,
    private usersService: UsersService,
  ) {}

  /**
   * Deletes the file after processing.
   */
  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await unlinkAsync(filePath);
    } catch (error) {
      console.warn(`Failed to delete file ${filePath}: ${error.message}`);
    }
  }

  /**
   * Process CSV rows in batches.
   * @param file Uploaded CSV file
   * @param batchSize Number of rows to process concurrently
   * @param processRow Async function to process each row
   * @returns Array of error messages collected during processing
   */
  private async processCsvInBatches(
    file: Express.Multer.File,
    batchSize: number,
    processRow: (row: any) => Promise<void>,
  ): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const errors: string[] = [];
      let batch: any[] = [];
      const stream = Readable.from(file.buffer).pipe(csv());
      console.log('from process funtion file.buffer', file.buffer)


      stream.on('data', (row) => {
        console.log(row);
        
        batch.push(row);
        if (batch.length >= batchSize) {
          stream.pause();
          Promise.all(
            batch.map((row) =>
              processRow(row).catch((err) =>
                errors.push(`Row ${JSON.stringify(row)}: ${err.message}`),
              ),
            ),
          )
            .then(() => {
              batch = [];
              stream.resume();
            })
            .catch((err) => {
              errors.push(err.message);
              stream.resume();
            });
        }
      });

      stream.on('end', () => {
        // Process any remaining rows
        Promise.all(
          batch.map((row) =>
            processRow(row).catch((err) =>
              errors.push(`Row ${JSON.stringify(row)}: ${err.message}`),
            ),
          ),
        )
          .then(() => resolve(errors))
          .catch((err) => reject(err));
      });

      stream.on('error', (error) =>
        reject(new BadRequestException(error.message)),
      );
    });
  }
  async uploadCourses(file: Express.Multer.File): Promise<void> {
    console.log('Uploaded file:', file);
if (!file || !file.path) {
  throw new BadRequestException('File path is missing.');
}

    const batchSize = 50;
    const errors = await this.processCsvInBatches(
      file,
      batchSize,
      async (row: any) => {
        // Validate required fields
        if (!row.code || !row.name || !row.lecturerId || !row.numberOfStudents || !row.duration) {
          throw new Error('Missing required fields.');
        }
        const numberOfStudents = parseInt(row.numberOfStudents, 10);
        const duration = parseInt(row.duration, 10);
        if (isNaN(numberOfStudents) || isNaN(duration)) {
          throw new Error('Invalid numeric values.');
        }
        // Check duplicate course
        if (await this.coursesService.findOneByCode(row.code)) {
          console.warn(`Skipping duplicate course: ${row.code}`);
          return;
        }
        await this.coursesService.create({
          code: row.code,
          name: row.name,
          lecturerId: row.lecturerId,
          numberOfStudents,
          duration,
        });
      },
    );
    await this.cleanupFile(file.path);
    if (errors.length) {
      throw new BadRequestException(errors.join('; '));
    }
  }

  async uploadRooms(file: Express.Multer.File): Promise<void> {
    console.log('Uploaded file:', file);
if (!file) {
  throw new BadRequestException('File path is missing.');
}

    const batchSize = 50;
    const errors = await this.processCsvInBatches(
      file,
      batchSize,
      async (row: any) => {
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
        await this.roomsService.create({
          name: row.name,
          capacity,
          availableEquipment: row.availableEquipment,
        });
      },
    );
    await this.cleanupFile(file.path);
    if (errors.length) {
      throw new BadRequestException(errors.join('; '));
    }
  }

  async uploadLecturerAvailability(file: Express.Multer.File): Promise<void> {
    console.log('Uploaded file:', file);
if (!file || !file.path) {
  throw new BadRequestException('File path is missing.');
}

    const batchSize = 50;
    const errors = await this.processCsvInBatches(
      file,
      batchSize,
      async (row: any) => {
        if (!row.day || !row.startTime || !row.endTime || !row.lecturerId) {
          throw new Error('Missing required fields.');
        }
        let timeslot = await this.timeslotsService.findByDayAndTime(row.day, row.startTime);
        if (!timeslot) {
          timeslot = await this.timeslotsService.create({
            day: row.day,
            startTime: row.startTime,
            endTime: row.endTime,
          });
        }
        const user = await this.usersService.findOneByUserId(row.lecturerId);
        if (user) {
          const updatedTimeslots = new Set(
            (user.availableTimeslots || []).map((id: any) => id.toString()),
          );
          updatedTimeslots.add(timeslot._id.toString());
          await this.usersService.updateAvailability(row.lecturerId, Array.from(updatedTimeslots));
        }
      },
    );
    await this.cleanupFile(file.path);
    if (errors.length) {
      throw new BadRequestException(errors.join('; '));
    }
  }

  async uploadUser(file: Express.Multer.File): Promise<void> {
    console.log('Uploaded file:', file);
if (!file) {
  throw new BadRequestException('File path is missing.');
}

    const batchSize = 50;
    const errors = await this.processCsvInBatches(
      file,
      batchSize,
      async (row: any) => {
        if (!row.userId || !row.name || !row.email || !row.role) {
          throw new Error('Missing required fields.');
        }
        if (await this.usersService.findOneByUserId(row.userId)) {
          console.warn(`Skipping duplicate user: ${row.userId}`);
          return;
        }
        const hashedPassword = await bcrypt.hash(row.userId, 10);
        await this.usersService.create({
          name: row.name,
          email: row.email,
          userId: row.userId,
          role: row.role,
          password: hashedPassword,
        });
      },
    );
    await this.cleanupFile(file.path);
    if (errors.length) {
      throw new BadRequestException(errors.join('; '));
    }
  }
}
