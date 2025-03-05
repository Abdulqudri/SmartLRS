import { Controller, Post, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';



@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('upload-courses')
  @UseInterceptors(FileInterceptor('users'))
  async uploadCourses(@UploadedFile() file: Express.Multer.File) {
    console.log('Received file:', file);
  if (!file) {
    throw new BadRequestException('No file uploaded.');
  }
    await this.adminService.uploadCourses(file);
    return { message: 'Courses uploaded successfully' };
  }

  @Post('upload-rooms')
  @UseInterceptors(FileInterceptor('file'))
  async uploadRooms(@UploadedFile() file: Express.Multer.File) {
    console.log('Received file:', file);
  if (!file) {
    throw new BadRequestException('No file uploaded.');
  }
    await this.adminService.uploadRooms(file);
    return { message: 'Rooms uploaded successfully' };
  }

  @Post('upload-lecturer-availability')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLecturerAvailability(@UploadedFile() file: Express.Multer.File) {
    console.log('Received file:', file);
  if (!file) {
    throw new BadRequestException('No file uploaded.');
  }
    await this.adminService.uploadLecturerAvailability(file);
    return { message: 'Lecturer availability uploaded successfully' };
  }
  @Post('upload-users')
  @UseInterceptors(FileInterceptor('file'))
  async uploadUsers(@UploadedFile() file: Express.Multer.File) {
    console.log('Received file:', file);
  if (!file) {
    throw new BadRequestException('No file uploaded.');
  }
    await this.adminService.uploadUser(file);
    return { message: 'Users uploaded successfully' };
  }
}