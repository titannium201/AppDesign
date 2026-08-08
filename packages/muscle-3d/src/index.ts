/**
 * @app/muscle-3d — 3D 肌肉模型与热力图渲染（接口定义）
 *
 * 本包不包含 GLB 大文件，仅提供：
 * - 本地 body.glb 加载器接口
 * - 肌肉元数据结构
 * - 热力图数据结构与渲染接口
 * - 相机/视图控制接口
 */

export * from './types';
export * from './model-loader';
export * from './muscle-registry';
export * from './heatmap';
export * from './camera';
