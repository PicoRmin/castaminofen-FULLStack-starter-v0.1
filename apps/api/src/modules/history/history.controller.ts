import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HistoryService } from './history.service';
import { CreateHistoryDto } from './dto/create-history.dto';

@ApiTags('History')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Post()
  create(
    @Body() dto: CreateHistoryDto,
    @Req() req: Request & { user?: { id?: string; role?: string } },
  ) {
    return this.historyService.create(dto, req.user?.id ?? '', req.user?.role ?? 'user');
  }

  @Get(':userId')
  findByUser(@Param('userId') userId: string) {
    return this.historyService.findByUser(userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request & { user?: { id?: string; role?: string } }) {
    return this.historyService.remove(id, req.user?.id ?? '', req.user?.role ?? 'user');
  }
}
