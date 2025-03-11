import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { CoursesModule } from '../courses/courses.module';
import { RoomsModule } from '../rooms/rooms.module';
import { TimeslotsModule } from '../timeslots/timeslots.module';
import { UsersModule } from '../users/users.module';
import { ScheduleGenerationModule } from 'src/schedule-generation/schedule-generation.module';

@Module({
  imports: [CoursesModule, RoomsModule, TimeslotsModule, UsersModule,ScheduleGenerationModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}