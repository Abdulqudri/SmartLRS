import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { MulterError } from 'multer';

@Catch(MulterError)
export class FileSizeExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    if (exception.code === 'LIMIT_FILE_SIZE') {
      return response.status(400).json({ message: 'File size exceeds the allowed limit (2MB).' });
    }

    return response.status(400).json({ message: 'File upload error', error: exception.message });
  }
}
