# AppDesign — 肌肉恢复智能系统

统一代码仓库（monorepo），包含 TI 腿部恢复智能系统的移动端 App、3D 可视化、共享模块、后端服务等。

## 目录结构

```
AppDesign/
├── apps/
│   ├── mobile/          # React Native (Expo) 移动端 App
│   ├── web-3d/          # 3D 肌肉模型与热力图 Web 组件
│   └── admin/           # 后台管理（预留）
├── packages/
│   ├── ui/              # 跨端 UI 组件库
│   ├── shared/          # 类型、常量、工具函数
│   ├── muscle-3d/       # 3D 模型加载与渲染接口
│   ├── nirs-sdk/        # NIRS / mm-DOSI 数据协议
│   └── recovery-algo/   # 恢复评分算法
├── services/            # 后端服务
├── docs/                # PRD、技术文档
├── references/          # 参考资料、硬件 demo
└── scripts/             # 脚本工具
```

## 快速开始

```bash
pnpm install
pnpm --filter @app/mobile start
```

## 开发要求

- Node >= 20
- pnpm >= 9
- iOS 开发需要 macOS + Xcode
