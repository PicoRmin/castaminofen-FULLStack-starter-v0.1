import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { PodcastsModule } from './modules/podcasts/podcasts.module';
import { EpisodesModule } from './modules/episodes/episodes.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TagsModule } from './modules/tags/tags.module';
import { PlaylistsModule } from './modules/playlists/playlists.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { HistoryModule } from './modules/history/history.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { FeedsModule } from './modules/feeds/feeds.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { ConfigService } from './common/config/config.service';
import { HomeController } from './modules/home/home.controller';
import { HomeService } from './modules/home/home.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60, limit: 120 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProfilesModule,
    ChannelsModule,
    PodcastsModule,
    EpisodesModule,
    CategoriesModule,
    TagsModule,
    PlaylistsModule,
    BookmarksModule,
    HistoryModule,
    SearchModule,
    NotificationsModule,
    UploadsModule,
    AdminModule,
    HealthModule,
    FeedsModule,
  ],
  controllers: [HomeController],
  providers: [
    HomeService,
    ConfigService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
