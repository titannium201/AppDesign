import { Injectable } from '@nestjs/common';
import type { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import type { AuthTokens } from '@app/shared';

/**
 * 认证服务接口（M1）
 */
export interface AuthService {
  register(dto: RegisterDto): Promise<{ userId: string }>;
  login(dto: LoginDto): Promise<AuthTokens>;
  refresh(dto: RefreshTokenDto): Promise<AuthTokens>;
}

@Injectable()
export class AuthServiceImpl implements AuthService {
  async register(_dto: RegisterDto): Promise<{ userId: string }> {
    throw new Error('register not implemented');
  }

  async login(_dto: LoginDto): Promise<AuthTokens> {
    throw new Error('login not implemented');
  }

  async refresh(_dto: RefreshTokenDto): Promise<AuthTokens> {
    throw new Error('refresh not implemented');
  }
}
