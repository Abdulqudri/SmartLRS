import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dtos/create-enrollment.dto';
import { Roles } from 'src/auth/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from 'src/users/schema/user.schema';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('student')
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Post('enroll')
  async enroll(
    @Body() enrollmentDto: CreateEnrollmentDto,
    @CurrentUser() user: User,
  ) {
    const enrollment = await this.enrollmentsService.createEnrollment(
      user,
      enrollmentDto,
    );
    return { message: 'Enrollment successful', enrollment };
  }
  @Get('')
  async enrolled(@CurrentUser() user: User) {
    const courses = await this.enrollmentsService.getEnrolledCourses(user);
    return courses;
  }
}
