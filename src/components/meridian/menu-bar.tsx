'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMeridianStore } from '@/store/meridian-store'

const MENU_ITEMS = {
  File: ['New Workflow', 'New Agent', 'Import Configuration', 'Export Session', 'SSH Connect', '---', 'Quit'],
  Edit: ['Preferences', 'Provider Configuration', 'Model Selection', 'Layout Editor', '---', 'Clear Session'],
  View: ['Toggle Clock', 'Toggle Heatmap', 'Toggle Network', 'Reset Layout', '---', 'Compact Mode', 'Cinematic Mode', '---', 'Switch to Agent Canvas'],
  Help: ['Documentation', 'Keyboard Shortcuts', 'Architecture Overview', '---', 'About Meridian'],
  About: ['Version 0.1.0', 'Kernel Status', 'License', '---', 'Credits'],
}

export function MenuBar() {
  const router = useRouter()
  const { activeMenu, setActiveMenu } = useMeridianStore()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [setActiveMenu])

  return (
    <div
      ref={menuRef}
      className="flex items-center h-8 shrink-0 border-b select-none"
      style={{
        background: 'rgba(6,9,14,0.95)',
        borderColor: 'rgba(168,85,247,0.12)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center px-3 h-full border-r" style={{ borderColor: 'rgba(168, 85, 247, 0.12)' }}>
        <svg viewBox="0 0 200 200" width="20" height="20" className="mr-2" role="img" aria-label="Volcano icon">
          <defs>
            <linearGradient id="v_rock_menu" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3B2B2A"/>
              <stop offset="0.45" stopColor="#1B1722"/>
              <stop offset="1" stopColor="#4B3A36"/>
            </linearGradient>
            <radialGradient id="v_lavaCore_menu" cx="50%" cy="35%" r="70%">
              <stop offset="0" stopColor="#FFF7C7"/>
              <stop offset="0.32" stopColor="#FFD36A"/>
              <stop offset="1" stopColor="#B40F2D"/>
            </radialGradient>
          </defs>
          <g>
            <path d="M40 160 L72 86 Q78 72 92 70 H108 Q122 72 128 86 L160 160 Z" fill="url(#v_rock_menu)" stroke="rgba(255,255,255,.10)" strokeWidth="1.2"/>
            <path d="M78 92 Q84 80 96 79 H104 Q116 80 122 92 Q110 98 100 98 Q90 98 78 92 Z" fill="rgba(10,12,20,.55)" />
            <path d="M86 92 Q90 86 97 86 H103 Q110 86 114 92 Q108 96 100 96 Q92 96 86 92 Z" fill="url(#v_lavaCore_menu)" opacity=".98"/>
            <path d="M100 97 C98 110 103 116 101 130 C99 144 104 151 102 160" fill="none" stroke="#FF8A2A" strokeWidth="6.5" strokeLinecap="round" opacity=".92"/>
          </g>
        </svg>
        <span className="text-[11px] tracking-[0.3em] font-bold" style={{ color: '#E11D48' }}>
          MERIDIAN RUNTIME
        </span>
      </div>

      {/* Menu items */}
      <div className="flex items-center h-full">
        {Object.entries(MENU_ITEMS).map(([menu, items]) => (
          <div key={menu} className="relative h-full">
            <button
              className="h-full px-3 text-[11px] tracking-[0.1em] transition-colors"
              style={{
                color: activeMenu === menu ? '#a855f7' : '#5a6578',
                background: activeMenu === menu ? 'rgba(168,85,247,0.06)' : 'transparent',
              }}
              onClick={() => setActiveMenu(menu)}
              onMouseEnter={() => { if (activeMenu) setActiveMenu(menu) }}
            >
              {menu}
            </button>

            {/* Dropdown */}
            {activeMenu === menu && (
              <div
                className="absolute top-full left-0 min-w-[200px] z-50 border"
                style={{
                  background: 'rgba(8,13,20,0.98)',
                  borderColor: 'rgba(168,85,247,0.2)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                }}
              >
                {items.map((item, idx) =>
                  item === '---' ? (
                    <div key={idx} className="h-px my-1" style={{ background: 'rgba(168,85,247,0.1)' }} />
                  ) : (
                    <button
                      key={idx}
                      className="w-full text-left px-4 py-1.5 text-[11px] tracking-[0.05em] transition-colors"
                      style={{ color: '#8a94a3' }}
                      onMouseEnter={(e) => {
                        ;(e.target as HTMLElement).style.color = '#c8d0dc'
                        ;(e.target as HTMLElement).style.background = 'rgba(168,85,247,0.08)'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.target as HTMLElement).style.color = '#8a94a3'
                        ;(e.target as HTMLElement).style.background = 'transparent'
                      }}
                      onClick={() => {
                        if (item === 'Switch to Agent Canvas') {
                          router.push('/')
                        }
                        setActiveMenu(null)
                      }}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Kernel status indicator */}
      <div className="ml-auto flex items-center gap-3 px-3 h-full">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5" style={{ background: '#00ff88', boxShadow: '0 0 4px #00ff88' }} />
          <span className="text-[9px] tracking-[0.15em]" style={{ color: '#3a4553' }}>KERNEL</span>
        </div>
        <div className="h-3 w-px" style={{ background: 'rgba(168,85,247,0.12)' }} />
        <span className="text-[9px] tracking-[0.1em]" style={{ color: '#3a4553' }}>3.2 evt/s</span>
        <div className="h-3 w-px" style={{ background: 'rgba(168,85,247,0.12)' }} />
        <span className="text-[9px] tracking-[0.1em]" style={{ color: '#ffa500' }}>$2.41/hr</span>
      </div>
    </div>
  )
}
