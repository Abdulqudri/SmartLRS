import { IsString, IsNotEmpty, IsNumber, IsArray, ArrayUnique, IsOptional, Min } from 'class-validator';

export class CreateRoomDto {
  @IsNotEmpty()
  @IsString()
  name: string; // Example: "Room A1"

  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity: number; // Example: 50

  @IsOptional() // Equipment is optional
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true }) // Ensures each item is a string
  availableEquipment?: string[]; // Example: ["Projector", "Whiteboard"]
}
