import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export class CreateEnrollmentDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: Types.ObjectId;
  @IsString()
  @IsNotEmpty()
  courses: string[];
}
