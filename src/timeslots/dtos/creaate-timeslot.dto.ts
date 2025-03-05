import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateTimeslotDto {
  @IsNotEmpty()
  @IsString()
  day: string; // Example: "Monday"

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'startTime must be in HH:mm format (e.g., "08:00")',
  })
  startTime: string; // Example: "08:00"

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'endTime must be in HH:mm format (e.g., "10:00")',
  })
  endTime: string; // Example: "10:00"
}
