import { LayerValue } from '../muscleData'

interface DetailPanelProps {
  muscleId: string | null
  muscleInfo?: { region: string; baseName: string }
  score?: LayerValue
  onClose: () => void
}

export function DetailPanel({ muscleId, muscleInfo, score, onClose }: DetailPanelProps) {
  if (!muscleId || !muscleInfo) return null

  const status = score && score.score >= 80 ? '良好' : score && score.score >= 60 ? '轻度疲劳' : '需要恢复'

  return (
    <div className="detail-panel">
      <button className="close-btn" onClick={onClose}>×</button>
      <h3>{muscleInfo.baseName}</h3>
      <p className="region">部位：{muscleInfo.region}</p>
      {score && (
        <>
          <div className="score-row">
            <span className="score-value">{score.score}</span>
            <span className="score-label">恢复评分</span>
          </div>
          <p className="status">状态：{status}</p>
          <ul className="advice">
            <li>建议进行 10-15 分钟低强度恢复训练</li>
            <li>可配合局部热敷或按摩</li>
            <li>下次高强度训练前关注该肌群评分变化</li>
          </ul>
        </>
      )}
    </div>
  )
}
