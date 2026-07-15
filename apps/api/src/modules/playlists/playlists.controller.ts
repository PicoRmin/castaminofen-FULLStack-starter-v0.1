import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';

@ApiTags('Playlists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  create(
    @Body() dto: CreatePlaylistDto,
    @Req() req: Request & { user?: { id?: string; role?: string } },
  ) {
    return this.playlistsService.create(dto, req.user?.id ?? '', req.user?.role ?? 'user');
  }

  @Get(':userId')
  findByUser(@Param('userId') userId: string) {
    return this.playlistsService.findByUser(userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlaylistDto,
    @Req() req: Request & { user?: { id?: string; role?: string } },
  ) {
    return this.playlistsService.update(id, dto, req.user?.id ?? '', req.user?.role ?? 'user');
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request & { user?: { id?: string; role?: string } }) {
    return this.playlistsService.remove(id, req.user?.id ?? '', req.user?.role ?? 'user');
  }
}
