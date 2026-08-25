import React from 'react'

export function Facebook({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}

export function LineIcon({ 
  className = "w-5 h-5", 
  bubbleColor = "white", 
  textColor = "#06C755", 
  ...props 
}: React.SVGProps<SVGSVGElement> & { bubbleColor?: string; textColor?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Official LINE Speech Bubble */}
      <path
        d="M24 10.3c0-5.37-5.38-9.74-12-9.74S0 4.93 0 10.3c0 4.81 4.27 8.85 10.02 9.59.39.08.92.26 1.06.59.12.3.08.78.04 1.09l-.17 1.02c-.05.3-.24 1.19 1.04.65 1.28-.54 6.91-4.07 9.43-6.97 1.74-1.91 2.58-3.84 2.58-5.97z"
        fill={bubbleColor}
      />
      {/* Letter 'L' */}
      <path
        d="M6.35 8.15h1.08v3.98h2.08v1.07H6.35V8.15z"
        fill={textColor}
      />
      {/* Letter 'I' */}
      <path
        d="M10.75 8.15h1.08v5.05h-1.08V8.15z"
        fill={textColor}
      />
      {/* Letter 'N' (Correct Non-Mirrored Diagonal) */}
      <path
        d="M13.05 8.15h1.05l2.02 3.12V8.15h1.08v5.05h-1.05l-2.02-3.12v3.12h-1.08V8.15z"
        fill={textColor}
      />
      {/* Letter 'E' */}
      <path
        d="M18.45 8.15h3.2v1.07h-2.12v0.92h1.95v1.07h-1.95v0.92h2.12v1.07h-3.2V8.15z"
        fill={textColor}
      />
    </svg>
  )
}
