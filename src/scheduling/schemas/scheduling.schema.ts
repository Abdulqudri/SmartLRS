import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Course } from 'src/courses/schema/course.schema';
import { Room } from 'src/rooms/schemas/room.schema';
import { Timeslot } from 'src/timeslots/schemas/timeslot.schema';

@Schema()
export class Scheduling extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: Course.name })
  courseId: Course;

  @Prop({ required: true, type: Types.ObjectId, ref: Room.name })
  roomId: Room;

  @Prop({ required: true, type: Types.ObjectId, ref: Timeslot.name })
  timeslotId: Timeslot;
}

export const ScheduleSchema = SchemaFactory.createForClass(Scheduling);
