import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schedule, ScheduleDocument } from './schemas/scheduling.schema';


@Injectable()
export class SchedulingService {
  constructor(@InjectModel(Schedule.name) private scheduleModel: Model<ScheduleDocument>) {}

  async create(scheduleData: Partial<Schedule>): Promise<Schedule> {
    const schedule = new this.scheduleModel(scheduleData);
    return schedule.save();
  }

  async deleteAll(): Promise<void> {
    await this.scheduleModel.deleteMany({}).exec();
  }
}