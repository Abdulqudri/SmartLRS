import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Timeslot } from './schemas/timeslot.schema';
import { Model } from 'mongoose';
import { CreateTimeslotDto } from './dtos/creaate-timeslot.dto';

@Injectable()
export class TimeslotsService {
    constructor(
        @InjectModel(Timeslot.name)
        private timeslotModel: Model<Timeslot>
    ){}

    async findAll() {
        return await this.timeslotModel.find().exec();
    }

    async create(timeslot: CreateTimeslotDto) : Promise<Timeslot> {
        const newTimeslot = new this.timeslotModel(timeslot)
        return await newTimeslot.save()
    }

    async findByDayAndTime(day: string, startTime: string): Promise<Timeslot | null> {
        return this.timeslotModel.findOne({ day, startTime }).exec();
      }
}
