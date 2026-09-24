import { useState } from 'react'
import { Shield } from 'lucide-react'

const VARIANTS = {
  xl: {
    box: 'w-36 h-36 sm:w-44 sm:h-44 rounded-[2rem] sm:rounded-[2.5rem]',
    icon: 'w-20 h-20 sm:w-24 sm:h-24'
  },
  lg: {
    box: 'w-24 h-24 sm:w-28 sm:h-28 rounded-3xl',
    icon: 'w-14 h-14 sm:w-16 sm:h-16'
  },
  md: {
    box: 'w-9 h-9 rounded-xl',
    icon: 'w-5 h-5'
  },
  sm: {
    box: 'w-8 h-8 rounded-lg',
    icon: 'w-4 h-4'
  }
}

/**
 * FixMyCity brand mark.
 * If client/public/logo.png exists it fills the whole tile edge-to-edge
 * (no double frame); otherwise falls back to the gradient Shield mark.
 */
export default function BrandLogo({
  variant = 'md',
  src = '/logo.png',
  showWordmark = false,
  wordmarkClassName = '',
  className = '',
  linkClassName = ''
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const v = VARIANTS[variant] || VARIANTS.md

  const mark = (
    <div
      className={`${v.box} overflow-hidden flex items-center justify-center flex-shrink-0 ${
        imgFailed ? 'bg-gradient-to-br from-cyan-500 to-purple-600 shadow-md' : 'bg-transparent'
      } ${className}`}
      aria-hidden="true"
    >
      {!imgFailed ? (
        <img
          src={src}
          alt=""
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <Shield className={`${v.icon} text-white`} />
      )}
    </div>
  )

  if (!showWordmark) return mark

  return (
    <span className={`inline-flex items-center gap-3 ${linkClassName}`}>
      {mark}
      <span className={wordmarkClassName}>FixMyCity</span>
    </span>
  )
}
