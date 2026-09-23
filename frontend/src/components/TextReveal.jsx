import { useEffect, useRef, useState } from 'react'

/**
 * TextReveal component implements an Apple-style, scroll-triggered smooth text reveal animation.
 * 
 * Baseline hidden state: opacity 0, translateY(30px)
 * Revealed state: opacity 1, translateY(0px)
 * Exit boundary: smoothly reverses/fades out as elements scroll out of viewport
 * Easing: power2.out equivalent (cubic-bezier(0.215, 0.61, 0.355, 1))
 * FOUC protection: loading state safeguard prevents initial content flashing
 * 
 * Can also use CSS-based reveal by adding `reveal` class and using IntersectionObserver separately
 */
export default function TextReveal({
  children,
  as: Component = 'div',
  className = '',
  style = {},
  delay = 0,
  staggerIndex = 0,
  staggerStep = 0.08,
  threshold = 0.1,
  reverseOnExit = true,
  useCSS = false,
  revealDirection = 'up', // 'up', 'left', 'right', 'scale'
  ...props
}) {
  const ref = useRef(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const node = ref.current
    if (!node) return

    if (useCSS) {
      // CSS-based approach - just add the class when mounted
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            node.classList.add('active')
          } else if (reverseOnExit && entry.boundingClientRect.top > 0) {
            node.classList.remove('active')
          }
        },
        {
          threshold: 0,
          rootMargin: '0px 0px -50px 0px',
        }
      )
      observer.observe(node)
      return () => observer.disconnect()
    }

    // JS-based approach (original)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true)
        } else if (reverseOnExit && entry.boundingClientRect.top > 0) {
          setIsRevealed(false)
        }
      },
      {
        threshold: 0,
        rootMargin: '0px 0px -20px 0px',
      }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [threshold, reverseOnExit, useCSS])

  const computedDelay = typeof delay === 'number' && delay > 0 ? delay : staggerIndex * staggerStep

  // CSS class mapping for reveal direction
  const revealClasses = {
    up: 'reveal',
    left: 'reveal-left',
    right: 'reveal-right',
    scale: 'reveal-scale',
  }

  const baseClass = useCSS ? revealClasses[revealDirection] : ''

  if (useCSS) {
    return (
      <Component
        ref={ref}
        className={`${baseClass} ${className}`}
        style={style}
        {...props}
      >
        {children}
      </Component>
    )
  }

  const animStyle = {
    opacity: isRevealed ? 1 : 0,
    transform: isRevealed ? 'translateY(0px)' : 'translateY(30px)',
    transition: `opacity 0.85s cubic-bezier(0.215, 0.61, 0.355, 1) ${computedDelay}s, transform 0.85s cubic-bezier(0.215, 0.61, 0.355, 1) ${computedDelay}s`,
    willChange: 'opacity, transform',
    backfaceVisibility: 'hidden',
    visibility: isMounted ? 'visible' : 'hidden',
    ...style,
  }

  return (
    <Component ref={ref} className={className} style={animStyle} {...props}>
      {children}
    </Component>
  )
}

/**
 * TextGroupReveal component to automatically stagger direct text/content children.
 */
export function TextGroupReveal({
  children,
  as: Component = 'div',
  className = '',
  style = {},
  staggerStep = 0.08,
  useCSS = false,
  revealDirection = 'up',
  ...props
}) {
  return (
    <Component className={className} style={style} {...props}>
      {Array.isArray(children)
        ? children.map((child, idx) => (
            <TextReveal
              key={idx}
              staggerIndex={idx}
              staggerStep={staggerStep}
              useCSS={useCSS}
              revealDirection={revealDirection}
            >
              {child}
            </TextReveal>
          ))
        : children}
    </Component>
  )
}

/**
 * Simple fade-in component for basic animations
 */
export function FadeIn({ children, delay = 0, className = '', as: Component = 'div', ...props }) {
  return (
    <Component
      className={`animate-fade-in ${className}`}
      style={{ animationDelay: `${delay}s`, ...props.style }}
      {...props}
    >
      {children}
    </Component>
  )
}

/**
 * Staggered children wrapper
 */
export function StaggeredChildren({ children, staggerStep = 0.1, className = '', as: Component = 'div', ...props }) {
  return (
    <Component className={className} {...props}>
      {Array.isArray(children)
        ? children.map((child, idx) => (
            <FadeIn key={idx} delay={idx * staggerStep}>
              {child}
            </FadeIn>
          ))
        : children}
    </Component>
  )
}