
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/users/dtos/createUser.dto';
import { LoginDto } from './dtos/login.dto';

@Controller('users')
export class AuthController {
    constructor( private readonly authService: AuthService) {}
    
    @Post('register')
    signup(@Body() createUserDto: CreateUserDto){
        try {
            this.authService.signup(createUserDto)
        } catch (error) {
            throw error
        }
    }
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto)
    }
    @Post('refresh') 
    async refreshToken(@Body() refreshToken: string ) {
        return this.authService.refreshToken(refreshToken)
    }

    @Post('logout')
    async logout (@Body('refreshToken') refreshToken: string) {
        await this.authService.logout(refreshToken)
        return { message: 'Logged out successfully'}
    }
}
