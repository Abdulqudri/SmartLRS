import { Module } from '@nestjs/common';
import { SchedulesService } from './scheduling.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Scheduling, ScheduleSchema } from './schemas/scheduling.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Scheduling.name,
        schema: ScheduleSchema,
      },
    ]),
  ],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulingModule {}
