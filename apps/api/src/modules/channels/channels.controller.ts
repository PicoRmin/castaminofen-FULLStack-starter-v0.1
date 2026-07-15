import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@ApiTags('Channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Post()
  create(
    @Body() dto: CreateChannelDto,
    @Req() req: Request & { user?: { id?: string; role?: string } },
  ) {
    return this.channelsService.create(dto, req.user?.id ?? '');
  }

  @Get()
  findAll() {
    return this.channelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.channelsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChannelDto,
    @Req() req: Request & { user?: { id?: string; role?: string } },
  ) {
    return this.channelsService.update(id, dto, req.user?.id ?? '', req.user?.role ?? 'user');
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request & { user?: { id?: string; role?: string } }) {
    return this.channelsService.remove(id, req.user?.id ?? '', req.user?.role ?? 'user');
  }
}
