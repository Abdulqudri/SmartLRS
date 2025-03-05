import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateCourseDto {
  @IsNotEmpty()
  @IsString()
  code: string; // e.g., "CS101"

  @IsNotEmpty()
  @IsString()
  name: string; // e.g., "Introduction to Programming"

  @IsNotEmpty()
  @IsMongoId({ message: 'Lecturer ID must be a valid MongoDB ObjectId' }) // Ensures valid ObjectId
  lecturerId: string; // References User _id

  @IsNotEmpty()
  numberOfStudents: number;

  @IsNotEmpty()
  duration: number; // Duration in hours
}
