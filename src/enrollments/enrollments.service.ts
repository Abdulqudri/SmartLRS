import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Enrollment } from './schemas/enrollment.schema';
import { CreateEnrollmentDto } from './dtos/create-enrollment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserRole } from 'src/users/schema/user.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class EnrollmentService {
  constructor(
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    private readonly userService: UsersService,
  ) {}
  async createStudentEnrollment(
    data: CreateEnrollmentDto,
  ): Promise<Enrollment> {
    try {
      const currentUser = await this.userService.findOneById(data.userId);
      if (!currentUser || currentUser.role !== UserRole.STUDENT)
        throw new UnauthorizedException('Unauthorized Access');
      const newEnrollment = new this.enrollmentModel({
        userId: currentUser.userId,
        courses: data.courses,
      });
      return await newEnrollment.save();
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
  async createLecturerEnrollment(
    data: CreateEnrollmentDto,
    userId: Types.ObjectId,
  ): Promise<Enrollment> {
    try {
      const currentUser = await this.userService.findOneById(userId);
      if (!currentUser || currentUser.role !== UserRole.LECTURER)
        throw new UnauthorizedException('unauthorized access');
      const newEnrollment = new this.enrollmentModel({
        userId: currentUser.userId,
        courses: data.courses,
      });
      return await newEnrollment.save();
    } catch (error) {
      throw new BadRequestException(error);
    }
  }
}
