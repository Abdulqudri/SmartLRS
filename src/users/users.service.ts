import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dtos/createUser.dto';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>){}


    async create(user: CreateUserDto) {
        const createdUser = new this.userModel(user)
        return await createdUser.save()
    }
    async findOneById(id: Types.ObjectId) : Promise<User | null > {
      return await this.userModel.findById(id)
    }
    async findOneByEmail(email: string) : Promise<User | null > {
        return await this.userModel.findOne({email}).exec()
    }
    async findOneByUserId(userId: string) : Promise<User | null > {
        return await this.userModel.findOne({userId}).exec()
    }
    async updateAvailability(userId: string, timeslotIds: string[]): Promise<User> {
        // Validate userId format
        if (!Types.ObjectId.isValid(userId)) {
          throw new BadRequestException('Invalid user ID format');
        }
        
        // Validate timeslotIds are valid ObjectIds
        const validTimeslotIds = timeslotIds.filter(id => Types.ObjectId.isValid(id));
      
        if (validTimeslotIds.length !== timeslotIds.length) {
          throw new BadRequestException('One or more timeslot IDs are invalid');
        }
      
        // Update the user's availableTimeslots
        const updatedUser = await this.userModel.findByIdAndUpdate(
          userId,
          { $set: { availableTimeslots: validTimeslotIds } },
          { new: true }
        ).exec();
        
        // Handle case where user is not found
        if (!updatedUser) {
          throw new NotFoundException('User not found');
        }
      
        return updatedUser;
    }
    async findAll () {
      return await this.userModel.find().exec();
    }
    async findAllLecturers () {
      return await this.userModel.find({role: 'lecturer'})
    }
}
