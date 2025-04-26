import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/users/schema/user.schema';
import { Request } from 'express'; // Import the Express Request type

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): User => {
    const request: Request = context.switchToHttp().getRequest(); // Cast to Express Request
    return request.user as User; // Cast request.user to User
  },
);
