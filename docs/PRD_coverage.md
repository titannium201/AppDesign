# PRD 实现覆盖度清单

> 基于 `docs/PRD.md` 对 `feature/anatomylens-local-model` 分支进行人工对照检查。
> 检查时间：2026-08-09
> 仓库路径：`C:\ti-recovery\AppDesign`

## 总体结论

- 仓库整体架构（pnpm monorepo + Turbo、后端 NestJS、移动端 Expo、Web 3D Three.js）已搭建完成。
- 当前处于 **Demo/MVP 阶段**：各端页面与接口骨架基本具备，但**真实硬件对接、算法闭环、数据库持久化、管理后台、社区模块均缺失或未联通**。
- 主要阻塞点：
  1. `services/api-gateway/prisma/schema.prisma` 未配置 `url` 且未接入 Prisma 7.x 强制的 SQLite driver adapter，后端运行/部署会失败。
  2. 移动端尚未真正调用后端 API，页面数据大多为本地 mock。
  3. `packages/muscle-3d` 只有抽象接口，没有 Three.js/Babylon 具体实现，`apps/web-3d` 自行实现了简化模型，未使用 `muscle-3d` 包。

## 功能模块覆盖度

| PRD 模块 | 需求项 | 实现状态 | 关键文件/说明 |
| --- | --- | --- | --- |
| **M1 用户模块** | 注册/登录 | **部分完成** | 后端：`services/api-gateway/src/auth/*` 已实现密码哈希（argon2id）+ JWT 签发；前端：`apps/mobile/src/screens/LoginScreen.tsx` 只有 UI，未调用 `api/auth.ts`。 |
|  | 账号/隐私管理 | **缺失** | 没有忘记密码、修改密码、账号注销、隐私设置页面或接口。 |
|  | 个人资料 | **部分完成** | 后端 `UsersModule` 已提供 CRUD；前端 `ProfileScreen` / `ProfileFormScreen` 有 UI，但仅修改本地 state，未保存到后端。 |
|  | 健身目标/训练频率 | **骨架完成** | `packages/shared/src/types.ts` 已定义 `FitnessProfile`；`UpdateUserDto` 支持这些字段，但未在 API 中强制校验/联动。 |
| **M2 数据采集** | BLE 设备搜索与绑定 | **缺失** | 没有实现 BLE 扫描/绑定页面；`packages/nirs-sdk` 只有接口，没有 react-native-ble-plx/Web Bluetooth 实现。 |
|  | 设备信息/校准 | **缺失** | `services/api-gateway/src/devices` 只有内存 CRUD，无固件版本、电池、校准参数接口。 |
|  | NIRS 扫描流程 | **部分完成** | 移动端 `ScanSelectScreen` -> `ScanPrepareScreen` -> `ScanningScreen` -> `ScanReportScreen` 流程已跑通；但扫描数据来自本地 `setInterval` 模拟，未接入 `NirsSimulator`/`MockNirsStream`。 |
|  | 实时数据显示 | **部分完成** | `ScanningScreen` 有进度条、8 通道实时数值面板，但数据来源是 mock。 |
|  | 扫描数据上传 | **部分完成** | 后端 `POST /scans` + `CreateScanDto` / `NirsDataFrameDto` 已定义；但移动端未实际上传；后端也未把扫描数据写入报告/算法。 |
|  | 历史记录 | **部分完成** | 后端 `GET /scans/history` 已实现；移动端 `HistoryScreen` 展示的是本地 mock 数据，未调用接口。 |
|  | 离线采集缓存 | **缺失** | 无离线队列、同步机制。 |
| **M3 数据分析与评估** | 生理指标计算 | **骨架完成** | `packages/recovery-algo/src/score.ts` 提供基础 `calculateRecoveryScore`；`fatigue.ts` 有 `calculateFatigueLevel` 占位，未接入真实模型。 |
|  | 恢复分数/疲劳等级 | **部分完成** | 后端 `ReportsService` 目前只返回固定 mock 报告（`MOCK_LATEST_REPORT`），未调用 `recovery-algo`。 |
|  | 趋势/基准/训练负荷 | **缺失** | 无历史趋势聚合、个人基准、训练负荷计算。 |
|  | 报告生成 | **部分完成** | 后端 `GET /reports/latest`、`GET /reports/:id` 已提供；数据为 mock。 |
| **M4 恢复方案** | 恢复计划生成 | **缺失** | 无恢复计划、日程、进度跟踪页面或算法。 |
|  | 按摩模式/设备控制 | **部分完成** | 后端 `MassageModule` 提供模式/强度/时长 CRUD；前端无按摩页面，未对接设备控制。 |
|  | 计划调整 | **缺失** | 无基于最新评估结果动态调整计划逻辑。 |
| **M5 3D 可视化** | 可交互 3D 腿部模型 | **部分完成** | `apps/web-3d/src/components/MuscleScene.tsx` 基于 `@react-three/fiber` + 简化圆柱体实现；`public/data/leg-muscles.json` 定义了肌肉元数据。 |
|  | 热力图层 | **部分完成** | 支持 `StO2` / `fatigue` / `perfusion` 模式切换、左右腿、详情面板；但热力值来自本地 mock，未接入后端报告 API。 |
|  | 层级控制 | **部分完成** | `LayerControls` 提供骨骼/肌肉/肌腱/韧带/筋膜/器官开关 UI，但当前仅打印到控制台。 |
|  | GLB 模型加载 | **缺失** | `packages/muscle-3d` 的 `createModelLoader/createHeatmapRenderer` 均为 `throw new Error('... not implemented')`；仓库未包含 `body.glb`。 |
| **M6 社区/社交** | 排行榜/挑战/分享/小组 | **缺失** | 无相关页面或接口。 |
| **M7 管理后台** | 用户/设备/报告管理、数据导出 | **缺失** | 无 admin app 或后台接口。 |

## 架构/非功能项覆盖度

| 需求项 | 状态 | 说明 |
| --- | --- | --- |
| pnpm monorepo + Turbo | **完成** | `pnpm-workspace.yaml`、`turbo.json`、`package.json` workspaces 已配置。 |
| 共享类型/常量 | **部分完成** | `packages/shared` 已提供 `types.ts`、`mock.ts`、`constants.ts`、`dto.ts`；但部分类型与真实页面不完全一致。 |
| UI 组件库 | **部分完成** | `packages/ui` 提供 `Button`、`Card`、`ScoreRing`、`theme`；仅被少量页面引用。 |
| NIRS SDK | **接口完成/实现缺失** | `packages/nirs-sdk` 提供完整 BLE/数据流/配网/模拟器类型与 `MockNirsStream`、`NirsRateLimiter`、`NirsSimulator`；但真实平台实现仍是 TODO。 |
| 恢复算法包 | **骨架完成** | `packages/recovery-algo` 入口只导出 `score.ts` 和 `recommend.ts`；`fatigue.ts`、`recommendation.ts`、`massage.ts` 存在但未被导出。 |
| 健康数据适配器 | **缺失** | `packages/health-adapter` 只有 `package.json`，无源码。 |
| 后端 API 网关 | **部分完成** | NestJS 模块结构（auth/users/devices/scans/reports/massage/health）已搭建；但缺少全局 JWT Guard、Prisma 真实数据库连接、Swagger 文档。 |
| 数据库/ORM | **阻塞** | `prisma/schema.prisma` 没有 `url = env("DATABASE_URL")`；Prisma 7.x 需要 `@prisma/adapter-sqlite` + `better-sqlite3` 或 `libsql`。 |
| 离线模式 | **缺失** | 移动端无离线缓存策略。 |
| iOS 原生风格 UI | **部分完成** | 颜色、字体、ScoreRing、Card 已按 iOS 风格设计；页面数量不足。 |

## 下一步建议

1. **解除后端阻塞**：为 Prisma 配置 `DATABASE_URL` 与 SQLite driver adapter，补 `prisma/migrations`，让 `pnpm db:migrate` 可跑通。
2. **移动端 API 接线**：用 `apps/mobile/src/api/*` 替换页面中的 mock，先打通登录 -> 扫描 -> 报告 -> 历史闭环。
3. **算法闭环**：`ReportsService` 调用 `recovery-algo`，`ScansService` 在保存扫描时触发报告生成。
4. **3D 模型落地**：将 `body.glb` 纳入仓库外存储或 LFS，并让 `packages/muscle-3d` 提供 Three.js 实现，替换 web-3d 中的简化圆柱体。
5. **硬件 SDK 实现**：在 `packages/nirs-sdk` 中补充 `react-native-ble-plx` 适配器或 Web Bluetooth 适配器。
6. **补齐缺失模块**：社区、管理后台、离线缓存、设备校准、恢复计划进度跟踪。
