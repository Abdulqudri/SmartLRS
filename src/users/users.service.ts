import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dtos/createUser.dto';
import { TimeslotsService } from 'src/timeslots/timeslots.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private timeslotsService: TimeslotsService,
  ) {}

  async create(user: CreateUserDto) {
    const createdUser = new this.userModel(user);
    return await createdUser.save();
  }
  async findOneById(id: Types.ObjectId): Promise<User | null> {
    return await this.userModel.findById(id);
  }
  async findOneByEmail(email: string): Promise<User | null> {
    return await this.userModel.findOne({ email }).exec();
  }
  // users.service.ts
  async updateAvailability(
    userId: string,
    timeslotIds: string[], // These are UUID strings from TimeslotResponse
  ): Promise<User> {
    // Validate user ID format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    // Validate timeslots exist (new check)
    const validTimeslots =
      await this.timeslotsService.validateTimeslotIds(timeslotIds);
    console.log(validTimeslots);
    if (validTimeslots.length !== timeslotIds.length) {
      throw new BadRequestException('One or more timeslot IDs are invalid');
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { availableTimeslots: timeslotIds } },
        { new: true },
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async inputAvailability(userId: string, timeslotId: string): Promise<User> {
    // Validate userId format
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    // Validate timeslotId is valid ObjectId
    if (!Types.ObjectId.isValid(timeslotId)) {
      throw new BadRequestException('Invalid timeslot ID format');
    }

    // Update the user's availableTimeslots
    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $addToSet: { availableTimeslots: timeslotId } },
        { new: true },
      )
      .exec();

    // Handle case where user is not found
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async getAllAvailability(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel
      .findById(userId, { role: 'lecturer' })
      .populate('availableTimeslots')
      .exec();
    const availableTimeslots = user?.availableTimeslots;

    return availableTimeslots;
  }

  async findAll() {
    return await this.userModel.find().exec();
  }
  async findAllLecturers(): Promise<User[]> {
    return await this.userModel.find({ role: 'lecturer' });
  }
}
