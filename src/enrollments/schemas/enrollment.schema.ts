import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Enrollment extends Document {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: [Types.ObjectId], ref: 'Course' })
  courses: Types.ObjectId[];
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
