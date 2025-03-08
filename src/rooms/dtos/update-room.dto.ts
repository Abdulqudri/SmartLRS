import { PartialType } from "@nestjs/mapped-types";
import { CreateCourseDto } from "src/courses/dto/create-course.dto";

export class UpdateRoomDto extends PartialType(CreateCourseDto){}