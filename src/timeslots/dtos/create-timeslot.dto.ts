// dtos/create-timeslot.dto.ts
import { IsString, IsIn, Matches } from 'class-validator';

export class CreateTimeslotDto {
  @IsString()
  @IsIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'])
  day: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/) // HH:MM format
  startTime: string;

  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
  endTime: string;
}
