import { PartialType } from "@nestjs/mapped-types";
import { CreateTimeslotDto } from "./creaate-timeslot.dto";

export class UpdateTimeslotDto extends PartialType(CreateTimeslotDto){}