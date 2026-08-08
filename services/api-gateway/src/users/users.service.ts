import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { UserAccount, UpdateProfileRequest } from '@app/shared';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class UsersService {
  private users: UserAccount[] = [];

  constructor(private readonly authService: AuthService) {}

  findByEmail(email: string): UserAccount | undefined {
    return this.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase(),
    );
  }

  findById(id: string): UserAccount | undefined {
    return this.users.find((u) => u.id === id);
  }

  create(email: string, password: string, nickname?: string): UserAccount {
    if (this.findByEmail(email)) {
      throw new ConflictException('Email already registered');
    }

    const now = new Date().toISOString();
    const user: UserAccount = {
      id: uuidv4(),
      email: email.toLowerCase().trim(),
      passwordHash: this.authService.hashPassword(password),
      nickname: nickname?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.users.push(user);
    return user;
  }

  validateCredentials(email: string, password: string): UserAccount {
    const user = this.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = this.authService.comparePassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  updateProfile(userId: string, dto: UpdateProfileRequest): UserAccount {
    const user = this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated: UserAccount = {
      ...user,
      ...dto,
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      updatedAt: new Date().toISOString(),
    };

    this.users = this.users.map((u) => (u.id === userId ? updated : u));
    return updated;
  }
}
