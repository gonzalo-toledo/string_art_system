import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
}

export function ArrowLeft({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

export function Volume2({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

export function VolumeX({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

export function Eye({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function List({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}

export function ChevronLeft({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

export function ChevronRight({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function Play({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

export function Pause({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

export function Check({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function Trophy({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
      <path d="M12 2a6 6 0 0 1 6 6v3.5c0 3.3-2.7 6-6 6s-6-2.7-6-6V8a6 6 0 0 1 6-6z" />
    </svg>
  );
}

export function Sparkles({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
    </svg>
  );
}

export function MonitorPlay({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <polygon points="10 8 15 11 10 14 10 8" />
    </svg>
  );
}

export function Copy({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function Download({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export function Upload({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

export function AlertCircle({ size = 20, strokeWidth = 2, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function LogoCodeva({ height = 16, ...props }: React.SVGProps<SVGSVGElement> & { height?: number | string }) {
  return (
    <svg
      id="Capa_1"
      data-name="Capa 1"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="110 460 800 150"
      height={height}
      style={{ aspectRatio: '800 / 150', display: 'block', ...props.style }}
      {...props}
    >
      <path fill="#ca5435" d="M823.87,589.11c-6.91,0-12.65-1.17-17.21-3.51-4.57-2.34-7.97-5.49-10.2-9.44-2.23-3.95-3.34-8.22-3.34-12.79,0-5.57,1.45-10.33,4.35-14.29,2.9-3.95,7.02-6.99,12.37-9.11,5.35-2.11,11.75-3.18,19.22-3.18h21.89c0-4.9-.73-8.97-2.17-12.2-1.45-3.23-3.59-5.65-6.44-7.27-2.84-1.61-6.44-2.42-10.78-2.42-5.01,0-9.31,1.2-12.87,3.59-3.57,2.4-5.8,5.93-6.69,10.61h-16.71c.67-5.91,2.7-10.95,6.1-15.13,3.4-4.18,7.77-7.41,13.12-9.69s11.03-3.43,17.05-3.43c7.91,0,14.54,1.39,19.89,4.18,5.35,2.79,9.39,6.71,12.12,11.78,2.73,5.07,4.1,11.12,4.1,18.13v52.15h-14.54l-1.34-14.21c-1.23,2.23-2.68,4.35-4.35,6.35-1.67,2.01-3.65,3.73-5.93,5.18-2.28,1.45-4.9,2.59-7.86,3.43-2.95.84-6.21,1.25-9.78,1.25ZM827.04,575.58c3.57,0,6.8-.72,9.7-2.17,2.9-1.45,5.37-3.43,7.44-5.93,2.06-2.51,3.62-5.35,4.68-8.52,1.06-3.18,1.64-6.43,1.76-9.78v-.5h-19.89c-4.79,0-8.67.59-11.62,1.76-2.95,1.17-5.1,2.76-6.43,4.76-1.34,2.01-2.01,4.35-2.01,7.02s.64,5.16,1.92,7.1c1.28,1.95,3.15,3.49,5.6,4.6,2.45,1.12,5.4,1.67,8.86,1.67Z"/>
      <path fill="#ca5435" d="M385.97,518.84c3.78-2.27,7.89-3.41,12.33-3.41,5.44,0,10.13,1.33,14.08,4,3.94,2.67,6.47,6.44,7.58,11.33h17.33c-1.89-9.11-6.28-16.33-13.16-21.66-6.89-5.33-15.44-8-25.66-8-8.11,0-15.33,1.86-21.66,5.58-6.33,3.72-11.3,8.89-14.91,15.49-3.61,6.61-5.42,14.3-5.42,23.07s1.8,16.27,5.42,22.83c3.61,6.56,8.58,11.69,14.91,15.41,6.33,3.72,13.55,5.58,21.66,5.58,10.22,0,18.77-2.69,25.66-8.08,6.88-5.39,11.27-12.52,13.16-21.41h-17.33c-.78,3.22-2.19,6-4.25,8.33-2.06,2.33-4.56,4.08-7.5,5.25-2.94,1.16-6.25,1.75-9.91,1.75-3.33,0-6.5-.64-9.5-1.91-3-1.28-5.64-3.19-7.91-5.75-2.28-2.55-4.08-5.69-5.42-9.41s-2-7.97-2-12.75c0-6.44,1.14-11.85,3.42-16.24,2.27-4.39,5.3-7.72,9.08-10Z"/>
      <path fill="#ca5435" d="M506.49,506.59c-6.22-3.66-13.33-5.5-21.33-5.5s-14.99,1.83-21.33,5.5c-6.33,3.67-11.33,8.8-15,15.41-3.67,6.61-5.5,14.36-5.5,23.24s1.8,16.3,5.42,22.91c3.61,6.61,8.55,11.75,14.83,15.41,6.27,3.67,13.35,5.5,21.24,5.5s15.16-1.83,21.49-5.5c6.33-3.66,11.3-8.77,14.91-15.33,3.61-6.55,5.42-14.27,5.42-23.16s-1.81-16.6-5.42-23.16c-3.61-6.55-8.53-11.66-14.74-15.33ZM506.24,561.49c-2.28,4.39-5.28,7.69-9,9.91-3.72,2.22-7.86,3.33-12.41,3.33s-8.36-1.11-12.08-3.33c-3.72-2.22-6.72-5.52-9-9.91-2.28-4.39-3.42-9.86-3.42-16.41s1.14-12.02,3.42-16.41c2.27-4.39,5.3-7.69,9.08-9.91,3.78-2.22,7.89-3.33,12.33-3.33s8.52,1.11,12.25,3.33c3.72,2.22,6.69,5.53,8.91,9.91,2.22,4.39,3.33,9.86,3.33,16.41s-1.14,12.03-3.42,16.41Z"/>
      <path fill="#ca5435" d="M689.84,506.59c-5.89-3.66-12.94-5.5-21.16-5.5s-15.44,1.86-21.66,5.58c-6.22,3.72-11.08,8.89-14.58,15.49-3.5,6.61-5.25,14.36-5.25,23.24s1.75,16.27,5.25,22.83c3.5,6.56,8.36,11.66,14.58,15.33,6.22,3.67,13.33,5.5,21.33,5.5,6.55,0,12.36-1.16,17.41-3.5,5.05-2.33,9.3-5.52,12.75-9.58,3.44-4.05,5.89-8.64,7.33-13.74h-16.66c-1.67,4-4.22,7.16-7.66,9.5-3.44,2.33-7.83,3.5-13.16,3.5-4.44,0-8.55-1.08-12.33-3.25-3.78-2.17-6.8-5.39-9.08-9.66-1.97-3.69-3.08-8.11-3.35-13.24h64.41c.11-1.55.19-2.97.25-4.25.05-1.27.08-2.47.08-3.58,0-7.33-1.61-14.02-4.83-20.08-3.22-6.05-7.78-10.91-13.66-14.58ZM643.78,537.25c.45-3.96,1.5-7.38,3.15-10.25,2.28-3.94,5.3-6.94,9.08-9,3.77-2.05,7.94-3.08,12.49-3.08,6.44,0,11.83,1.97,16.16,5.91,4.33,3.94,6.66,9.41,7,16.41h-47.89Z"/>
      <path fill="#ca5435" d="M791.03,503.1h-17.16l-23.99,67.98-23.82-67.98h-17.49l24.31,64.84h0s3.72,9.94,3.72,9.94c.03.08.07.14.1.22l.84,2.23c1.94,5.14,6.85,8.54,12.35,8.54s10.44-3.42,12.36-8.59l5.72-15.34,23.06-61.83Z"/>
      <path fill="#ca5435" d="M895.22,569.82c-2-2.05-4.61-3.08-7.83-3.08s-5.86,1.03-7.91,3.08-3.08,4.58-3.08,7.58,1.02,5.36,3.08,7.41c2.05,2.06,4.69,3.08,7.91,3.08s5.83-1.03,7.83-3.08c2-2.05,3-4.52,3-7.41s-1-5.52-3-7.58Z"/>
      <path fill="#ca5435" d="M601.17,508.82c-1.07-.79-2.17-1.54-3.33-2.22-6.22-3.66-13.33-5.5-21.33-5.5s-14.99,1.83-21.33,5.5c-6.33,3.67-11.33,8.8-15,15.41-3.67,6.61-5.5,14.36-5.5,23.24s1.8,16.3,5.42,22.91c3.61,6.61,8.55,11.75,14.83,15.41,6.27,3.67,13.35,5.5,21.24,5.5s15.16-1.83,21.49-5.5c6.33-3.66,11.3-8.77,14.91-15.33,3.61-6.55,5.42-14.27,5.42-23.16,0-.08,0-.15,0-.22h0v-77.75h-16.83v41.71ZM597.59,561.49c-2.28,4.39-5.28,7.69-9,9.91-3.72,2.22-7.86,3.33-12.41,3.33s-8.36-1.11-12.08-3.33c-3.72-2.22-6.72-5.52-9-9.91-2.28-4.39-3.42-9.86-3.42-16.41s1.14-12.02,3.42-16.41c2.27-4.39,5.3-7.69,9.08-9.91,3.78-2.22,7.89-3.33,12.33-3.33s8.52,1.11,12.25,3.33c3.72,2.22,6.69,5.53,8.91,9.91,2.22,4.39,3.33,9.86,3.33,16.41s-1.14,12.03-3.42,16.41Z"/>
      <path fill="#ca5435" d="M304.08,498.43l-28.19-29.88-23.11,21.8s-.07.07-.11.09c-4.47,4.18-10.35,6.5-16.47,6.5h-43.73c-6.81,13.2-10.69,28.14-10.69,44s3.88,30.81,10.69,43.99h.51l-.02-.02h43.71c.2,0,.38,0,.58.02,4.99.11,9.82,1.78,13.8,4.74.76.56,1.51,1.18,2.21,1.83l7.79,7.35,15.27,14.03,28.28-30.75c21.71-23.62,21.48-60.38-.53-83.71ZM273.88,553.87l-25.85,28.13c-1.4,1.52-3.76,1.68-5.34.33-11.72-9.98-19.15-24.83-19.15-41.39s7.45-31.44,19.17-41.41c1.56-1.33,3.9-1.19,5.3.3l25.7,27.25c7.04,7.46,7.12,19.24.16,26.79Z"/>
    </svg>
  );
}
