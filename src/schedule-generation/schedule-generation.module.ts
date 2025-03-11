import { Module } from '@nestjs/common';
import { ScheduleGenerationService } from './schedule-generation.service';
import { CoursesModule } from '../courses/courses.module';
import { RoomsModule } from '../rooms/rooms.module';
import { TimeslotsModule } from '../timeslots/timeslots.module';
import { UsersModule } from '../users/users.module';
import { SchedulingModule } from '../scheduling/scheduling.module';

@Module({
  imports: [CoursesModule, RoomsModule, TimeslotsModule, UsersModule, SchedulingModule],
  providers: [ScheduleGenerationService],
  exports: [ScheduleGenerationService],
})
export class ScheduleGenerationModule {}