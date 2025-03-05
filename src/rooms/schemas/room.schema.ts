import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Room extends Document {

    @Prop({ required: true, unique: true })
    name: string; // e.g., "Room A1"

    @Prop({ required: true })
    capacity: number; // e.g., 50

    @Prop([String])
    availableEquipment: string[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);