import { useState } from 'react'
import { LayerKey, LayerValue } from '../muscleData'
import { Model } from './Model'

interface MuscleSceneProps {
  modelPath: string
  layer: LayerKey
  layerData: Record<string, LayerValue>
  onSelect: (id: string) => void
}

export function MuscleScene({
  modelPath,
  layer,
  layerData,
  onSelect,
}: MuscleSceneProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <Model
      path={modelPath}
      layer={layer}
      layerData={layerData}
      hovered={hovered}
      onHover={setHovered}
      onSelect={onSelect}
    />
  )
}
