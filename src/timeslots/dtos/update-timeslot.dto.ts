import { PartialType } from '@nestjs/mapped-types';
import { CreateTimeslotDto } from './create-timeslot.dto';

export class UpdateTimeslotDto extends PartialType(CreateTimeslotDto) {}
