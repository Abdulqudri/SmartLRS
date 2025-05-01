import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Course } from 'src/courses/schema/course.schema';
import { User } from 'src/users/schema/user.schema';

@Schema()
export class Enrollment extends Document {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, index: true, ref: User.name })
  userId: User;

  @Prop({ required: true, type: Types.ObjectId, index: true, ref: Course.name })
  course: Course;
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
EnrollmentSchema.index({ userId: 1, courses: 1 }, { unique: true });
