import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Timeslot } from './schemas/timeslot.schema';
import { Model, Types } from 'mongoose';
import { CreateTimeslotDto } from './dtos/create-timeslot.dto';

@Injectable()
export class TimeslotsService {
  constructor(
    @InjectModel(Timeslot.name)
    private timeslotModel: Model<Timeslot>,
  ) {}

  async findAll(): Promise<Timeslot[]> {
    const timeslots = await this.timeslotModel.find().lean().exec();

    const dayOrder: { [key: string]: number } = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    return timeslots
      .map((timeslot) => ({
        ...timeslot,
        id: timeslot._id.toString(),
      }))
      .sort((a, b) => {
        const dayAValue = dayOrder[a.day] ?? 0;
        const dayBValue = dayOrder[b.day] ?? 0;
        return dayAValue - dayBValue || a.startTime.localeCompare(b.startTime);
      });
  }

  async validateTimeslotIds(ids: Types.ObjectId[]): Promise<boolean[]> {
    const objectIds = ids.filter((id) => id !== null); //remove null

    const existingTimeslots = await this.timeslotModel
      .find({
        _id: { $in: objectIds },
      })
      .lean()
      .exec();

    const existingIds = new Set(existingTimeslots.map((t) => t._id));
    return ids.map((id) => existingIds.has(id));
  }

  async create(timeslot: CreateTimeslotDto): Promise<Timeslot> {
    const newTimeslot = new this.timeslotModel(timeslot);
    const saved = await newTimeslot.save();
    return saved;
  }

  async findByDayAndTime(
    day: string,
    startTime: string,
  ): Promise<Timeslot | null> {
    const timeslot = await this.timeslotModel
      .findOne({
        day: day.toLowerCase(),
        startTime,
      })
      .lean()
      .exec();

    if (!timeslot) {
      return null;
    }

    return timeslot;
  }

  async findByUuid(id: string): Promise<Timeslot | null> {
    const result = await this.timeslotModel.findById(id).lean().exec(); // Use id
    if (!result) {
      return null;
    }
    return result;
  }
}
