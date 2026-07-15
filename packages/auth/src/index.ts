import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

import { PackageConfig, PackageContract } from './types';

export * from './types';

export interface AuthUser {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly createdAt: string;
}

export interface RegisterInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
}

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export interface AuthSession {
  readonly token: string;
  readonly userId: string;
  readonly expiresAt: string;
}

export interface AuthResult {
  readonly user: Omit<AuthUser, 'passwordHash'>;
  readonly session: AuthSession;
}

export interface UserRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
  save(user: AuthUser): Promise<AuthUser>;
}

export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, AuthUser>();

  async findByEmail(email: string): Promise<AuthUser | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }

    return null;
  }

  async save(user: AuthUser): Promise<AuthUser> {
    this.users.set(user.email, user);
    return user;
  }
}

export class AuthService implements PackageContract {
  constructor(
    private readonly userRepository: UserRepository,
    public readonly config: PackageConfig = {
      name: '@castaminofen/auth',
      version: '0.1.0',
      enabled: true,
    },
  ) {}

  initialize(): string {
    return `${this.config.name} initialized`;
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    this.ensureValidEmail(input.email);
    this.ensureValidPassword(input.password);

    const existingUser = await this.userRepository.findByEmail(input.email.trim().toLowerCase());
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    const user: AuthUser = {
      id: this.createId(),
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash: this.hashPassword(input.password),
      createdAt: new Date().toISOString(),
    };

    const savedUser = await this.userRepository.save(user);
    const session = this.createSession(savedUser.id);

    return {
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        createdAt: savedUser.createdAt,
      },
      session,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    this.ensureValidEmail(input.email);

    const user = await this.userRepository.findByEmail(input.email.trim().toLowerCase());
    if (!user || !this.verifyPassword(input.password, user.passwordHash)) {
      throw new Error('Invalid credentials');
    }

    const session = this.createSession(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      session,
    };
  }

  private ensureValidEmail(email: string): void {
    const normalized = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error('A valid email address is required');
    }
  }

  private ensureValidPassword(password: string): void {
    if (password.length < 10) {
      throw new Error('Password must be at least 10 characters long');
    }
  }

  private createSession(userId: string): AuthSession {
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

    return {
      token: randomBytes(24).toString('hex'),
      userId,
      expiresAt,
    };
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = pbkdf2Sync(password, salt, 100_000, 64, 'sha512');
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  private verifyPassword(password: string, storedValue: string): boolean {
    const [salt, hash] = storedValue.split(':');
    if (!salt || !hash) {
      return false;
    }

    const derivedKey = pbkdf2Sync(password, salt, 100_000, 64, 'sha512');
    const expectedHash = Buffer.from(hash, 'hex');
    return timingSafeEqual(derivedKey, expectedHash);
  }

  private createId(): string {
    return randomBytes(8).toString('hex');
  }
}

export const packageMetadata = {
  name: '@castaminofen/auth',
  version: '0.1.0',
  enabled: true,
};
