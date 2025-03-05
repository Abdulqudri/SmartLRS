import {IsString, IsEmail, IsNotEmpty, IsEnum, IsStrongPassword, IsOptional, Length, Matches, IsArray, ArrayUnique, IsMongoId} from 'class-validator'
import { UserRole } from '../schema/user.schema';

export class CreateUserDto {

    @IsOptional() // Allow userId to be manually provided
    @IsString()
    @Length(10, 10, { message: 'User ID must be exactly 10 characters long' })
    @Matches(/^[A-Za-z0-9]+$/, { message: 'User ID must contain only letters and numbers' })
    userId?: string; 

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEmail()
    email: string;
    @IsEnum(UserRole, {message: 'role must be one of: admin, user, lecturer'})
    role: string
    @IsString()
    @IsStrongPassword()
    password: string;

    @IsOptional() // Makes this field optional
    @IsArray()
    @ArrayUnique()
    @IsMongoId({ each: true, message: 'Each timeslot ID must be a valid MongoDB ObjectId' })
    availableTimeslots?: string[];

}
