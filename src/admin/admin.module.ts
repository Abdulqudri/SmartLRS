import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { CoursesModule } from '../courses/courses.module';
import { RoomsModule } from '../rooms/rooms.module';
import { TimeslotsModule } from '../timeslots/timeslots.module';
import { UsersModule } from '../users/users.module';
import { ScheduleGenerationModule } from 'src/schedule-generation/schedule-generation.module';
import { SchedulingModule } from 'src/scheduling/scheduling.module';

@Module({
  imports: [
    CoursesModule,
    RoomsModule,
    TimeslotsModule,
    UsersModule,
    ScheduleGenerationModule,
    SchedulingModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
