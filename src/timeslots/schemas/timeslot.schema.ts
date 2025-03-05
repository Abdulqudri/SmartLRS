import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


@Schema()
export class Timeslot extends Document {

  _id: Types.ObjectId;

  @Prop({ required: true })
  day: string; // e.g., "Monday"

  @Prop({ required: true })
  startTime: string; // e.g., "08:00"

  @Prop({ required: true })
  endTime: string; // e.g., "10:00"
}

export const TimeslotSchema = SchemaFactory.createForClass(Timeslot);