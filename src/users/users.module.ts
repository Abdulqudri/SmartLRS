import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { UsersService } from './users.service';
import { TimeslotsModule } from 'src/timeslots/timeslots.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    TimeslotsModule,
  ],
  exports: [MongooseModule, UsersService],
  providers: [UsersService],
})
export class UsersModule {}
