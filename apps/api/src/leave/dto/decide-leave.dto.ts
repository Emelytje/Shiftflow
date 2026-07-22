import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveStatus } from '@prisma/client';

export class DecideLeaveDto {
  @ApiProperty({ enum: [LeaveStatus.APPROVED, LeaveStatus.REJECTED] })
  @IsEnum(LeaveStatus)
  status!: LeaveStatus;
}
