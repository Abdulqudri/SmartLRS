import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dtos/create-enrollment.dto';
import { Roles } from 'src/auth/roles.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('student')
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @Post('enroll')
  async enroll(@Body() enrollmentDto: CreateEnrollmentDto) {
    const enrollment =
      await this.enrollmentsService.createEnrollment(enrollmentDto);
    return { message: 'Enrollment successful', enrollment };
  }
}
