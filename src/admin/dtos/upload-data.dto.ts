import { IsNotEmpty } from 'class-validator';

export class UploadDataDto {
  @IsNotEmpty()
  file: any; // Multer file object
}