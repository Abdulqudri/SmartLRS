import { IsNotEmpty } from 'class-validator';

export class UploadDataDto {
  @IsNotEmpty()
  file: Express.Multer.File;
}
