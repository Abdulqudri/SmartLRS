import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Course, CourseSchema } from './schema/course.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
          MongooseModule.forFeature([
              {
                  name: Course.name,
                  schema: CourseSchema
              }
          ])
      ],
  providers: [CoursesService],
  exports: [CoursesService]
})
export class CoursesModule {}
