import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Timeslot } from 'src/timeslots/schemas/timeslot.schema';

export enum UserRole {
  ADMIN = 'admin',
  LECTURER = 'lecturer',
  STUDENT = 'student',
}

@Schema()
export class User extends Document {
  _id: Types.ObjectId;

  @Prop({ required: false, unique: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Prop({
    type: [Types.ObjectId],
    ref: Timeslot.name,
    default: undefined,
    message: 'Invalid ID format for timeslot ID',
  })
  availableTimeslots?: Timeslot[];
}

export const UserSchema = SchemaFactory.createForClass(User);
