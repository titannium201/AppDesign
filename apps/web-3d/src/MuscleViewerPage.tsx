import React from 'react';
import type { Web3DViewerProps } from './types';

/**
 * 3D 肌肉查看页面（骨架）
 *
 * TODO: 接入 @app/muscle-3d 的 ModelLoader 与 HeatmapRenderer。
 */
export default function MuscleViewerPage(_props: Web3DViewerProps) {
  return (
    <div style={{ padding: 24 }}>
      <h1>3D 肌肉可视化</h1>
      <p>Web 3D 查看器骨架已就绪，等待接入 muscle-3d 渲染器。</p>
    </div>
  );
}
