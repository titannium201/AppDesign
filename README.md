# 肌肉恢复智能系统 — AppDesign

统一代码仓库，包含 iOS 风格 App、3D 肌肉可视化、NIRS 硬件接入、疲劳评估算法与后端服务。

## 项目结构

```
AppDesign/
├── apps/
│   ├── mobile/          # React Native / Expo App（iOS 风格）
│   ├── web-3d/          # 3D 肌肉可视化 Web（可内嵌 App）
│   └── admin/           # 后台管理系统（可选）
├── packages/
│   ├── ui/              # 跨端 iOS 风格 UI 组件库
│   ├── muscle-3d/       # 3D 肌肉模型与热力图渲染
│   ├── nirs-sdk/        # NIRS BLE 通信 SDK
│   ├── recovery-algo/   # 疲劳评估与恢复算法
│   ├── health-adapter/  # 第三方健康数据适配器
│   └── shared/          # 类型、常量、工具函数
├── services/
│   ├── api-gateway/     # NestJS 后端 API
│   └── algo-service/    # 算法微服务（可选）
├── docs/                # 文档
└── scripts/             # 脚本工具
```

## 快速开始

```bash
# 1. 安装 pnpm（如未安装）
npm install -g pnpm

# 2. 安装依赖
pnpm install

# 3. 启动各应用
pnpm dev
```

## 开发规范

- 使用 TypeScript，尽量减少 `any`。
- 遵循 iOS 设计规范与项目 ESLint/Prettier 配置。
- 每次提交前执行 `pnpm lint` 与 `pnpm typecheck`。
- 详见 `docs/adr/` 架构决策记录。

## 分支策略

- `main`：稳定分支
- `develop`：日常集成
- `feature/<模块>-<描述>`：功能分支
- `fix/<描述>`：修复分支
