'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Star {
  x: number
  y: number
  radius: number
  baseOpacity: number
  twinkleSpeed: number
  twinklePhase: number
}

interface ShootingStar {
  x: number
  y: number
  angle: number
  speed: number
  length: number
  opacity: number
  life: number
  maxLife: number
  particles: Particle[]
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  radius: number
}

export function StarfieldBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const shootingRef = useRef<ShootingStar[]>([])
  const frameRef = useRef<number>(0)
  const lastShootRef = useRef<number>(0)
  const nextShootRef = useRef<number>(8000 + Math.random() * 7000)

  const initStars = useCallback((width: number, height: number) => {
    const count = Math.floor((width * height) / 8000)
    const stars: Star[] = []
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.2 + 0.3,
        baseOpacity: Math.random() * 0.4 + 0.1,
        twinkleSpeed: Math.random() * 0.8 + 0.2,
        twinklePhase: Math.random() * Math.PI * 2,
      })
    }
    starsRef.current = stars
  }, [])

  const spawnShootingStar = useCallback((width: number, height: number) => {
    const startX = Math.random() * width * 0.8
    const startY = Math.random() * height * 0.4
    shootingRef.current.push({
      x: startX,
      y: startY,
      angle: Math.PI * 0.15 + Math.random() * 0.2,
      speed: 4 + Math.random() * 3,
      length: 40 + Math.random() * 30,
      opacity: 0.7 + Math.random() * 0.3,
      life: 0,
      maxLife: 40 + Math.random() * 20,
      particles: [],
    })
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars(canvas.width, canvas.height)
    }

    resize()
    window.addEventListener('resize', resize)

    let lastTime = 0
    const FPS_INTERVAL = 1000 / 30

    const render = (timestamp: number) => {
      frameRef.current = requestAnimationFrame(render)

      const delta = timestamp - lastTime
      if (delta < FPS_INTERVAL) return
      lastTime = timestamp - (delta % FPS_INTERVAL)

      const w = canvas.width
      const h = canvas.height

      ctx.clearRect(0, 0, w, h)

      // Draw stars with twinkling
      const time = timestamp * 0.001
      for (const star of starsRef.current) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase)
        const opacity = star.baseOpacity + twinkle * 0.15
        const clampedOpacity = Math.max(0.02, Math.min(0.6, opacity))

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180, 210, 240, ${clampedOpacity})`
        ctx.fill()

        // Subtle glow for brighter stars
        if (star.radius > 1 && clampedOpacity > 0.3) {
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(140, 190, 230, ${clampedOpacity * 0.15})`
          ctx.fill()
        }
      }

      // Shooting stars
      if (timestamp - lastShootRef.current > nextShootRef.current) {
        spawnShootingStar(w, h)
        lastShootRef.current = timestamp
        nextShootRef.current = 8000 + Math.random() * 12000
      }

      const remainingShooting: ShootingStar[] = []
      for (const ss of shootingRef.current) {
        ss.life++
        const progress = ss.life / ss.maxLife

        if (progress < 0.8) {
          // Main streak
          ss.x += Math.cos(ss.angle) * ss.speed
          ss.y += Math.sin(ss.angle) * ss.speed

          const fadeOpacity = ss.opacity * (1 - progress / 0.8)

          const tailX = ss.x - Math.cos(ss.angle) * ss.length
          const tailY = ss.y - Math.sin(ss.angle) * ss.length

          const gradient = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y)
          gradient.addColorStop(0, `rgba(200, 230, 255, 0)`)
          gradient.addColorStop(0.6, `rgba(200, 230, 255, ${fadeOpacity * 0.4})`)
          gradient.addColorStop(1, `rgba(220, 240, 255, ${fadeOpacity})`)

          ctx.beginPath()
          ctx.moveTo(tailX, tailY)
          ctx.lineTo(ss.x, ss.y)
          ctx.strokeStyle = gradient
          ctx.lineWidth = 1.5
          ctx.stroke()

          // Head glow
          ctx.beginPath()
          ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(220, 240, 255, ${fadeOpacity * 0.8})`
          ctx.fill()

          remainingShooting.push(ss)
        } else if (progress >= 0.8 && ss.particles.length === 0) {
          // Spawn burst particles
          for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2
            const speed = 0.5 + Math.random() * 1.5
            ss.particles.push({
              x: ss.x,
              y: ss.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed,
              life: 0,
              maxLife: 15 + Math.random() * 10,
              radius: 0.5 + Math.random() * 1,
            })
          }
          remainingShooting.push(ss)
        }

        // Draw particles
        const remainingParticles: Particle[] = []
        for (const p of ss.particles) {
          p.life++
          p.x += p.vx
          p.y += p.vy
          p.vx *= 0.96
          p.vy *= 0.96
          const pProgress = p.life / p.maxLife
          if (pProgress < 1) {
            const pOpacity = (1 - pProgress) * 0.6
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.radius * (1 - pProgress * 0.5), 0, Math.PI * 2)
            ctx.fillStyle = `rgba(180, 210, 240, ${pOpacity})`
            ctx.fill()
            remainingParticles.push(p)
          }
        }
        ss.particles = remainingParticles

        if (ss.particles.length > 0 || progress < 1) {
          if (!remainingShooting.includes(ss)) {
            remainingShooting.push(ss)
          }
        }
      }
      shootingRef.current = remainingShooting
    }

    frameRef.current = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frameRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [initStars, spawnShootingStar])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: '#030508' }}
    />
  )
}
