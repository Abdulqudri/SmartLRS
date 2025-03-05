import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  LECTURER = 'lecturer',
  STUDENT = 'student',
}

@Schema()
export class User extends Document {

  @Prop({required: false, unique: true})
  userId: string

  @Prop({required: true})
  name: string

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Timeslot' }],
    default: undefined, // Ensures it's omitted when not provided
  })
  availableTimeslots?: Types.ObjectId[];
  
}

export const UserSchema = SchemaFactory.createForClass(User);