import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Course } from 'src/courses/schema/course.schema';
import { User } from 'src/users/schema/user.schema';

@Schema()
export class Enrollment extends Document {
  _id: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: User.name })
  userId: User;

  @Prop({ required: true, type: [Types.ObjectId], ref: Course.name })
  courses: Course[];
}

export const EnrollmentSchema = SchemaFactory.createForClass(Enrollment);
