import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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
    type: [String],
    default: undefined,
    validate: {
      validator: function (timeslotIds: string[]) {
        return timeslotIds.every(
          (id) =>
            typeof id === 'string' &&
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
              id,
            ),
        );
      },
      message: 'Invalid UUID format for timeslot ID',
    },
  })
  availableTimeslots?: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
