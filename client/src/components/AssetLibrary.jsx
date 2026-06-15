import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { v4 as uuid } from 'uuid';

// Prebuilt building templates — collections of primitives
export const TEMPLATES = [
  {
    id: 'house',
    name: 'Simple House',
    icon: '🏠',
    category: 'residential',
    objects: [
      { geometry: 'box',      position: {x:0,y:0.5,z:0},   scale: {x:2,y:1,z:2},    rotation: {x:0,y:0,z:0}, color: '#C8A028', name: 'House_Walls' },
      { geometry: 'wedge',    position: {x:0,y:1.55,z:0},  scale: {x:2.2,y:1,z:2.2},rotation: {x:0,y:0,z:0}, color: '#E24B4A', name: 'House_Roof' },
      { geometry: 'box',      position: {x:0,y:0.25,z:1.01},scale: {x:0.5,y:0.5,z:0.1},rotation: {x:0,y:0,z:0}, color: '#4a3a1a', name: 'House_Door' },
    ],
  },
  {
    id: 'skyscraper',
    name: 'Skyscraper',
    icon: '🏢',
    category: 'commercial',
    objects: [
      { geometry: 'box',   position: {x:0,y:2,z:0},     scale: {x:1.5,y:4,z:1.5},  rotation: {x:0,y:0,z:0}, color: '#378ADD', name: 'Sky_Body' },
      { geometry: 'box',   position: {x:0,y:4.6,z:0},   scale: {x:1.1,y:1.2,z:1.1},rotation: {x:0,y:0,z:0}, color: '#45B7D1', name: 'Sky_Top' },
      { geometry: 'cylinder', position: {x:0,y:5.4,z:0},scale: {x:0.15,y:0.8,z:0.15},rotation: {x:0,y:0,z:0}, color: '#ffffff', name: 'Sky_Antenna' },
    ],
  },
  {
    id: 'office',
    name: 'Office Block',
    icon: '🏬',
    category: 'commercial',
    objects: [
      { geometry: 'box', position: {x:0,y:1.2,z:0},  scale: {x:3,y:2.4,z:2},   rotation: {x:0,y:0,z:0}, color: '#556688', name: 'Office_Body' },
      { geometry: 'box', position: {x:0,y:2.55,z:0}, scale: {x:3.1,y:0.15,z:2.1},rotation: {x:0,y:0,z:0}, color: '#333a4a', name: 'Office_Roof' },
      { geometry: 'box', position: {x:1.1,y:1,z:1.01},scale: {x:0.7,y:0.6,z:0.08},rotation: {x:0,y:0,z:0}, color: '#99bbdd', name: 'Office_Window1' },
      { geometry: 'box', position: {x:-1.1,y:1,z:1.01},scale: {x:0.7,y:0.6,z:0.08},rotation: {x:0,y:0,z:0}, color: '#99bbdd', name: 'Office_Window2' },
    ],
  },
  {
    id: 'factory',
    name: 'Factory',
    icon: '🏭',
    category: 'industrial',
    objects: [
      { geometry: 'box',      position: {x:0,y:0.6,z:0},    scale: {x:3.5,y:1.2,z:2.5}, rotation: {x:0,y:0,z:0}, color: '#667788', name: 'Factory_Body' },
      { geometry: 'cylinder', position: {x:-1.2,y:2,z:0.5}, scale: {x:0.3,y:2.2,z:0.3}, rotation: {x:0,y:0,z:0}, color: '#888880', name: 'Factory_Chimney1' },
      { geometry: 'cylinder', position: {x:-0.4,y:1.8,z:0.5},scale: {x:0.3,y:1.8,z:0.3},rotation: {x:0,y:0,z:0}, color: '#888880', name: 'Factory_Chimney2' },
      { geometry: 'box',      position: {x:0.8,y:1.2,z:0},  scale: {x:1.5,y:2,z:2},     rotation: {x:0,y:0,z:0}, color: '#556677', name: 'Factory_Annex' },
    ],
  },
  {
    id: 'park',
    name: 'Park Feature',
    icon: '🌳',
    category: 'green',
    objects: [
      { geometry: 'cylinder', position: {x:0,y:0.6,z:0},    scale: {x:0.2,y:1.2,z:0.2},  rotation: {x:0,y:0,z:0}, color: '#5a3a1a', name: 'Tree_Trunk' },
      { geometry: 'sphere',   position: {x:0,y:1.7,z:0},    scale: {x:1,y:1.2,z:1},       rotation: {x:0,y:0,z:0}, color: '#2d7a2d', name: 'Tree_Canopy' },
      { geometry: 'cylinder', position: {x:1.5,y:0.5,z:1},  scale: {x:0.18,y:1,z:0.18},  rotation: {x:0,y:0,z:0}, color: '#5a3a1a', name: 'Tree2_Trunk' },
      { geometry: 'sphere',   position: {x:1.5,y:1.4,z:1},  scale: {x:0.85,y:1,z:0.85},  rotation: {x:0,y:0,z:0}, color: '#3a8a3a', name: 'Tree2_Canopy' },
      { geometry: 'box',      position: {x:-0.5,y:0.18,z:-0.8},scale: {x:1.8,y:0.06,z:0.5},rotation: {x:0,y:0,z:0}, color: '#8a7a6a', name: 'Park_Path' },
    ],
  },
  {
    id: 'townhall',
    name: 'Town Hall',
    icon: '🏛️',
    category: 'civic',
    objects: [
      { geometry: 'box',      position: {x:0,y:1,z:0},      scale: {x:4,y:2,z:3},      rotation: {x:0,y:0,z:0}, color: '#c8c0a8', name: 'TH_Body' },
      { geometry: 'box',      position: {x:0,y:2.55,z:0},   scale: {x:2,y:1.1,z:1.5},  rotation: {x:0,y:0,z:0}, color: '#b8b0a0', name: 'TH_Tower' },
      { geometry: 'sphere',   position: {x:0,y:3.35,z:0},   scale: {x:0.6,y:0.5,z:0.6},rotation: {x:0,y:0,z:0}, color: '#c8a028', name: 'TH_Dome' },
      { geometry: 'cylinder', position: {x:-1.5,y:1,z:1.51},scale: {x:0.2,y:2,z:0.2},  rotation: {x:0,y:0,z:0}, color: '#a0988a', name: 'TH_Column1' },
      { geometry: 'cylinder', position: {x:1.5,y:1,z:1.51}, scale: {x:0.2,y:2,z:0.2},  rotation: {x:0,y:0,z:0}, color: '#a0988a', name: 'TH_Column2' },
      { geometry: 'box',      position: {x:0,y:0.15,z:1.51},scale: {x:1,y:0.3,z:0.12}, rotation: {x:0,y:0,z:0}, color: '#4a3a2a', name: 'TH_Door' },
    ],
  },
  {
    id: 'apartment',
    name: 'Apartment Block',
    icon: '🏘️',
    category: 'residential',
    objects: [
      { geometry: 'box', position: {x:0,y:1.5,z:0},    scale: {x:2.5,y:3,z:2},   rotation: {x:0,y:0,z:0}, color: '#d4b896', name: 'Apt_Body' },
      { geometry: 'box', position: {x:0,y:3.1,z:0},    scale: {x:2.6,y:0.2,z:2.1},rotation: {x:0,y:0,z:0}, color: '#b09070', name: 'Apt_Roof' },
      { geometry: 'box', position: {x:0.7,y:1.5,z:1.01},scale: {x:0.5,y:0.6,z:0.1},rotation: {x:0,y:0,z:0}, color: '#99bbcc', name: 'Apt_Win1' },
      { geometry: 'box', position: {x:-0.7,y:1.5,z:1.01},scale: {x:0.5,y:0.6,z:0.1},rotation: {x:0,y:0,z:0}, color: '#99bbcc', name: 'Apt_Win2' },
      { geometry: 'box', position: {x:0.7,y:0.6,z:1.01},scale: {x:0.5,y:0.6,z:0.1},rotation: {x:0,y:0,z:0}, color: '#99bbcc', name: 'Apt_Win3' },
      { geometry: 'box', position: {x:-0.7,y:0.6,z:1.01},scale: {x:0.5,y:0.6,z:0.1},rotation: {x:0,y:0,z:0}, color: '#99bbcc', name: 'Apt_Win4' },
    ],
  },
  {
    id: 'station',
    name: 'Metro Station',
    icon: '🚇',
    category: 'civic',
    objects: [
      { geometry: 'box',      position: {x:0,y:0.3,z:0},    scale: {x:4,y:0.6,z:2.5},  rotation: {x:0,y:0,z:0}, color: '#445566', name: 'Stn_Platform' },
      { geometry: 'box',      position: {x:0,y:1.2,z:0},    scale: {x:4,y:1.2,z:0.1},  rotation: {x:0,y:0,z:0}, color: '#334455', name: 'Stn_BackWall' },
      { geometry: 'cylinder', position: {x:-1.6,y:1.1,z:0}, scale: {x:0.12,y:1.6,z:0.12},rotation: {x:0,y:0,z:0}, color: '#888880', name: 'Stn_Pole1' },
      { geometry: 'cylinder', position: {x:1.6,y:1.1,z:0},  scale: {x:0.12,y:1.6,z:0.12},rotation: {x:0,y:0,z:0}, color: '#888880', name: 'Stn_Pole2' },
      { geometry: 'box',      position: {x:0,y:1.95,z:0},   scale: {x:4,y:0.1,z:2.2},  rotation: {x:0,y:0,z:0}, color: '#4ECDC4', name: 'Stn_Canopy' },
    ],
  },
  {
    id: 'villa',
    name: 'Modern Villa',
    icon: '🏡',
    category: 'residential',
    objects: [
      { geometry: 'box', position: {x:0,y:0.4,z:0}, scale: {x:3,y:0.8,z:3}, color: '#e8eaf0', name: 'Villa_Base' },
      { geometry: 'box', position: {x:0.4,y:1.2,z:0.4}, scale: {x:2,y:0.8,z:2}, color: '#252e40', name: 'Villa_Upper' },
      { geometry: 'box', position: {x:-0.8,y:0.4,z:-0.8}, scale: {x:1,y:0.02,z:1}, color: '#45B7D1', name: 'Villa_Pool' },
      { geometry: 'cylinder', position: {x:-1.2,y:0.8,z:1.2}, scale: {x:0.1,y:0.8,z:0.1}, color: '#888', name: 'Villa_Pillar1' },
      { geometry: 'cylinder', position: {x:1.2,y:0.8,z:1.2}, scale: {x:0.1,y:0.8,z:0.1}, color: '#888', name: 'Villa_Pillar2' },
      { geometry: 'box', position: {x:0,y:1.65,z:0}, scale: {x:3.2,y:0.1,z:3.2}, color: '#e8eaf0', name: 'Villa_Roof' },
    ],
  },
  {
    id: 'turbine',
    name: 'Wind Turbine',
    icon: '💨',
    category: 'industrial',
    objects: [
      { geometry: 'cylinder', position: {x:0,y:2,z:0}, scale: {x:0.2,y:4,z:0.2}, color: '#d8dee9', name: 'Turbine_Pole' },
      { geometry: 'sphere', position: {x:0,y:4.05,z:0.15}, scale: {x:0.35,y:0.35,z:0.45}, color: '#eceff4', name: 'Turbine_Hub' },
      { geometry: 'wedge', position: {x:0,y:4.9,z:0.15}, scale: {x:0.2,y:1.6,z:0.06}, rotation: {x:0,y:0,z:0}, color: '#ffffff', name: 'Turbine_Blade1' },
      { geometry: 'wedge', position: {x:-0.7,y:3.6,z:0.15}, scale: {x:0.2,y:1.6,z:0.06}, rotation: {x:0,y:0,z:Math.PI * 2 / 3}, color: '#ffffff', name: 'Turbine_Blade2' },
      { geometry: 'wedge', position: {x:0.7,y:3.6,z:0.15}, scale: {x:0.2,y:1.6,z:0.06}, rotation: {x:0,y:0,z:-Math.PI * 2 / 3}, color: '#ffffff', name: 'Turbine_Blade3' },
    ],
  },
  {
    id: 'bridge',
    name: 'Overpass Bridge',
    icon: '🌉',
    category: 'civic',
    objects: [
      { geometry: 'box', position: {x:0,y:1.2,z:0}, scale: {x:4.5,y:0.2,z:1.6}, color: '#445566', name: 'Bridge_Road' },
      { geometry: 'box', position: {x:0,y:1.35,z:0.75}, scale: {x:4.5,y:0.15,z:0.08}, color: '#EF9F27', name: 'Bridge_Rail_Left' },
      { geometry: 'box', position: {x:0,y:1.35,z:-0.75}, scale: {x:4.5,y:0.15,z:0.08}, color: '#EF9F27', name: 'Bridge_Rail_Right' },
      { geometry: 'cylinder', position: {x:-1.5,y:0.6,z:0}, scale: {x:0.4,y:1.2,z:0.4}, color: '#8892a4', name: 'Bridge_Pillar_Left' },
      { geometry: 'cylinder', position: {x:1.5,y:0.6,z:0}, scale: {x:0.4,y:1.2,z:0.4}, color: '#8892a4', name: 'Bridge_Pillar_Right' },
    ],
  },
  {
    id: 'watertower',
    name: 'Water Tower',
    icon: '🚰',
    category: 'civic',
    objects: [
      { geometry: 'cylinder', position: {x:0,y:1.2,z:0}, scale: {x:0.25,y:2.4,z:0.25}, color: '#8892a4', name: 'Tower_Stem' },
      { geometry: 'cylinder', position: {x:-0.6,y:1.0,z:-0.6}, scale: {x:0.1,y:2.0,z:0.1}, color: '#556677', name: 'Tower_Leg1' },
      { geometry: 'cylinder', position: {x:0.6,y:1.0,z:-0.6}, scale: {x:0.1,y:2.0,z:0.1}, color: '#556677', name: 'Tower_Leg2' },
      { geometry: 'cylinder', position: {x:-0.6,y:1.0,z:0.6}, scale: {x:0.1,y:2.0,z:0.1}, color: '#556677', name: 'Tower_Leg3' },
      { geometry: 'cylinder', position: {x:0.6,y:1.0,z:0.6}, scale: {x:0.1,y:2.0,z:0.1}, color: '#556677', name: 'Tower_Leg4' },
      { geometry: 'torus', position: {x:0,y:2.4,z:0}, scale: {x:1.6,y:1.6,z:1.2}, rotation: {x:Math.PI/2,y:0,z:0}, color: '#378ADD', name: 'Tower_Tank_Base' },
      { geometry: 'sphere', position: {x:0,y:2.8,z:0}, scale: {x:1.5,y:1.2,z:1.5}, color: '#378ADD', name: 'Tower_Tank_Dome' },
    ],
  },
  {
    id: 'suburban',
    name: 'Suburban Home',
    icon: '🏡',
    category: 'residential',
    objects: [
      { geometry: 'box', position: {x:0,y:0.45,z:0}, scale: {x:2.2,y:0.9,z:1.8}, color: '#d4b896', name: 'Suburban_Base' },
      { geometry: 'box', position: {x:-1.2,y:0.35,z:0.2}, scale: {x:1.0,y:0.7,z:1.2}, color: '#e8eaf0', name: 'Suburban_Garage' },
      { geometry: 'box', position: {x:-1.2,y:0.35,z:0.81}, scale: {x:0.8,y:0.5,z:0.05}, color: '#4a5568', name: 'Suburban_GarageDoor' },
      { geometry: 'wedge', position: {x:0,y:1.15,z:0}, scale: {x:2.4,y:0.6,z:2.0}, color: '#9b2c2c', name: 'Suburban_RoofMain' },
      { geometry: 'wedge', position: {x:-1.2,y:0.85,z:0.2}, scale: {x:1.1,y:0.4,z:1.3}, color: '#9b2c2c', name: 'Suburban_RoofGarage' },
      { geometry: 'box', position: {x:0.8,y:1.1,z:-0.4}, scale: {x:0.3,y:1.2,z:0.3}, color: '#742a2a', name: 'Suburban_Chimney' },
      { geometry: 'box', position: {x:0.3,y:0.3,z:0.91}, scale: {x:0.4,y:0.6,z:0.05}, color: '#2d3748', name: 'Suburban_Door' },
    ],
  },
  {
    id: 'manor',
    name: 'Medieval Manor',
    icon: '🏰',
    category: 'residential',
    objects: [
      { geometry: 'box', position: {x:0,y:0.75,z:0}, scale: {x:3.0,y:1.5,z:2.0}, color: '#8892a4', name: 'Manor_Hall' },
      { geometry: 'cylinder', position: {x:-1.6,y:1.2,z:0}, scale: {x:0.8,y:2.4,z:0.8}, color: '#718096', name: 'Manor_LeftTower' },
      { geometry: 'cone', position: {x:-1.6,y:2.65,z:0}, scale: {x:0.9,y:0.8,z:0.9}, color: '#3182ce', name: 'Manor_LeftTowerRoof' },
      { geometry: 'cylinder', position: {x:1.6,y:1.2,z:0}, scale: {x:0.8,y:2.4,z:0.8}, color: '#718096', name: 'Manor_RightTower' },
      { geometry: 'cone', position: {x:1.6,y:2.65,z:0}, scale: {x:0.9,y:0.8,z:0.9}, color: '#3182ce', name: 'Manor_RightTowerRoof' },
      { geometry: 'box', position: {x:0,y:1.55,z:0}, scale: {x:2.8,y:0.2,z:2.1}, color: '#4a5568', name: 'Manor_Crenellations' },
      { geometry: 'box', position: {x:0,y:0.4,z:1.01}, scale: {x:0.7,y:0.8,z:0.08}, color: '#2d3748', name: 'Manor_Gate' },
    ],
  },
  {
    id: 'mall',
    name: 'Shopping Mall',
    icon: '🛍️',
    category: 'commercial',
    objects: [
      { geometry: 'box', position: {x:0,y:0.5,z:0}, scale: {x:4.6,y:1.0,z:3.4}, color: '#edf2f7', name: 'Mall_Ground' },
      { geometry: 'box', position: {x:0,y:1.4,z:0}, scale: {x:4.0,y:0.8,z:2.8}, color: '#cbd5e0', name: 'Mall_Upper' },
      { geometry: 'sphere', position: {x:0,y:1.8,z:0}, scale: {x:1.6,y:0.6,z:1.6}, color: '#63b3ed', name: 'Mall_GlassDome' },
      { geometry: 'box', position: {x:-1.8,y:0.5,z:1.71}, scale: {x:0.8,y:0.9,z:0.1}, color: '#319795', name: 'Mall_LeftWing' },
      { geometry: 'box', position: {x:1.8,y:0.5,z:1.71}, scale: {x:0.8,y:0.9,z:0.1}, color: '#319795', name: 'Mall_RightWing' },
      { geometry: 'cylinder', position: {x:-0.7,y:0.9,z:1.71}, scale: {x:0.15,y:1.8,z:0.15}, color: '#a0aec0', name: 'Mall_PillarLeft' },
      { geometry: 'cylinder', position: {x:0.7,y:0.9,z:1.71}, scale: {x:0.15,y:1.8,z:0.15}, color: '#a0aec0', name: 'Mall_PillarRight' },
      { geometry: 'box', position: {x:0,y:1.9,z:1.41}, scale: {x:1.8,y:0.4,z:0.1}, color: '#e53e3e', name: 'Mall_Signboard' },
    ],
  },
  {
    id: 'diner',
    name: 'Fast Food Diner',
    icon: '🍔',
    category: 'commercial',
    objects: [
      { geometry: 'box', position: {x:0,y:0.6,z:0}, scale: {x:3.0,y:1.2,z:2.2}, color: '#f7fafc', name: 'Diner_Body' },
      { geometry: 'torus', position: {x:0,y:1.2,z:0}, scale: {x:3.1,y:2.3,z:0.1}, rotation: {x:Math.PI/2,y:0,z:0}, color: '#ed64a6', name: 'Diner_NeonRoof' },
      { geometry: 'cylinder', position: {x:-0.8,y:1.6,z:0}, scale: {x:0.4,y:0.8,z:0.4}, color: '#ecc94b', name: 'Diner_RoofSign' },
      { geometry: 'cone', position: {x:-0.8,y:2.1,z:0}, scale: {x:0.3,y:0.3,z:0.3}, color: '#e53e3e', name: 'Diner_SignStar' },
      { geometry: 'box', position: {x:0.4,y:0.45,z:1.11}, scale: {x:0.6,y:0.9,z:0.05}, color: '#dd6b20', name: 'Diner_Door' },
      { geometry: 'cylinder', position: {x:-1.8,y:0.25,z:1.2}, scale: {x:0.5,y:0.5,z:0.5}, color: '#718096', name: 'Diner_Table' },
      { geometry: 'cylinder', position: {x:-1.8,y:0.15,z:1.6}, scale: {x:0.2,y:0.3,z:0.2}, color: '#e53e3e', name: 'Diner_Chair' },
    ],
  },
  {
    id: 'refinery',
    name: 'Oil Refinery',
    icon: '🏭',
    category: 'industrial',
    objects: [
      { geometry: 'cylinder', position: {x:-1.2,y:1.2,z:-0.6}, scale: {x:1.2,y:2.4,z:1.2}, color: '#e2e8f0', name: 'Refinery_CoolingTower' },
      { geometry: 'torus', position: {x:-1.2,y:2.4,z:-0.6}, scale: {x:1.1,y:1.1,z:0.1}, rotation: {x:Math.PI/2,y:0,z:0}, color: '#a0aec0', name: 'Refinery_TowerRim' },
      { geometry: 'sphere', position: {x:0.8,y:0.8,z:-0.4}, scale: {x:1.6,y:1.6,z:1.6}, color: '#4a5568', name: 'Refinery_Reactor' },
      { geometry: 'cylinder', position: {x:1.2,y:2.0,z:0.8}, scale: {x:0.3,y:4.0,z:0.3}, color: '#718096', name: 'Refinery_Smokestack' },
      { geometry: 'torus', position: {x:1.2,y:3.6,z:0.8}, scale: {x:0.32,y:0.32,z:0.1}, rotation: {x:Math.PI/2,y:0,z:0}, color: '#e53e3e', name: 'Refinery_RedBand' },
      { geometry: 'torus', position: {x:-0.2,y:0.8,z:0}, scale: {x:1.0,y:1.0,z:0.3}, rotation: {x:0,y:Math.PI/2,z:0}, color: '#dd6b20', name: 'Refinery_Pipe' },
    ],
  },
  {
    id: 'warehouse',
    name: 'Cargo Warehouse',
    icon: '📦',
    category: 'industrial',
    objects: [
      { geometry: 'box', position: {x:0,y:0.7,z:0}, scale: {x:4.4,y:1.4,z:3.2}, color: '#4a5568', name: 'Warehouse_Body' },
      { geometry: 'box', position: {x:-1.0,y:1.41,z:0.8}, scale: {x:1.6,y:0.02,z:1.0}, color: '#2b6cb0', name: 'Warehouse_Solar1' },
      { geometry: 'box', position: {x:1.0,y:1.41,z:0.8}, scale: {x:1.6,y:0.02,z:1.0}, color: '#2b6cb0', name: 'Warehouse_Solar2' },
      { geometry: 'box', position: {x:-1.2,y:0.5,z:1.61}, scale: {x:1.0,y:1.0,z:0.05}, color: '#a0aec0', name: 'Warehouse_Gate1' },
      { geometry: 'box', position: {x:1.2,y:0.5,z:1.61}, scale: {x:1.0,y:1.0,z:0.05}, color: '#a0aec0', name: 'Warehouse_Gate2' },
      { geometry: 'box', position: {x:-1.8,y:0.3,z:-1.2}, scale: {x:0.6,y:0.6,z:0.6}, color: '#b7791f', name: 'Warehouse_Crate1' },
      { geometry: 'box', position: {x:-1.8,y:0.9,z:-1.2}, scale: {x:0.6,y:0.6,z:0.6}, color: '#2f855a', name: 'Warehouse_Crate2' },
    ],
  },
  {
    id: 'greenhouse',
    name: 'Botanical Dome',
    icon: '🌴',
    category: 'green',
    objects: [
      { geometry: 'cylinder', position: {x:0,y:0.1,z:0}, scale: {x:4.0,y:0.2,z:4.0}, color: '#a0aec0', name: 'Greenhouse_Base' },
      { geometry: 'sphere', position: {x:0,y:0.8,z:0}, scale: {x:3.4,y:1.6,z:3.4}, color: '#63b3ed', name: 'Greenhouse_Dome' },
      { geometry: 'cylinder', position: {x:0,y:0.7,z:0}, scale: {x:0.12,y:1.4,z:0.12}, color: '#744210', name: 'Greenhouse_PalmTrunk' },
      { geometry: 'cone', position: {x:0,y:1.4,z:0}, scale: {x:0.8,y:0.4,z:0.8}, color: '#2f855a', name: 'Greenhouse_PalmLeaves' },
      { geometry: 'cylinder', position: {x:1.0,y:0.5,z:1.0}, scale: {x:0.1,y:1.0,z:0.1}, color: '#744210', name: 'Greenhouse_CornerTrunk' },
      { geometry: 'sphere', position: {x:1.0,y:1.0,z:1.0}, scale: {x:0.5,y:0.5,z:0.5}, color: '#276749', name: 'Greenhouse_CornerCanopy' },
      { geometry: 'box', position: {x:0,y:0.21,z:1.4}, scale: {x:0.6,y:0.02,z:1.2}, color: '#e2e8f0', name: 'Greenhouse_Path' },
    ],
  },
  {
    id: 'fountain',
    name: 'Zen Fountain',
    icon: '⛲',
    category: 'green',
    objects: [
      { geometry: 'cylinder', position: {x:0,y:0.05,z:0}, scale: {x:4.5,y:0.1,z:4.5}, color: '#48bb78', name: 'Zen_Lawn' },
      { geometry: 'torus', position: {x:0,y:0.2,z:0}, scale: {x:1.8,y:1.8,z:0.2}, rotation: {x:Math.PI/2,y:0,z:0}, color: '#cbd5e0', name: 'Zen_Basin' },
      { geometry: 'cylinder', position: {x:0,y:0.15,z:0}, scale: {x:1.7,y:0.1,z:1.7}, color: '#3182ce', name: 'Zen_Water' },
      { geometry: 'torus', position: {x:0,y:0.45,z:0}, scale: {x:0.9,y:0.9,z:0.15}, rotation: {x:Math.PI/2,y:0,z:0}, color: '#cbd5e0', name: 'Zen_Tier2' },
      { geometry: 'sphere', position: {x:0,y:0.65,z:0}, scale: {x:0.25,y:0.25,z:0.25}, color: '#63b3ed', name: 'Zen_WaterSpurt' },
      { geometry: 'torus', position: {x:0,y:1.0,z:1.8}, scale: {x:1.2,y:1.2,z:0.15}, color: '#718096', name: 'Zen_StoneArch' },
      { geometry: 'box', position: {x:1.6,y:0.2,z:-1.0}, scale: {x:0.3,y:0.2,z:0.8}, color: '#a0aec0', name: 'Zen_StoneBench' },
    ],
  },
  {
    id: 'solar',
    name: 'Solar Array',
    icon: '☀️',
    category: 'civic',
    objects: [
      { geometry: 'box', position: {x:0,y:0.05,z:0}, scale: {x:4.4,y:0.1,z:4.0}, color: '#718096', name: 'Solar_Base' },
      { geometry: 'cylinder', position: {x:-1.2,y:0.3,z:-1.0}, scale: {x:0.08,y:0.6,z:0.08}, color: '#cbd5e0', name: 'Solar_Pole1' },
      { geometry: 'box', position: {x:-1.2,y:0.6,z:-1.0}, scale: {x:1.2,y:0.05,z:0.8}, rotation: {x:0.4,y:0,z:0}, color: '#2b6cb0', name: 'Solar_Array1' },
      { geometry: 'cylinder', position: {x:1.2,y:0.3,z:-1.0}, scale: {x:0.08,y:0.6,z:0.08}, color: '#cbd5e0', name: 'Solar_Pole2' },
      { geometry: 'box', position: {x:1.2,y:0.6,z:-1.0}, scale: {x:1.2,y:0.05,z:0.8}, rotation: {x:0.4,y:0,z:0}, color: '#2b6cb0', name: 'Solar_Array2' },
      { geometry: 'cylinder', position: {x:-1.2,y:0.3,z:1.0}, scale: {x:0.08,y:0.6,z:0.08}, color: '#cbd5e0', name: 'Solar_Pole3' },
      { geometry: 'box', position: {x:-1.2,y:0.6,z:1.0}, scale: {x:1.2,y:0.05,z:0.8}, rotation: {x:0.4,y:0,z:0}, color: '#2b6cb0', name: 'Solar_Array3' },
      { geometry: 'cylinder', position: {x:1.2,y:0.3,z:1.0}, scale: {x:0.08,y:0.6,z:0.08}, color: '#cbd5e0', name: 'Solar_Pole4' },
      { geometry: 'box', position: {x:1.2,y:0.6,z:1.0}, scale: {x:1.2,y:0.05,z:0.8}, rotation: {x:0.4,y:0,z:0}, color: '#2b6cb0', name: 'Solar_Array4' },
      { geometry: 'box', position: {x:0,y:0.4,z:0}, scale: {x:0.8,y:0.8,z:0.8}, color: '#dd6b20', name: 'Solar_Inverter' },
    ],
  },
  {
    id: 'hospital',
    name: 'City Hospital',
    icon: '🏥',
    category: 'civic',
    objects: [
      { geometry: 'box', position: {x:0,y:0.8,z:0}, scale: {x:3.2,y:1.6,z:2.0}, color: '#f7fafc', name: 'Hospital_MainWing' },
      { geometry: 'box', position: {x:-1.8,y:0.6,z:-0.2}, scale: {x:1.2,y:1.2,z:1.6}, color: '#edf2f7', name: 'Hospital_LeftWing' },
      { geometry: 'box', position: {x:1.8,y:0.6,z:-0.2}, scale: {x:1.2,y:1.2,z:1.6}, color: '#edf2f7', name: 'Hospital_RightWing' },
      { geometry: 'box', position: {x:0,y:1.61,z:0.3}, scale: {x:1.8,y:0.02,z:1.4}, color: '#e2e8f0', name: 'Hospital_Helipad' },
      { geometry: 'box', position: {x:0,y:1.62,z:0.3}, scale: {x:0.8,y:0.01,z:0.2}, color: '#e53e3e', name: 'Hospital_CrossPart1' },
      { geometry: 'box', position: {x:0,y:1.62,z:0.3}, scale: {x:0.2,y:0.01,z:0.8}, color: '#e53e3e', name: 'Hospital_CrossPart2' },
      { geometry: 'box', position: {x:1.8,y:0.5,z:0.8}, scale: {x:1.0,y:0.1,z:0.8}, color: '#e2e8f0', name: 'Hospital_Canopy' },
      { geometry: 'cylinder', position: {x:1.4,y:0.25,z:1.1}, scale: {x:0.06,y:0.5,z:0.06}, color: '#a0aec0', name: 'Hospital_CanopyPillarL' },
      { geometry: 'cylinder', position: {x:2.2,y:0.25,z:1.1}, scale: {x:0.06,y:0.5,z:0.06}, color: '#a0aec0', name: 'Hospital_CanopyPillarR' },
    ],
  },
];

const CATEGORY_FILTER = ['all', 'residential', 'commercial', 'industrial', 'green', 'civic'];

export default function AssetLibrary({ onClose, spawnOffset }) {
  const [catFilter, setCatFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = TEMPLATES.filter(t =>
    (catFilter === 'all' || t.category === catFilter) &&
    (!search || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  function loadTemplate(template) {
    const idMap = {};
    const newIds = [];
    const ops = [];
    const offset = spawnOffset || { x: 0, y: 0, z: 0 };

    template.objects.forEach(obj => {
      const newId = uuid();
      idMap[obj.name] = newId;
      newIds.push(newId);
      
      const pos = {
        x: parseFloat((obj.position.x + offset.x).toFixed(2)),
        y: obj.position.y,
        z: parseFloat((obj.position.z + offset.z).toFixed(2)),
      };

      const op = {
        kind: 'CREATE', objectId: newId, geometry: obj.geometry, objType: 'mesh',
        position: pos,
        rotation: obj.rotation || { x: 0, y: 0, z: 0 },
        scale: obj.scale || { x: 1, y: 1, z: 1 },
        color: obj.color, name: obj.name,
        vectorClock: { ...useStore.getState().editorVectorClock },
      };
      ops.push({ op, newId, obj, pos });
    });

    useStore.setState(state => {
      const nextObjs = { ...state.editorObjects };
      ops.forEach(({ newId, obj, pos }) => {
        nextObjs[newId] = {
          id: newId, type: 'mesh', geometry: obj.geometry,
          position: pos,
          rotation: obj.rotation || { x: 0, y: 0, z: 0 },
          scale: obj.scale || { x: 1, y: 1, z: 1 },
          color: obj.color, name: obj.name,
          createdBy: state.username, timestamp: Date.now(),
        };
      });
      return {
        editorObjects: nextObjs,
        selectedObjectId: newIds[newIds.length - 1],
        selectedObjectIds: newIds,
        undoStack: [...state.undoStack, { type: 'DELETE_GROUP', objectIds: newIds }].slice(-30),
        redoStack: [],
      };
    });

    const { editorSceneId, send } = useStore.getState();
    ops.forEach(({ op }) => {
      send({ type: 'EDITOR_OP', sceneId: editorSceneId, op });
    });

    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 540, maxHeight: '80vh' }}>
        <div className="modal-header">
          <div className="modal-title">📚 Asset Library</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <input
            className="form-input"
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
          {CATEGORY_FILTER.map(c => (
            <button
              key={c}
              className={`btn sm ${catFilter === c ? 'primary' : ''}`}
              onClick={() => setCatFilter(c)}
              style={{ textTransform: 'capitalize' }}
            >
              {c}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, overflowY: 'auto', maxHeight: 380 }}>
          {filtered.map(t => (
            <div
              key={t.id}
              onClick={() => loadTemplate(t)}
              style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '14px 16px', cursor: 'pointer',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(78,205,196,0.4)'; e.currentTarget.style.background = 'var(--bg4)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg3)'; }}
            >
              <div style={{ fontSize: 28, marginBottom: 6 }}>{t.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize' }}>
                {t.category} · {t.objects.length} objects
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 13 }}>
              No templates match your search.
            </div>
          )}
        </div>

        <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text3)' }}>
          Templates add objects to your current scene. Use as a starting point and customize from there.
        </div>
      </div>
    </div>
  );
}
