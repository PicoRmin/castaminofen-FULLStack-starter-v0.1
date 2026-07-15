import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { FeedsController } from './feeds.controller';
import { FeedsMonitoringController } from './feeds-monitoring.controller';
import { FeedMonitoringService } from './feeds-monitoring.service';
import { FeedsOperationalController } from './feeds-operational.controller';
import { FeedsOperationalService } from './feeds-operational.service';
import { FeedsService } from './feeds.service';
import { FeedsSynchronizationService } from './feeds-synchronization.service';

@Module({
  imports: [PrismaModule],
  controllers: [FeedsController, FeedsMonitoringController, FeedsOperationalController],
  providers: [
    FeedsService,
    FeedsSynchronizationService,
    FeedMonitoringService,
    FeedsOperationalService,
  ],
  exports: [
    FeedsService,
    FeedsSynchronizationService,
    FeedMonitoringService,
    FeedsOperationalService,
  ],
})
export class FeedsModule {}
