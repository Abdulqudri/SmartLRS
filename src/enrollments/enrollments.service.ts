// enrollments.service.ts
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
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

    const courses = await this.courseService.findByCodesOrNames(identifiers);
    const foundSet = new Set<string>();
    courses.forEach((c) => {
      foundSet.add(c.code);
      foundSet.add(c.name);
    });

    const missing = identifiers.filter((id) => !foundSet.has(id));
    if (missing.length) {
      throw new BadRequestException(
        `Courses not found for identifiers: ${missing.join(', ')}`,
      );
    }

    return courses.map((c) => c._id);
  }

  /**
   * Enroll a student in multiple courses.
   * Returns a success message or throws appropriate HTTP exceptions.
   */
  async createEnrollment(
    currentUser: User,
    data: CreateEnrollmentDto,
  ): Promise<{ message: string }> {
    if (!currentUser || currentUser.role !== UserRole.STUDENT) {
      throw new UnauthorizedException('Only students can enroll in courses');
    }

    try {
      const courseIds = await this.validateCourseIdentifiers(data.courses);
      const pivots = courseIds.map((course) => ({
        userId: currentUser.userId,
        course,
      }));
      await this.enrollmentModel
        .insertMany(pivots, { ordered: false })
        .catch((err) => {
          // ignore duplicate key errors
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (err.code !== 11000) throw err;
        });
      await this.courseService.incrementStudentCounts(courseIds, 1);
      return { message: 'Enrollment successful' };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process enrollment');
    }
  }

  /**
   * Retrieve all courses a student is enrolled in.
   */
  async getEnrolledCourses(
    currentUser: User,
  ): Promise<{ message: string; courses: any[] }> {
    if (!currentUser || currentUser.role !== UserRole.STUDENT) {
      throw new UnauthorizedException('Only students can view enrollments');
    }

    try {
      const enrollments = await this.enrollmentModel
        .find({ userId: currentUser.userId })
        .populate('course')
        .exec();
      const courses = enrollments.map((e) => e.course);
      return { message: 'Enrolled courses retrieved', courses };
    } catch {
      throw new InternalServerErrorException(
        'Failed to retrieve enrolled courses',
      );
    }
  }

  /**
   * Remove a student's enrollment from specified courses.
   */
  async removeEnrollment(
    data: CreateEnrollmentDto,
    currentUser: User,
  ): Promise<{ message: string }> {
    if (!currentUser || currentUser.role !== UserRole.STUDENT) {
      throw new UnauthorizedException('Only students can unenroll');
    }

    try {
      const courseIds = await this.validateCourseIdentifiers(data.courses);
      const result = await this.enrollmentModel.deleteMany({
        userId: currentUser.userId,
        course: { $in: courseIds },
      });
      if (result.deletedCount === 0) {
        throw new BadRequestException('No matching enrollments to remove');
      }
      await this.courseService.incrementStudentCounts(courseIds, -1);
      return { message: 'Unenrollment successful' };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove enrollment');
    }
  }
}
