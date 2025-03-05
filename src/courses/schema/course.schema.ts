import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseDocument = Course & Document;

@Schema()
export class Course {
  @Prop({ required: true, unique: true })
  code: string; // e.g., "CS101"

  @Prop({ required: true })
  name: string; // e.g., "Introduction to Programming"

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' }) // Reference to User _id
  lecturerId: Types.ObjectId;

  @Prop({ required: true })
  numberOfStudents: number;

  @Prop({ required: true })
  duration: number; // Duration in hours (e.g., 2)
}

export const CourseSchema = SchemaFactory.createForClass(Course);