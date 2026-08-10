/**
 * @app/api-gateway — 后端 API 网关（接口定义）
 *
 * 当前为骨架阶段，定义模块、控制器与服务接口。
 * 后续基于 NestJS 实现 RESTful API、JWT 认证与扫描报告服务。
 */

export * from './app.module';
export * from './auth';
export * from './users';
export * from './scans';
export * from './reports';
export * from './massage';
