import { Suspense, useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Html } from '@react-three/drei'
import { MuscleScene } from './components/MuscleScene'
import { LayerControls } from './components/LayerControls'
import { DetailPanel } from './components/DetailPanel'
import { ErrorBoundary } from './components/ErrorBoundary'
import { loadLegMuscles, generateMockLayerData, LayerKey } from './muscleData'
import { resolveModelUrl } from './modelUrl'
import './styles.css'

export function MuscleViewerPage() {
  const rawModelPath = import.meta.env.VITE_MODEL_PATH as string | undefined
  const modelPath = useMemo(() => resolveModelUrl(rawModelPath), [rawModelPath])

  const [layer, setLayer] = useState<LayerKey>('composite')
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null)
  const [muscleMap, setMuscleMap] = useState<
    Record<string, { region: string; baseName: string }>
  >({})
  const [metadataStatus, setMetadataStatus] = useState<'loading' | 'error' | 'ok'>('loading')
  const [metadataError, setMetadataError] = useState<string | null>(null)

  useEffect(() => {
    loadLegMuscles()
      .then((muscles) => {
        const map: Record<string, { region: string; baseName: string }> = {}
        muscles.forEach((m) => {
          map[m.meshId] = { region: m.region, baseName: m.baseName }
        })
        setMuscleMap(map)
        setMetadataStatus('ok')
      })
      .catch((err) => {
        setMetadataError(String(err))
        setMetadataStatus('error')
      })
  }, [])

  const layerData = useMemo(
    () => generateMockLayerData(Object.keys(muscleMap), layer),
    [muscleMap, layer]
  )

  const modelErrorMessage = (
    <div className="overlay error">
      <strong>3D 模型加载失败</strong>
      <p>请确认 .env.local 中的 VITE_MODEL_PATH 指向本地 body.glb：</p>
      <pre>VITE_MODEL_PATH=G:/Xbotpark/赵宇轩/软件设计/肌肉建模_二创版/public/models/body.glb</pre>
      <p>或备选：</p>
      <pre>VITE_MODEL_PATH=G:/Xbotpark/赵宇轩/软件设计/肌肉建模_原版/public/models/body.glb</pre>
    </div>
  )

  return (
    <div className="viewer-page">
      <header className="viewer-header">
        <h1>TI 腿部恢复 · 3D 肌肉可视化</h1>
        <LayerControls layer={layer} onChange={setLayer} />
      </header>

      <main className="viewer-main">
        {metadataStatus === 'loading' && (
          <div className="overlay">加载肌肉元数据...</div>
        )}
        {metadataStatus === 'error' && (
          <div className="overlay error">{metadataError}</div>
        )}

        {modelPath ? (
          <ErrorBoundary fallback={modelErrorMessage}>
            <Canvas className="viewer-canvas" shadows>
              <PerspectiveCamera makeDefault position={[0, 0.9, 2.5]} fov={45} />
              <OrbitControls target={[0, 0.8, 0]} minDistance={0.5} maxDistance={5} />
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 7]} intensity={1.2} castShadow />

              <Suspense
                fallback={
                  <Html center>
                    <div className="overlay">加载 3D 模型...</div>
                  </Html>
                }
              >
                <MuscleScene
                  modelPath={modelPath}
                  layer={layer}
                  layerData={layerData}
                  onSelect={setSelectedMuscle}
                />
              </Suspense>
            </Canvas>
          </ErrorBoundary>
        ) : (
          <div className="centered-message">
            <h2>3D 肌肉可视化</h2>
            <p>请在 <code>apps/web-3d/.env.local</code> 中配置本地模型路径：</p>
            <pre>VITE_MODEL_PATH=G:/Xbotpark/赵宇轩/软件设计/肌肉建模_二创版/public/models/body.glb</pre>
            <p>备选路径：</p>
            <pre>VITE_MODEL_PATH=G:/Xbotpark/赵宇轩/软件设计/肌肉建模_原版/public/models/body.glb</pre>
          </div>
        )}

        <DetailPanel
          muscleId={selectedMuscle}
          muscleInfo={selectedMuscle ? muscleMap[selectedMuscle] : undefined}
          score={selectedMuscle ? layerData[selectedMuscle] : undefined}
          onClose={() => setSelectedMuscle(null)}
        />
      </main>
    </div>
  )
}
