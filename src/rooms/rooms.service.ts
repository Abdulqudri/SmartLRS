import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from './schemas/room.schema';
import { CreateRoomDto } from './dtos/create-room.dto';

@Injectable()
export class RoomsService {
  constructor(@InjectModel(Room.name) private roomModel: Model<Room>) {}

  async create(roomData: CreateRoomDto): Promise<Room> {
    const room = new this.roomModel(roomData);
    return room.save();
  }
  async findAll() {
    return await this.roomModel.find().exec()
  }
  async findOneByName(name: string): Promise<Room | null> {
    const room = await this.roomModel.findOne({name})
    return room;
  }
}