import { useEffect, useState, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Line, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

function Node({ position, size = 0.22, active = false, color = '#38bdf8' }: { position: [number, number, number]; size?: number; active?: boolean; color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame(({ clock }) => {
    if (meshRef.current && active) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 3 + position[0]) * 0.08
      meshRef.current.scale.set(scale, scale, scale)
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[size, 32, 32]} />
      <meshStandardMaterial
        color={active ? color : '#94a3b8'}
        emissive={active ? color : '#334155'}
        emissiveIntensity={active ? 0.8 : 0.15}
        roughness={0.25}
        metalness={0.9}
      />
    </mesh>
  )
}

function Core() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.18
      ref.current.rotation.y += delta * 0.28
    }
  })
  return (
    <mesh ref={ref} position={[0, 0, 0]}>
      <icosahedronGeometry args={[0.72, 2]} />
      <meshStandardMaterial
        color="#38bdf8"
        emissive="#0284c7"
        emissiveIntensity={0.4}
        wireframe
        roughness={0.15}
        metalness={0.9}
      />
    </mesh>
  )
}

function WorkflowObjects({ reducedMotion }: { reducedMotion: boolean }) {
  const nodes: [number, number, number][] = [
    [-2.2, 1.1, -0.2],
    [-2.4, -0.6, 0.1],
    [2.1, 0.9, -0.2],
    [2.3, -0.8, 0.2],
    [0.1, 1.7, -0.7],
  ]

  const paths = nodes.map((node) => [[0, 0, 0], node] as [[number, number, number], [number, number, number]])

  return (
    <group scale={reducedMotion ? 0.9 : 1}>
      {!reducedMotion ? (
        <Float speed={0.8} rotationIntensity={0.12} floatIntensity={0.25}>
          <Core />
        </Float>
      ) : (
        <Core />
      )}

      {paths.map((path, index) => (
        <Line
          key={index}
          points={path}
          color={index % 2 === 0 ? '#38bdf8' : '#818cf8'}
          lineWidth={1.2}
          transparent
          opacity={0.65}
        />
      ))}

      {nodes.map((node, index) => (
        <Node
          key={index}
          position={node}
          active={index === 0 || index === 2 || index === 4}
          color={index === 0 ? '#38bdf8' : index === 2 ? '#34d399' : '#a78bfa'}
        />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
        <circleGeometry args={[3.5, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.04} />
      </mesh>
    </group>
  )
}

export function WorkflowScene({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const [webgl, setWebgl] = useState(true)

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      setWebgl(Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))))
    } catch {
      setWebgl(false)
    }
  }, [])

  if (!webgl) return <div aria-hidden="true" className="workflow-scene-fallback" />

  return (
    <div className="h-full min-h-[390px] w-full" aria-hidden="true">
      <Canvas dpr={[1, 1.6]} gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 6.6]} fov={36} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 6, 5]} intensity={2.5} color="#ffffff" />
        <pointLight position={[-4, -3, 3]} intensity={5} color="#38bdf8" />
        <pointLight position={[3, 4, -2]} intensity={4} color="#818cf8" />
        <WorkflowObjects reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  )
}
