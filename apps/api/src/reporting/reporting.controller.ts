import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ReportingService } from './reporting.service';
import { toCsv, toXlsx, toPdf, payrollToCsv } from './report-export';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('reporting')
@ApiBearerAuth()
@Roles(Role.OWNER, Role.MANAGER, Role.HR, Role.ACCOUNTING)
@Controller('reports')
export class ReportingController {
  constructor(private readonly reporting: ReportingService) {}

  @Get('hours-cost')
  hoursCost(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!from || !to) throw new BadRequestException('from en to zijn verplicht');
    return this.reporting.hoursAndCost(user.companyId, from, to);
  }

  @Get('hours-cost/export')
  async export(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    if (!from || !to) throw new BadRequestException('from en to zijn verplicht');
    const report = await this.reporting.hoursAndCost(user.companyId, from, to);
    const base = `shiftflow-uren-kosten`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${base}.csv"`);
      return res.send(toCsv(report));
    }
    if (format === 'xlsx') {
      const buf = await toXlsx(report);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader('Content-Disposition', `attachment; filename="${base}.xlsx"`);
      return res.send(buf);
    }
    if (format === 'pdf') {
      const buf = await toPdf(report);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${base}.pdf"`);
      return res.send(buf);
    }
    throw new BadRequestException('Ongeldig formaat (gebruik csv, xlsx of pdf)');
  }

  @Get('payroll')
  payroll(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    if (!from || !to) throw new BadRequestException('from en to zijn verplicht');
    return this.reporting.payroll(user.companyId, from, to);
  }

  @Get('payroll/export')
  async payrollExport(
    @CurrentUser() user: AuthUser,
    @Query('from') from: string,
    @Query('to') to: string,
    @Res() res: Response,
  ) {
    if (!from || !to) throw new BadRequestException('from en to zijn verplicht');
    const report = await this.reporting.payroll(user.companyId, from, to);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="shiftflow-loonexport.csv"');
    return res.send(payrollToCsv(report));
  }
}
