/**
 * 认证 DTO
 *
 * 邮箱注册/登录由 UsersModule 处理，此处保留兼容导出。
 */
export { RegisterDto, LoginDto, UpdateProfileDto } from '../users/users.dto';
export class RefreshTokenDto {
  refreshToken!: string;
}
