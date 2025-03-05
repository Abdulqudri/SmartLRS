import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CoursesModule } from './courses/courses.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { DatabaseModule } from './mongoose/mongoose.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { TimeslotsModule } from './timeslots/timeslots.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { FeedbackModule } from './feedback/feedback.module';
import { RefreshTokensModule } from './refresh-tokens/refresh-tokens.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    CoursesModule,
    SchedulingModule,
    UsersModule,
    RoomsModule,
    TimeslotsModule,
    EnrollmentsModule,
    FeedbackModule,
    RefreshTokensModule,
    AdminModule,
  ]
})
export class AppModule {}
