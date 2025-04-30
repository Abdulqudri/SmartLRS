import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Enrollment, EnrollmentSchema } from './schemas/enrollment.schema';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { UsersModule } from 'src/users/users.module';
import { CoursesModule } from 'src/courses/courses.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Enrollment.name,
        schema: EnrollmentSchema,
      },
    ]),
    UsersModule,
    CoursesModule,
  ],
  providers: [EnrollmentsService],
  controllers: [EnrollmentsController],
})
export class EnrollmentsModule {}
