import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateTimeslotDto } from 'src/timeslots/dtos/create-timeslot.dto';
import { TimeslotsService } from 'src/timeslots/timeslots.service';
import { UserRole } from 'src/users/schema/user.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class LecturerService {
  constructor(
    private timeslotService: TimeslotsService,
    private userService: UsersService,
  ) {}
  async inputAvailability(userId: Types.ObjectId, data: CreateTimeslotDto) {
    let timeslot = await this.timeslotService.findByDayAndTime(
      data.day,
      data.startTime,
    );

    if (!timeslot) {
      timeslot = await this.timeslotService.create(data);
    }
    const user = await this.userService.findOneById(userId);
    if (!user || (user && user.role !== UserRole.LECTURER)) {
      throw new UnauthorizedException('User not Authorized');
    }
    await this.userService.inputAvailability(
      userId.toString(),
      timeslot._id.toString(),
    );
  }
  async removeAvailability(
    userId: Types.ObjectId,
    data: { day: string; startTime: string },
  ) {
    const timeslot = await this.timeslotService.findByDayAndTime(
      data.day,
      data.startTime,
    );

    if (!timeslot) {
      throw new BadRequestException('Timeslot not found');
    }
    const user = await this.userService.findOneById(userId);
    if (!user || (user && user.role !== UserRole.LECTURER)) {
      throw new UnauthorizedException('User not Authorized');
    }
    const updatedUserAvailability: Types.ObjectId[] =
      user.availableTimeslots
        ?.filter((id) => id._id !== timeslot._id) // Filter out unwanted ID
        .map((id) => id._id) || [];
    console.log(updatedUserAvailability);
    await this.userService.updateAvailability(userId, updatedUserAvailability);
  }
  async getAllAvailability(userId: Types.ObjectId) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }
    const user = await this.userService.findOneById(userId);
    if (!user || (user && user.role !== UserRole.LECTURER)) {
      throw new UnauthorizedException('User not authorized');
    }
    return await this.userService.getAllAvailability(user._id.toString());
  }
}
