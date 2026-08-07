import { useEffect, useState } from 'react'
import { WorkflowScene } from './workflow-scene'

export function HeroScene() {
  const [reducedMotion, setReducedMotion] = useState(false)
  useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReducedMotion(media.matches); update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update) }, [])
  return <WorkflowScene reducedMotion={reducedMotion} />
}
