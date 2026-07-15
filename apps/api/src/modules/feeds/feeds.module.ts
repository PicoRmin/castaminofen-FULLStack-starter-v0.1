import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { FeedsController } from './feeds.controller';
import { FeedsMonitoringController } from './feeds-monitoring.controller';
import { FeedMonitoringService } from './feeds-monitoring.service';
import { FeedsOperationalController } from './feeds-operational.controller';
import { FeedsOperationalService } from './feeds-operational.service';
import { FeedsAdministrationController } from './feeds-administration.controller';
import { FeedsAdministrationService } from './feeds-administration.service';
import { FeedsService } from './feeds.service';
import { FeedsSynchronizationService } from './feeds-synchronization.service';
import { FeedLifecycleService } from '@castaminofen/rss';

@Module({
  imports: [PrismaModule],
  controllers: [
    FeedsController,
    FeedsMonitoringController,
    FeedsOperationalController,
    FeedsAdministrationController,
  ],
  providers: [
    FeedsService,
    FeedsSynchronizationService,
    FeedMonitoringService,
    FeedsOperationalService,
    FeedsAdministrationService,
    FeedLifecycleService,
  ],
  exports: [
    FeedsService,
    FeedsSynchronizationService,
    FeedMonitoringService,
    FeedsOperationalService,
    FeedsAdministrationService,
  ],
})
export class FeedsModule {}
