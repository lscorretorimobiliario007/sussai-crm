import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SystemLogLevel, UserProfile } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { LogsService } from './logs.service';

class QueryLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsEnum(SystemLogLevel)
  level?: SystemLogLevel;
}

@Controller('logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserProfile.ADMIN)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  findAll(@Query() query: QueryLogsDto) {
    return this.logsService.findAll(query);
  }
}
