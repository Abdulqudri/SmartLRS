import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/users/schema/user.schema';

export type CourseDocument = Course & Document;

@Schema()
export class Course {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  code: string; // e.g., "CS101"

  @Prop({ required: true })
  name: string; // e.g., "Introduction to Programming"

  @Prop({ required: true, type: Types.ObjectId, ref: User.name }) // Reference to User _id
  lecturerId: User;

  @Prop({ required: true, default: 0 })
  numberOfStudents: number;

  @Prop({ required: true })
  duration: number; // Duration in hours (e.g., 2)
}

export const CourseSchema = SchemaFactory.createForClass(Course);
