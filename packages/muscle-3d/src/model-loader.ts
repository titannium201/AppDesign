/**
 * body.glb 模型加载器接口
 *
 * GLB 大文件不进入仓库，运行时从本地路径加载。
 */

import type { ModelLoadOptions, ModelScene } from './types';

/**
 * 模型加载器接口
 *
 * 由具体渲染引擎（Three.js / Babylon.js）实现。
 */
export interface ModelLoader {
  /**
   * 加载 body.glb 并返回模型场景
   * @param options 加载选项
   */
  load(options: ModelLoadOptions): Promise<ModelScene>;

  /** 释放模型资源 */
  dispose(scene: ModelScene): void;
}

/**
 * 创建模型加载器
 *
 * TODO: 根据渲染引擎返回具体实现。
 */
export function createModelLoader(_engine: 'three' | 'babylon'): ModelLoader {
  throw new Error('createModelLoader not implemented');
}

/**
 * 推荐本地模型路径
 *
 * 开发环境默认指向仓库外的肌肉建模原版目录。
 */
export function getDefaultModelPath(): string {
  // Windows 开发路径
  return 'G:\\Xbotpark\\赵宇轩\\软件设计\\肌肉建模_原版\\public\\body.glb';
}
