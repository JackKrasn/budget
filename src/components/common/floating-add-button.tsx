import { Plus } from 'lucide-react'
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useRef, useState } from 'react'

interface FloatingAddButtonProps {
  onClick?: () => void
  className?: string
}

export function FloatingAddButton({ onClick, className }: FloatingAddButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  // Mouse position for magnetic effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Spring config for smooth magnetic movement
  const springConfig = { damping: 25, stiffness: 300 }
  const x = useSpring(useTransform(mouseX, [-50, 50], [-8, 8]), springConfig)
  const y = useSpring(useTransform(mouseY, [-50, 50], [-8, 8]), springConfig)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    mouseX.set(e.clientX - centerX)
    mouseY.set(e.clientY - centerY)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <motion.div
      className={cn('fixed bottom-6 right-6 z-50', className)}
      style={{ x, y }}
    >
      {/* Ambient glow layers */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{
          scale: isHovered ? [1, 1.4, 1.2] : [1, 1.15, 1],
          opacity: isHovered ? [0.6, 0.9, 0.7] : [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Rotating ring accent */}
      <motion.div
        className="absolute -inset-1 rounded-full"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(16,185,129,0.5) 10%, transparent 20%, transparent 100%)',
        }}
        animate={{
          rotate: 360,
          scale: isHovered ? 1.15 : 1,
        }}
        transition={{
          rotate: {
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          },
          scale: {
            duration: 0.3,
          },
        }}
      />

      {/* Main button */}
      <motion.button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        initial={{ scale: 0, opacity: 0, rotate: -180 }}
        animate={{
          scale: 1,
          opacity: 1,
          rotate: 0,
        }}
        whileTap={{ scale: 0.92 }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: 0.1,
        }}
        className={cn(
          'relative flex h-14 w-14 items-center justify-center rounded-full',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
        style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
          boxShadow: isHovered
            ? '0 8px 32px rgba(16,185,129,0.5), 0 4px 16px rgba(5,150,105,0.4), inset 0 1px 1px rgba(255,255,255,0.2)'
            : '0 4px 20px rgba(16,185,129,0.35), 0 2px 8px rgba(5,150,105,0.25), inset 0 1px 1px rgba(255,255,255,0.15)',
        }}
        aria-label="Добавить расход"
      >
        {/* Inner shine effect */}
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)',
          }}
        />

        {/* Ripple effect on press */}
        {isPressed && (
          <motion.div
            className="absolute inset-0 rounded-full"
            initial={{ scale: 0.5, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)',
            }}
          />
        )}

        {/* Plus icon with rotation on hover */}
        <motion.div
          animate={{
            rotate: isHovered ? 90 : 0,
            scale: isHovered ? 1.1 : 1,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
        >
          <Plus
            className="h-6 w-6 text-white drop-shadow-sm"
            strokeWidth={2.5}
          />
        </motion.div>

        {/* Floating particles on hover */}
        {isHovered && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-emerald-200"
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 0.8,
                  scale: 0,
                }}
                animate={{
                  x: [0, (i - 1) * 25],
                  y: [0, -30 - i * 10],
                  opacity: [0.8, 0],
                  scale: [0, 1, 0.5],
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.1,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </motion.button>
    </motion.div>
  )
}
