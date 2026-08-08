/**
 * TI 腿部恢复智能系统 — Web 3D 可视化入口
 *
 * 当前为骨架阶段，导出 3D 查看器组件与配置类型。
 * 运行时通过 packages/muscle-3d 从本地路径加载 body.glb。
 */

export { default as MuscleViewerPage } from './MuscleViewerPage';
export type { Web3DViewerProps, ViewerConfig } from './types';
