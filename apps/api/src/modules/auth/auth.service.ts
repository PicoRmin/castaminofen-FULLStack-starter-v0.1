import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigService } from '../../common/config/config.service';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService = new PrismaService(),
    private readonly config: ConfigService = new ConfigService(),
  ) {}

  async register(input: { name?: string; email: string; password: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name ?? 'Listener',
        passwordHash: passwordHash ?? null,
        role: 'user',
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    await this.prisma.profile
      .create({
        data: {
          userId: user.id,
          displayName: user.name ?? 'Listener',
          locale: 'en',
        },
      })
      .catch(() => undefined);

    const accessToken = this.signToken(user.id, user.role);
    const refreshToken = this.signRefreshToken(user.id);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hashToken(refreshToken), lastLoginAt: new Date() },
    });

    return { user, accessToken, refreshToken };
  }

  async login(input: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.signToken(user.id, user.role);
    const refreshToken = this.signRefreshToken(user.id);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hashToken(refreshToken), lastLoginAt: new Date() },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, this.config.require('JWT_REFRESH_SECRET')) as {
        sub?: string;
      };
      if (!payload.sub) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user?.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const accessToken = this.signToken(user.id, user.role);
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private signToken(sub: string, role: string) {
    return jwt.sign({ sub, role }, this.config.require('JWT_SECRET'), { expiresIn: '1h' });
  }

  private signRefreshToken(sub: string) {
    return jwt.sign({ sub, type: 'refresh' }, this.config.require('JWT_REFRESH_SECRET'), {
      expiresIn: '7d',
    });
  }
}
