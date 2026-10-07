"use client"

import { useEffect, useId, useState, type RefObject } from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

export interface AnimatedBeamProps {
  className?: string
  containerRef: RefObject<HTMLElement | null>
  fromRef: RefObject<HTMLElement | null>
  toRef: RefObject<HTMLElement | null>
  curvature?: number
  reverse?: boolean
  pathColor?: string
  pathWidth?: number
  pathOpacity?: number
  gradientStartColor?: string
  gradientStopColor?: string
  delay?: number
  duration?: number
  repeat?: number
  repeatDelay?: number
  startXOffset?: number
  startYOffset?: number
  endXOffset?: number
  endYOffset?: number
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = 5,
  delay = 0,
  pathColor = "gray",
  pathWidth = 2,
  pathOpacity = 0.2,
  gradientStartColor = "#ffaa40",
  gradientStopColor = "#9c40ff",
  repeat = Infinity,
  repeatDelay = 0,
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}) => {
  const id = useId()
  const [pathD, setPathD] = useState("")
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 })
  const [pathCoords, setPathCoords] = useState({ sx: 0, sy: 0, ex: 0, ey: 0 })

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect()
        const rectA = fromRef.current.getBoundingClientRect()
        const rectB = toRef.current.getBoundingClientRect()

        const svgWidth = containerRect.width
        const svgHeight = containerRect.height
        setSvgDimensions({ width: svgWidth, height: svgHeight })

        const startX =
          rectA.left - containerRect.left + rectA.width / 2 + startXOffset
        const startY =
          rectA.top - containerRect.top + rectA.height / 2 + startYOffset
        const endX =
          rectB.left - containerRect.left + rectB.width / 2 + endXOffset
        const endY =
          rectB.top - containerRect.top + rectB.height / 2 + endYOffset

        const controlY = startY - curvature
        const d = `M ${startX},${startY} Q ${
          (startX + endX) / 2
        },${controlY} ${endX},${endY}`
        setPathD(d)
        setPathCoords({ sx: startX, sy: startY, ex: endX, ey: endY })
      }
    }

    const resizeObserver = new ResizeObserver(() => {
      updatePath()
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    updatePath()

    return () => {
      resizeObserver.disconnect()
    }
  }, [
    containerRef,
    fromRef,
    toRef,
    curvature,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
  ])

  // Compute gradient direction aligned with the actual beam path.
  // The gradient "comet" travels along the beam: center → outer node.
  const { sx, sy, ex, ey } = pathCoords
  const dx = ex - sx
  const dy = ey - sy
  const pathLen = Math.sqrt(dx * dx + dy * dy) || 1
  const nx = dx / pathLen
  const ny = dy / pathLen
  // Gradient band spans 45% of path length; bright zone is at the leading 16%
  const gradLen = pathLen * 0.45
  const brightOff = gradLen * 0.16

  // Forward: comet travels from (sx,sy) to (ex,ey)
  // Reverse: comet travels from (ex,ey) back to (sx,sy)
  const gradientCoordinates = reverse
    ? {
        x1: [ex - brightOff * nx, sx - brightOff * nx],
        y1: [ey - brightOff * ny, sy - brightOff * ny],
        x2: [ex + (gradLen - brightOff) * nx, sx + (gradLen - brightOff) * nx],
        y2: [ey + (gradLen - brightOff) * ny, sy + (gradLen - brightOff) * ny],
      }
    : {
        x1: [sx - brightOff * nx, ex - brightOff * nx],
        y1: [sy - brightOff * ny, ey - brightOff * ny],
        x2: [sx + (gradLen - brightOff) * nx, ex + (gradLen - brightOff) * nx],
        y2: [sy + (gradLen - brightOff) * ny, ey + (gradLen - brightOff) * ny],
      }

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "pointer-events-none absolute top-0 left-0 transform-gpu stroke-2",
        className
      )}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />
      <path
        d={pathD}
        strokeWidth={pathWidth}
        stroke={`url(#${id})`}
        strokeOpacity="1"
        strokeLinecap="round"
      />
      <defs>
        <motion.linearGradient
          className="transform-gpu"
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{
            x1: gradientCoordinates.x1[0],
            y1: gradientCoordinates.y1[0],
            x2: gradientCoordinates.x2[0],
            y2: gradientCoordinates.y2[0],
          }}
          animate={{
            x1: gradientCoordinates.x1,
            y1: gradientCoordinates.y1,
            x2: gradientCoordinates.x2,
            y2: gradientCoordinates.y2,
          }}
          transition={{
            delay,
            duration,
            ease: [0.4, 0, 0.55, 1],
            repeat,
            repeatDelay,
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0"></stop>
          <stop stopColor={gradientStartColor}></stop>
          <stop offset="32.5%" stopColor={gradientStopColor}></stop>
          <stop
            offset="100%"
            stopColor={gradientStopColor}
            stopOpacity="0"
          ></stop>
        </motion.linearGradient>
      </defs>
    </svg>
  )
}
