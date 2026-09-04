import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DepartmentsModule } from './departments/departments.module';
import { PositionsModule } from './positions/positions.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { PayrollModule } from './payroll/payroll.module';
import { RecruitmentModule } from './recruitment/recruitment.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    DepartmentsModule,
    PositionsModule,
    EmployeesModule,
    AttendanceModule,
    PayrollModule,
    RecruitmentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
