import { IsNotEmpty } from 'class-validator';

export class CreateEnrollmentDto {
  @IsNotEmpty()
  courses: string[];
}
