import { Module } from '@nestjs/common';
import { TimeslotsService } from './timeslots.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Timeslot, TimeslotSchema } from './schemas/timeslot.schema';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: Timeslot.name,
      schema: TimeslotSchema
    }
  ])],
  providers: [TimeslotsService],
  exports: [TimeslotsService]
})
export class TimeslotsModule {}
