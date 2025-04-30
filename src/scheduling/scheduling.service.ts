import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Scheduling } from './schemas/scheduling.schema';
import { validSchedule } from 'src/schedule-generation/schedule-generation.service';

@Injectable()
export class SchedulesService {
  constructor(
    @InjectModel(Scheduling.name) private scheduleModel: Model<Scheduling>,
  ) {}

  async create(scheduleData: Partial<Scheduling>): Promise<Scheduling> {
    const schedule = new this.scheduleModel(scheduleData);
    return schedule.save();
  }

  async createMany(schedules: validSchedule[]): Promise<Scheduling[]> {
    const manySchedule = await this.scheduleModel.insertMany({ schedules });
    return manySchedule;
  }

  async deleteAll(): Promise<void> {
    await this.scheduleModel.deleteMany().exec();
  }

  async findAll(): Promise<Scheduling[]> {
    return this.scheduleModel
      .find()
      .populate('courseId roomId timeslotId')
      .exec();
  }
}
