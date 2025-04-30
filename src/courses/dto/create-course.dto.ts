import {
  IsString,
  IsNotEmpty,
  IsMongoId,
  IsNumber,
  Min,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateCourseDto {
  @IsNotEmpty()
  @IsString()
  code: string; // e.g., "CS101"

  @IsNotEmpty()
  @IsString()
  name: string; // e.g., "Introduction to Programming"

  @IsNotEmpty()
  @IsMongoId({ message: 'Lecturer ID must be a valid MongoDB ObjectId' }) // Ensures valid ObjectId
  lecturerId: Types.ObjectId; // References User _id

  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Duration must be at least 1 hour' })
  duration: number; // Duration in hours
}
