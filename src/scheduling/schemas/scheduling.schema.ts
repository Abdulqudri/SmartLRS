import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Course } from 'src/courses/schema/course.schema';
import { Room } from 'src/rooms/schemas/room.schema';
import { Timeslot } from 'src/timeslots/schemas/timeslot.schema';

export type ScheduleDocument = Schedule & Document;

@Schema()
export class Schedule {
  @Prop({ type: Types.ObjectId, ref: Course.name, required: true })
  courseId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Room.name, required: true })
  roomId: Types.ObjectId;

  @Prop({ type: String, ref: Timeslot.name, required: true })
  timeslotId: Types.ObjectId;
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
