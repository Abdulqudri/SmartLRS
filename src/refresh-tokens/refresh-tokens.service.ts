import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RefreshToken } from './schemas/refresh-token.schema';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { Model } from 'mongoose';

@Injectable()
export class RefreshTokensService {
    constructor(
        @InjectModel(RefreshToken.name) 
        private refreshTokenModel: Model<RefreshToken>
    ){}

    async create (refreshToken: RefreshTokenDto): Promise<RefreshToken>{

        const {token, userId, expiryDate} = refreshToken
        const newRefreshToken = new this.refreshTokenModel({token, userId, expiryDate})
        return await newRefreshToken.save()
    }

    async findOne(token: string ): Promise<RefreshToken | null>  {
        return this.refreshTokenModel.findOne({token, expiryDate: { $gte: new Date() }}).exec()
    }

    async delete(token: string): Promise<void> {
        await this.refreshTokenModel.deleteOne({token}).exec()
    } 
}
