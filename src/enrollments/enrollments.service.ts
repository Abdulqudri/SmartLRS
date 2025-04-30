import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Enrollment } from './schemas/enrollment.schema';
import { CreateEnrollmentDto } from './dtos/create-enrollment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserRole } from 'src/users/schema/user.schema';
import { UsersService } from 'src/users/users.service';
import { CoursesService } from 'src/courses/courses.service';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name) private enrollmentModel: Model<Enrollment>,
    private readonly userService: UsersService,
    private readonly courseService: CoursesService,
  ) {}

  private async validateCourseIdentifiers(
    identifiers: string[],
  ): Promise<Types.ObjectId[]> {
    if (!identifiers.length) {
      throw new BadRequestException('No course identifiers provided');
    }

    // Batch fetch: any course whose code or name is in identifiers
    const courses = await this.courseService.findByCodesOrNames(identifiers);
    console.log('Courses found:', courses);

    // Map found codes/names for quick lookup
    const foundSet = new Set<string>();
    courses.forEach((c) => {
      foundSet.add(c.code);
      foundSet.add(c.name);
    });

    // Identify missing identifiers
    const missing = identifiers.filter((id) => !foundSet.has(id));
    if (missing.length) {
      throw new BadRequestException(
        `Courses not found for identifiers: ${missing.join(', ')}`,
      );
    }
    // Return array of ObjectIds
    return courses.map((c) => c._id);
  }

  async createEnrollment(
    currentUser: User,
    data: CreateEnrollmentDto,
  ): Promise<Enrollment> {
    try {
      if (!currentUser || currentUser.role !== UserRole.STUDENT) {
        throw new UnauthorizedException('Unauthorized Access');
      }

      const courseIds = await this.validateCourseIdentifiers(data.courses);
      console.log(courseIds);
      console.log('userId', currentUser);

      const newEnrollment = new this.enrollmentModel({
        userId: currentUser.userId,
        courses: courseIds,
      });
      console.log(newEnrollment);
      const savedEnrollment = await newEnrollment.save();
      console.log(savedEnrollment);
      // Increment numberOfStudents on each course
      await this.courseService.incrementStudentCounts(courseIds, 1);
      return savedEnrollment;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new BadRequestException(error);
    }
  }
  async getEnrolledCourses(user: User) {
    if (!user || user.role !== UserRole.STUDENT) {
      throw new UnauthorizedException('Unauthorized Access');
    }
    console.log(user);
    const courses = await this.enrollmentModel
      .find({ userId: user.userId })
      .populate('courses');

    return courses;
  }
}
