import { ArrayNotEmpty, IsArray } from 'class-validator';

export class CreateEnrollmentDto {
  @IsArray()
  @ArrayNotEmpty()
  courses: string[];
}
