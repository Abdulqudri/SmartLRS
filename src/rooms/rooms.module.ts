import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from './schemas/room.schema';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: Room.name,
      schema: RoomSchema
    }
  ])],

  providers: [RoomsService],
  exports: [RoomsService]
})
export class RoomsModule {}
