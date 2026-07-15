import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BookmarksService } from './bookmarks.service';
import { CreateBookmarkDto } from './dto/create-bookmark.dto';

@ApiTags('Bookmarks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post()
  create(
    @Body() dto: CreateBookmarkDto,
    @Req() req: Request & { user?: { id?: string; role?: string } },
  ) {
    return this.bookmarksService.create(dto, req.user?.id ?? '', req.user?.role ?? 'user');
  }

  @Get(':userId')
  findByUser(@Param('userId') userId: string) {
    return this.bookmarksService.findByUser(userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request & { user?: { id?: string; role?: string } }) {
    return this.bookmarksService.remove(id, req.user?.id ?? '', req.user?.role ?? 'user');
  }
}
