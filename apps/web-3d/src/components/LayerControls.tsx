import { LayerKey, getLayerLabel } from '../muscleData'

interface LayerControlsProps {
  layer: LayerKey
  onChange: (layer: LayerKey) => void
}

const layers: LayerKey[] = ['composite', 'oxygenation', 'perfusion', 'thermal', 'mechanical']

export function LayerControls({ layer, onChange }: LayerControlsProps) {
  return (
    <div className="layer-controls">
      {layers.map((key) => (
        <button
          key={key}
          className={`layer-btn ${layer === key ? 'active' : ''}`}
          onClick={() => onChange(key)}
        >
          {getLayerLabel(key)}
        </button>
      ))}
    </div>
  )
}
