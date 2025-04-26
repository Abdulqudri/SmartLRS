import { Module } from '@nestjs/common';
import { LecturerService } from './lecturer.service';
import { LecturerController } from './lecturer.controller';
import { TimeslotsModule } from 'src/timeslots/timeslots.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TimeslotsModule, UsersModule],
  controllers: [LecturerController],
  providers: [LecturerService],
})
export class LecturerModule {}
