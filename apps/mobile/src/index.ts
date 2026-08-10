/**
 * Mobile 应用库入口
 *
 * 实际启动入口是 apps/mobile/App.tsx（Expo main 指向 expo/AppEntry.js）。
 * 该文件用于导出共享类型/组件，供其他 workspace package 引用。
 */

export { default as App } from './App';
export * from './types';
