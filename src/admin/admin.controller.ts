import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException, UseFilters } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { FileSizeExceptionFilter } from './file-size.exception';


export const multerConfig: MulterOptions = {
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB file limit
};


@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('upload-courses')
  @UseFilters(new FileSizeExceptionFilter())
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadCourses(@UploadedFile() file: Express.Multer.File) {
    console.log('Received file:', file);
  if (!file) {
    throw new BadRequestException('No file uploaded.');
  }
    await this.adminService.uploadCourses(file);
    return { message: 'Courses uploaded successfully' };
  }

  @Post('upload-rooms')
  @UseFilters(new FileSizeExceptionFilter())
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadRooms(@UploadedFile() file: Express.Multer.File) {
    console.log('Received file:', file);
  if (!file) {
    throw new BadRequestException('No file uploaded.');
  }
    await this.adminService.uploadRooms(file);
    return { message: 'Rooms uploaded successfully' };
  }

  @Post('upload-lecturer-availability')
  @UseFilters(new FileSizeExceptionFilter())
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadLecturerAvailability(@UploadedFile() file: Express.Multer.File) {
    console.log('Received file:', file);
  if (!file) {
    throw new BadRequestException('No file uploaded.');
  }
    await this.adminService.uploadLecturerAvailability(file);
    return { message: 'Lecturer availability uploaded successfully' };
  }
  @Post('upload-users')
  @UseFilters(new FileSizeExceptionFilter())
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async uploadUsers(@UploadedFile() file: Express.Multer.File) {
    console.log('Received file:', file);
  if (!file) {
    throw new BadRequestException('No file uploaded.');
  }
    await this.adminService.uploadUser(file);
    return { message: 'Users uploaded successfully' };
  }
}