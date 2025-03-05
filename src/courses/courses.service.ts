import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course } from './schema/course.schema';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(@InjectModel(Course.name) private courseModel: Model<Course>) {}

  async create(course: CreateCourseDto) : Promise<Course> {
    const newCourse = new this.courseModel(course);
    return await newCourse.save()
  }

  async findOneByCode(code: string): Promise<Course | null> {
    const course = await this.courseModel.findOne({code})
    return course;
  }
  async findAll() {
    return await this.courseModel.find().exec();
  }
}