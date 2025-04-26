import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Timeslot extends Document {
  _id: Types.ObjectId;

  @Prop({ required: true })
  day: string;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;
}

export const TimeslotSchema = SchemaFactory.createForClass(Timeslot);
