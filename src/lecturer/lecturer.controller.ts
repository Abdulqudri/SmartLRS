import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { LecturerService } from './lecturer.service';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User } from 'src/users/schema/user.schema';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('lecturer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('lecturer')
export class LecturerController {
  constructor(private readonly lecturerService: LecturerService) {}

  @Post('availability')
  async inputAvailability(){
    
  }

  @Get('availability')
  async getAvailability(@CurrentUser()user: User){
    return await this.lecturerService.getAllAvailability(user._id)
  }

}
