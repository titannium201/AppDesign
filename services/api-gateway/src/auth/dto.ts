/**
 * 认证 DTO（骨架）
 */

export class RegisterDto {
  phoneNumber!: string;
  verificationCode!: string;
  nickname?: string;
  password?: string;
}

export class LoginDto {
  phoneNumber!: string;
  password?: string;
  verificationCode?: string;
}

export class RefreshTokenDto {
  refreshToken!: string;
}
