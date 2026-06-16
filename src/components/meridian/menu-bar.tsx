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
        borderColor: 'rgba(0,180,220,0.12)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center px-3 h-full border-r" style={{ borderColor: 'rgba(0,180,220,0.12)' }}>
        <span className="text-[11px] tracking-[0.3em] font-bold" style={{ color: '#00b4dc' }}>
          MERIDIAN
        </span>
        <span className="text-[9px] tracking-[0.15em] ml-1.5" style={{ color: '#3a4553' }}>
          RUNTIME
        </span>
      </div>

      {/* Menu items */}
      <div className="flex items-center h-full">
        {Object.entries(MENU_ITEMS).map(([menu, items]) => (
          <div key={menu} className="relative h-full">
            <button
              className="h-full px-3 text-[11px] tracking-[0.1em] transition-colors"
              style={{
                color: activeMenu === menu ? '#00b4dc' : '#5a6578',
                background: activeMenu === menu ? 'rgba(0,180,220,0.06)' : 'transparent',
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
                  borderColor: 'rgba(0,180,220,0.2)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                }}
              >
                {items.map((item, idx) =>
                  item === '---' ? (
                    <div key={idx} className="h-px my-1" style={{ background: 'rgba(0,180,220,0.1)' }} />
                  ) : (
                    <button
                      key={idx}
                      className="w-full text-left px-4 py-1.5 text-[11px] tracking-[0.05em] transition-colors"
                      style={{ color: '#8a94a3' }}
                      onMouseEnter={(e) => {
                        ;(e.target as HTMLElement).style.color = '#c8d0dc'
                        ;(e.target as HTMLElement).style.background = 'rgba(0,180,220,0.08)'
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
        <div className="h-3 w-px" style={{ background: 'rgba(0,180,220,0.12)' }} />
        <span className="text-[9px] tracking-[0.1em]" style={{ color: '#3a4553' }}>3.2 evt/s</span>
        <div className="h-3 w-px" style={{ background: 'rgba(0,180,220,0.12)' }} />
        <span className="text-[9px] tracking-[0.1em]" style={{ color: '#ffa500' }}>$2.41/hr</span>
      </div>
    </div>
  )
}
