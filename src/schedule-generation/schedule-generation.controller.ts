import { Controller } from '@nestjs/common';
import { ScheduleGenerationService } from './schedule-generation.service';

@Controller('schedule-generation')
export class ScheduleGenerationController {
  constructor(private readonly scheduleGenerationService: ScheduleGenerationService) {}
}
