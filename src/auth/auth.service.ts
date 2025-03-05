import { HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dtos/createUser.dto';
import * as bcrypt from 'bcrypt'
import { LoginDto } from './dtos/login.dto';
import { RefreshTokensService } from 'src/refresh-tokens/refresh-tokens.service';

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private refreshTokenService: RefreshTokensService,
        private jwtService: JwtService,
    ){}
    async signup(createUserDto: CreateUserDto) {
        const {name, email, password,  role} = createUserDto;
        const userExist = await this.userService.findOneByEmail(email)

        if(userExist) {
            throw new HttpException('user already exist', 404)
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await this.userService.create({
            name,
            email,
            password: hashedPassword,
            role
        })

        return {message: 'User registered successfullly'};

    }

    async login(loginDto: LoginDto) {
        const {email, password} = loginDto
        const user = await this.userService.findOneByEmail(email)
        if(user && await bcrypt.compare(password, user.password)) {
            return await this.generateUserToken(user.email, user._id, user.role)
        }
        throw new UnauthorizedException('Invalid credentials')
    }

    async logout(refreshToken: string): Promise<void> {
        await this.refreshTokenService.delete(refreshToken)
    }

    async generateUserToken(email: string, id , role: string) {
        const payload = {email, sub: id, role: role}
        const refreshToken = this.jwtService.sign(payload, {expiresIn: '3d'})
        await this.storeUserToken(refreshToken, id)
            return { 
                access_token: this.jwtService.sign(payload, {expiresIn: '15m'}),
                refreshToken
            }
    }

    async storeUserToken(token: string, id) {
        const expiryDate = new Date()

        expiryDate.setDate(expiryDate.getDate() + 3)

        await this.refreshTokenService.create({token, userId: id , expiryDate})
    }


    async refreshToken (refreshToken: string): Promise<{access_token: string, refreshToken: string}> {
        try {
            const token = this.refreshTokenService.findOne(refreshToken)
            if(!token) {
                throw new UnauthorizedException('Invalid refresh token');
            }
            const payload = this.jwtService.verify(refreshToken)
    
            return await this.generateUserToken(payload.email, payload.sub, payload.role)
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
        
    }
}
