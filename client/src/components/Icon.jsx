// Compact inline SVG icon library for Commune
// All icons are 1em × 1em viewBox="0 0 20 20" unless noted
// Usage: <Icon name="select" size={16} color="currentColor" />

import React from 'react';

const ICONS = {
  // Tools
  select: (
    <path d="M4 2l12 7-5.5 1.5L8 16l-4-14z" fill="currentColor"/>
  ),
  pencil: (
    <path d="M14.5 2.5a2.12 2.12 0 013 3L6 17l-4 1 1-4L14.5 2.5z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  ),
  erase: (
    <><path d="M3 17h14M9 3l8 8-5 5-8-8 5-5z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 3l8 8" stroke="currentColor" strokeWidth="1.5"/></>
  ),
  road: (
    <><rect x="3" y="8" width="14" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M10 9v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
  ),
  lock: (
    <><rect x="5" y="9" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M7 9V7a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" fill="none"/></>
  ),
  unlock: (
    <><rect x="5" y="9" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M7 9V7a3 3 0 016 0" stroke="currentColor" strokeWidth="1.5" fill="none"/></>
  ),
  undo: (
    <path d="M4 8a7 7 0 1011 6M4 8V3M4 8H9" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  ),
  trash: (
    <><path d="M3 6h14M8 6V4h4v2M6 6l1 11h6l1-11" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>
  ),
  sweep: (
    <path d="M3 17c3-3 8-4 10-9M13 8l2-4M7 14l-3 2M9 12l-2 3M11 10l-2 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  ),

  // Views
  map: (
    <path d="M2 4l5 1.5 6-1.5 5 1.5v11l-5-1.5-6 1.5-5-1.5V4z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
  ),
  street: (
    <><circle cx="7" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M10 10h7M3 10H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M7 7V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
  ),
  zone: (
    <path d="M4 4h5v5H4zM11 4h5v5h-5zM4 11h5v5H4zM11 11h5v5h-5z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
  ),

  // Object panel
  building: (
    <><rect x="4" y="3" width="12" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M8 17v-4h4v4M7 7h2M11 7h2M7 11h2M11 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
  ),
  layers: (
    <path d="M2 11l8 4 8-4M2 7l8 4 8-4M10 3L2 7l8 4 8-4-8-4z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
  ),

  // Context menu actions
  rotateCW: (
    <path d="M15 9A6 6 0 109 15M15 4v5h-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  ),
  rotateCCW: (
    <path d="M5 9A6 6 0 1011 15M5 4v5h5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  ),
  scale: (
    <><path d="M3 17L17 3M3 3h6M3 3v6M14 17h3v-3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>
  ),
  palette: (
    <><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/><circle cx="7" cy="8" r="1" fill="currentColor"/><circle cx="13" cy="8" r="1" fill="currentColor"/><circle cx="10" cy="13" r="1" fill="currentColor"/><circle cx="7" cy="12" r="1" fill="currentColor"/><circle cx="13" cy="12" r="1" fill="currentColor"/></>
  ),
  delete: (
    <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  ),
  close: (
    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  ),

  // Shapes flyout
  freeform: (
    <path d="M4 16C4 8 8 4 12 7c2 1.5 1 5-2 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
  ),
  rectangle: (
    <rect x="3" y="6" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  ),
  square: (
    <rect x="4" y="4" width="12" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  ),
  triangle: (
    <path d="M10 3L18 17H2L10 3z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
  ),

  // City pill
  city: (
    <><rect x="3" y="9" width="5" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.3" fill="none"/><rect x="8" y="5" width="4" height="12" rx="0.5" stroke="currentColor" strokeWidth="1.3" fill="none"/><rect x="12" y="7" width="5" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.3" fill="none"/></>
  ),

  // Stats
  stats: (
    <path d="M3 17V9l4-4 4 4 4-6v14" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  ),

  // Placement banner
  place: (
    <><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M10 7v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
  ),

  // Road context menu
  roadInfo: (
    <><path d="M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M7 7l-3 3 3 3M13 7l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></>
  ),
  train: (
    <><rect x="4" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/><rect x="6" y="5" width="8" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.2" fill="none"/><circle cx="7" cy="11" r="1" fill="currentColor"/><circle cx="13" cy="11" r="1" fill="currentColor"/><path d="M5 14l-2 3M15 14l2 3M2 17h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></>
  ),
  plus: (
    <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  ),
  back: (
    <path d="M15 10H5M9 6L5 10l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  ),
};

export default function Icon({ name, size = 16, color = 'currentColor', style = {} }) {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', color, flexShrink: 0, ...style }}
      aria-hidden="true"
    >
      {paths}
    </svg>
  );
}
