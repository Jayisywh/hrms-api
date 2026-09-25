import { Module } from '@nestjs/common';
import { LeaveRequestService } from './leave_request.service';
import { LeaveRequestController } from './leave_request.controller';

@Module({
  providers: [LeaveRequestService],
  controllers: [LeaveRequestController]
})
export class LeaveRequestModule {}
