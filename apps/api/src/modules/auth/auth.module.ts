import { Module } from '@nestjs/common';

import { ConfigService } from '../../common/config/config.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, ConfigService],
})
export class AuthModule {}
