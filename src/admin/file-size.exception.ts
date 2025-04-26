import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { MulterError } from 'multer';

@Catch(MulterError)
export class FileSizeExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const response: Response = host.switchToHttp().getResponse();

    if (exception.code === 'LIMIT_FILE_SIZE') {
      return response
        .status(400)
        .json({ message: 'File size exceeds the allowed limit (2MB).' });
    }

    return response
      .status(400)
      .json({ message: 'File upload error', error: exception.message });
  }
}
