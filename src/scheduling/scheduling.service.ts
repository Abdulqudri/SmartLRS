import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schedule } from './schemas/scheduling.schema'

@Injectable()
export class SchedulesService {
  constructor(@InjectModel(Schedule.name) private scheduleModel: Model<Schedule>) {}

  async create(scheduleData: Partial<Schedule>): Promise<Schedule> {
    const schedule = new this.scheduleModel(scheduleData);
    return schedule.save();
  }

  async createMany(schedules: Partial<Schedule>[]): Promise<Schedule[]> {
    const manySchedule = await this.scheduleModel.insertMany(schedules);
    return manySchedule as Schedule[];
  }

  async deleteAll(): Promise<void> {
    await this.scheduleModel.deleteMany({}).exec();
  }

  async findAll(): Promise<Schedule[]> {
    return this.scheduleModel.find().exec();
  }
}