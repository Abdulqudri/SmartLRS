import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Course } from './schema/course.schema';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(@InjectModel(Course.name) private courseModel: Model<Course>) {}

  async create(course: CreateCourseDto): Promise<Course> {
    const newCourse = new this.courseModel(course);
    return await newCourse.save();
  }
  async findOneById(id: Types.ObjectId): Promise<Course | null> {
    const course = await this.courseModel.findById(id);
    return course;
  }

  async findOneByCode(code: string): Promise<Course | null> {
    const course = await this.courseModel.findOne({ code });
    return course;
  }

  async findByCodesOrNames(identifiers: string[]): Promise<Course[]> {
    return this.courseModel
      .find({
        $or: [{ code: { $in: identifiers } }, { name: { $in: identifiers } }],
      })
      .exec();
  }
  async findAll(): Promise<Course[]> {
    return await this.courseModel.find().exec();
  }
  async incrementStudentCounts(
    courseIds: Types.ObjectId[],
    delta: number,
  ): Promise<void> {
    await this.courseModel
      .updateMany(
        { _id: { $in: courseIds } },
        { $inc: { numberOfStudents: delta } },
      )
      .exec();
  }
}
