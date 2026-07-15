import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  NotificationsService,
  type NotificationChannel,
  type NotificationPreferences,
  type NotificationQueueItem,
} from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(@Req() req: Request & { user?: { id?: string } }) {
    return this.notificationsService.findAll(req.user?.id ?? '');
  }

  @Post()
  create(
    @Req() req: Request & { user?: { id?: string } },
    @Body() body: Record<string, unknown>,
  ) {
    return this.notificationsService.create(req.user?.id ?? '', {
      userId: req.user?.id ?? '',
      title: String(body.title ?? 'New notification'),
      message: String(body.message ?? ''),
      ...(Array.isArray(body.channels)
        ? { channels: body.channels as NotificationChannel[] }
        : {}),
      ...(typeof body.templateName === 'string' ? { templateName: body.templateName } : {}),
      ...(typeof body.context === 'object' && body.context
        ? { context: body.context as Record<string, unknown> }
        : {}),
      ...(typeof body.preferences === 'object' && body.preferences
        ? { preferences: body.preferences as NotificationPreferences }
        : {}),
      ...(typeof body.retry === 'object' && body.retry
        ? { retry: body.retry as { maxAttempts?: number } }
        : {}),
      queue: typeof body.queue === 'boolean' ? body.queue : false,
      ...(body.scheduledAt ? { scheduledAt: new Date(String(body.scheduledAt)) } : {}),
      ...(typeof body.metadata === 'object' && body.metadata
        ? { metadata: body.metadata as Record<string, unknown> }
        : {}),
    });
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch(':id/unread')
  markAsUnread(@Param('id') id: string) {
    return this.notificationsService.markAsUnread(id);
  }

  @Get('preferences')
  getPreferences(@Req() req: Request & { user?: { id?: string } }): NotificationPreferences {
    return this.notificationsService.getPreferences(req.user?.id ?? '');
  }

  @Patch('preferences')
  updatePreferences(
    @Req() req: Request & { user?: { id?: string } },
    @Body() body: Record<string, unknown>,
  ): NotificationPreferences {
    return this.notificationsService.setPreferences(req.user?.id ?? '', {
      ...(body.inApp === undefined ? {} : { inApp: Boolean(body.inApp) }),
      ...(body.email === undefined ? {} : { email: Boolean(body.email) }),
      ...(body.push === undefined ? {} : { push: Boolean(body.push) }),
      ...(body.webPush === undefined ? {} : { webPush: Boolean(body.webPush) }),
    });
  }

  @Post('digest')
  createDigest(
    @Req() req: Request & { user?: { id?: string } },
    @Body() body: { notificationIds?: string[] },
  ) {
    return this.notificationsService.createDigest(req.user?.id ?? '', body.notificationIds ?? []);
  }

  @Post('schedule')
  schedule(
    @Req() req: Request & { user?: { id?: string } },
    @Body() body: Record<string, unknown>,
  ) {
    return this.notificationsService.schedule(req.user?.id ?? '', {
      userId: req.user?.id ?? '',
      title: String(body.title ?? 'Scheduled notification'),
      message: String(body.message ?? ''),
      ...(Array.isArray(body.channels)
        ? { channels: body.channels as NotificationChannel[] }
        : {}),
      ...(typeof body.templateName === 'string' ? { templateName: body.templateName } : {}),
      ...(typeof body.context === 'object' && body.context
        ? { context: body.context as Record<string, unknown> }
        : {}),
      ...(typeof body.preferences === 'object' && body.preferences
        ? { preferences: body.preferences as NotificationPreferences }
        : {}),
      ...(typeof body.retry === 'object' && body.retry
        ? { retry: body.retry as { maxAttempts?: number } }
        : {}),
      queue: true,
      ...(body.scheduledAt ? { scheduledAt: new Date(String(body.scheduledAt)) } : {}),
      ...(typeof body.metadata === 'object' && body.metadata
        ? { metadata: body.metadata as Record<string, unknown> }
        : {}),
    });
  }
}
