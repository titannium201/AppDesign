import { useRef, useMemo, useEffect } from 'react'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { LayerKey, LayerValue, getColorForValue } from '../muscleData'

interface ModelProps {
  path: string
  layer: LayerKey
  layerData: Record<string, LayerValue>
  hovered: string | null
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
}

const DEFAULT_BODY_COLOR = new THREE.Color('#e5e7eb')
const HOVER_EMISSIVE = new THREE.Color('#60a5fa')

export function Model({
  path,
  layer,
  layerData,
  hovered,
  onHover,
  onSelect,
}: ModelProps) {
  const { scene: gltfScene } = useGLTF(path)
  const meshRefs = useRef<Map<string, THREE.Mesh[]>>(new Map())

  // Clone the loaded scene once and duplicate materials so we can tint muscles
  // without mutating the cached GLTF scene.
  const clonedScene = useMemo(() => {
    const clone = gltfScene.clone()
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material = Array.isArray(child.material)
          ? child.material.map((m) => m.clone())
          : child.material.clone()
      }
    })
    return clone
  }, [gltfScene])

  useEffect(() => {
    const map = new Map<string, THREE.Mesh[]>()

    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return

      const name = child.name.toLowerCase()
      const baseName = name.replace(/\.\d+$/, '').replace(/\.(l|r)$/, '')

      if (!map.has(baseName)) map.set(baseName, [])
      map.get(baseName)!.push(child)

      if (!map.has(name)) map.set(name, [])
      if (!map.get(name)!.includes(child)) map.get(name)!.push(child)
    })

    meshRefs.current = map
  }, [clonedScene])

  useFrame(() => {
    meshRefs.current.forEach((meshes, meshId) => {
      const lv = layerData[meshId]
      const isHovered = hovered === meshId
      const isMuscle = !!lv

      meshes.forEach((mesh) => {
        const materials = Array.isArray(mesh.material)
          ? mesh.material
          : [mesh.material]

        materials.forEach((material) => {
          if (!(material instanceof THREE.MeshStandardMaterial)) return

          if (isMuscle) {
            const color = getColorForValue(layer, lv.value)
            material.color.set(color)
            material.emissive.set(isHovered ? HOVER_EMISSIVE : '#000000')
            material.emissiveIntensity = isHovered ? 0.3 : 0
            material.transparent = false
            material.opacity = 1
          } else {
            material.color.set(DEFAULT_BODY_COLOR)
            material.emissive.set('#000000')
            material.emissiveIntensity = 0
            material.transparent = true
            material.opacity = 0.25
          }
        })
      })
    })
  })

  const findMuscleId = (object: THREE.Object3D): string | null => {
    const name = object.name.toLowerCase()
    if (layerData[name]) return name

    const baseName = name.replace(/\.\d+$/, '').replace(/\.(l|r)$/, '')
    if (layerData[baseName]) return baseName

    return null
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const object = e.object as THREE.Mesh
    const hitId = findMuscleId(object)
    if (hitId) onHover(hitId)
  }

  const handlePointerOut = () => {
    onHover(null)
  }

  const handleClick = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const object = e.object as THREE.Mesh
    const hitId = findMuscleId(object)
    if (hitId) onSelect(hitId)
  }

  return (
    <primitive
      object={clonedScene}
      onPointerMove={handlePointerMove}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  )
}
