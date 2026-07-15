import { Injectable } from '@nestjs/common';

@Injectable()
export class ConfigService {
  get<T = string>(key: string, defaultValue?: T): T | undefined {
    const value = process.env[key];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    return value as T;
  }

  require(key: string, defaultValue?: string): string {
    const value = this.get<string>(key, defaultValue);
    if (value === undefined) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  }

  isProduction(): boolean {
    return (process.env.NODE_ENV ?? 'development') === 'production';
  }
}
