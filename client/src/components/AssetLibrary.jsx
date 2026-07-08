import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { v4 as uuid } from 'uuid';

// ── 10 Sophisticated Template Generators (50-60 shapes each) ─────────────────
function makeOakTree() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#5C4033', name = 'Oak') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  add('cylinder', 0, 0.5, 0, 0.35, 1.0, 0.35, 0, 0, 0, '#5C4033', 'OakTrunk');
  add('cylinder', -0.3, 0.9, 0.2, 0.15, 0.6, 0.15, 0.5, 0.2, -0.3, '#5C4033', 'OakBranch1');
  add('cylinder', 0.3, 1.0, -0.2, 0.15, 0.6, 0.15, -0.4, -0.3, 0.4, '#5C4033', 'OakBranch2');
  add('cylinder', 0.1, 1.1, 0.3, 0.12, 0.5, 0.12, 0.3, 0.5, 0.2, '#5C4033', 'OakBranch3');
  add('box', 0.3, 0.05, 0.1, 0.5, 0.1, 0.2, 0, 0, -0.1, '#4d3326', 'OakRoot1');
  add('box', -0.2, 0.05, -0.3, 0.4, 0.1, 0.2, 0.1, 0, 0.1, '#4d3326', 'OakRoot2');
  add('box', -0.1, 0.05, 0.35, 0.2, 0.1, 0.5, -0.1, 0, 0, '#4d3326', 'OakRoot3');
  add('sphere', 0, 1.5, 0, 1.2, 1.0, 1.2, 0, 0, 0, '#2e5c1e', 'OakLeavesMain');
  add('sphere', -0.4, 1.6, 0.3, 0.9, 0.8, 0.9, 0, 0, 0, '#3f7a2d', 'OakLeavesL');
  add('sphere', 0.4, 1.7, -0.3, 0.8, 0.8, 0.8, 0, 0, 0, '#3f7a2d', 'OakLeavesR');
  add('sphere', 0.2, 1.8, 0.4, 0.75, 0.75, 0.75, 0, 0, 0, '#4c8c35', 'OakLeavesT1');
  add('sphere', -0.3, 1.9, -0.4, 0.7, 0.7, 0.7, 0, 0, 0, '#4c8c35', 'OakLeavesT2');
  add('sphere', 0, 2.2, 0, 0.9, 0.8, 0.9, 0, 0, 0, '#3f7a2d', 'OakLeavesTop');
  add('box', 0.7, 0.2, 0.5, 0.8, 0.08, 0.35, 0, 0.5, 0, '#a0522d', 'OakBenchSeat');
  add('cylinder', 0.5, 0.1, 0.4, 0.06, 0.2, 0.06, 0, 0, 0, '#4d4d4d', 'OakBenchLeg1');
  add('cylinder', 0.9, 0.1, 0.6, 0.06, 0.2, 0.06, 0, 0, 0, '#4d4d4d', 'OakBenchLeg2');
  return o;
}

function makePineTree() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#4A2F13', name = 'Pine') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  add('cylinder', 0, 0.6, 0, 0.25, 1.2, 0.25, 0, 0, 0, '#4A2F13', 'PineTrunk');
  add('cone', 0, 0.9, 0, 1.6, 0.9, 1.6, 0, 0, 0, '#1B4D3E', 'PineLayer1');
  add('cone', 0, 1.4, 0, 1.3, 0.8, 1.3, 0, 0, 0, '#1B4D3E', 'PineLayer2');
  add('cone', 0, 1.85, 0, 1.0, 0.7, 1.0, 0, 0, 0, '#225E4D', 'PineLayer3');
  add('cone', 0, 2.25, 0, 0.75, 0.6, 0.75, 0, 0, 0, '#225E4D', 'PineLayer4');
  add('cone', 0, 2.65, 0, 0.45, 0.5, 0.45, 0, 0, 0, '#2D725F', 'PineLayer5');
  add('cylinder', -0.5, 0.75, 0.3, 0.08, 0.16, 0.08, 0.2, 0, 0, '#5C4033', 'Pinecone1');
  add('cylinder', 0.6, 1.1, -0.2, 0.08, 0.16, 0.08, -0.3, 0, 0, '#5C4033', 'Pinecone2');
  add('cylinder', -0.4, 1.5, -0.4, 0.07, 0.14, 0.07, 0, 0, 0.2, '#5C4033', 'Pinecone3');
  add('cylinder', 0.4, 1.6, 0.4, 0.07, 0.14, 0.07, 0, 0, -0.2, '#5C4033', 'Pinecone4');
  return o;
}

function makeBirchTree() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#EBEBEB', name = 'Birch') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  add('cylinder', 0, 1.1, 0, 0.2, 2.2, 0.2, 0, 0, 0, '#EBEBEB', 'BirchTrunk');
  add('box', 0, 0.4, 0.1, 0.22, 0.04, 0.02, 0, 0.1, 0, '#1A1A1A', 'BirchStripe1');
  add('box', 0.1, 0.7, -0.05, 0.02, 0.04, 0.22, 0, -0.3, 0, '#1A1A1A', 'BirchStripe2');
  add('box', -0.1, 1.0, -0.08, 0.22, 0.04, 0.02, 0, 0.5, 0, '#1A1A1A', 'BirchStripe3');
  add('box', 0.05, 1.3, 0.08, 0.02, 0.05, 0.22, 0, 1.2, 0, '#1A1A1A', 'BirchStripe4');
  add('box', -0.08, 1.6, 0.05, 0.22, 0.04, 0.02, 0, -0.8, 0, '#1A1A1A', 'BirchStripe5');
  add('box', 0, 1.9, -0.1, 0.02, 0.04, 0.22, 0, 0.2, 0, '#1A1A1A', 'BirchStripe6');
  add('cylinder', -0.2, 1.6, 0.15, 0.08, 0.8, 0.08, 0.4, 0, -0.3, '#EBEBEB', 'BirchBranch1');
  add('cylinder', 0.2, 1.8, -0.15, 0.08, 0.8, 0.08, -0.4, 0, 0.3, '#EBEBEB', 'BirchBranch2');
  add('sphere', -0.4, 2.1, 0.3, 0.8, 0.7, 0.8, 0, 0, 0, '#559C55', 'BirchLeaves1');
  add('sphere', 0.4, 2.3, -0.3, 0.8, 0.7, 0.8, 0, 0, 0, '#559C55', 'BirchLeaves2');
  add('sphere', -0.1, 2.5, -0.1, 0.7, 0.7, 0.7, 0, 0, 0, '#68B268', 'BirchLeaves3');
  add('sphere', 0.2, 2.6, 0.2, 0.6, 0.6, 0.6, 0, 0, 0, '#7CC77C', 'BirchLeaves4');
  return o;
}

function makeMapleTree() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#5C3E26', name = 'Maple') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  add('cylinder', 0, 0.7, 0, 0.3, 1.4, 0.3, 0, 0, 0, '#5C3E26', 'MapleTrunk');
  add('cylinder', -0.2, 1.1, 0.1, 0.12, 0.6, 0.12, 0, 0, -0.4, '#5C3E26', 'MapleBranch1');
  add('cylinder', 0.2, 1.2, -0.1, 0.12, 0.6, 0.12, 0, 0, 0.4, '#5C3E26', 'MapleBranch2');
  add('sphere', 0, 1.7, 0, 1.2, 1.0, 1.2, 0, 0, 0, '#D35400', 'MapleLeavesMain');
  add('sphere', -0.5, 1.8, 0.4, 0.85, 0.8, 0.85, 0, 0, 0, '#C0392B', 'MapleLeavesL');
  add('sphere', 0.5, 1.9, -0.4, 0.85, 0.8, 0.85, 0, 0, 0, '#E67E22', 'MapleLeavesR');
  add('sphere', 0.3, 2.1, 0.3, 0.75, 0.75, 0.75, 0, 0, 0, '#F39C12', 'MapleLeavesT1');
  add('sphere', -0.3, 2.2, -0.3, 0.75, 0.75, 0.75, 0, 0, 0, '#C0392B', 'MapleLeavesT2');
  add('box', 0.5, 0.02, 0.5, 0.25, 0.01, 0.15, 0, 0.2, 0, '#D35400', 'MapleFallen1');
  add('box', -0.6, 0.02, -0.3, 0.2, 0.01, 0.2, 0, 0.8, 0, '#C0392B', 'MapleFallen2');
  add('box', 0.2, 0.02, -0.7, 0.15, 0.01, 0.25, 0, -0.4, 0, '#E67E22', 'MapleFallen3');
  add('box', -0.4, 0.02, 0.6, 0.2, 0.01, 0.2, 0, 1.1, 0, '#F39C12', 'MapleFallen4');
  return o;
}

function makeCherryTree() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#3A2E2B', name = 'Cherry') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  add('cylinder', 0, 0.5, 0, 0.28, 1.0, 0.28, 0, 0, 0, '#3A2E2B', 'CherryTrunk');
  add('cylinder', -0.3, 0.9, 0.2, 0.16, 0.8, 0.16, 0.4, 0.3, -0.4, '#3A2E2B', 'CherryBranch1');
  add('cylinder', 0.3, 1.0, -0.2, 0.16, 0.8, 0.16, -0.4, -0.3, 0.4, '#3A2E2B', 'CherryBranch2');
  add('cylinder', -0.1, 1.2, -0.3, 0.12, 0.6, 0.12, -0.5, 0.2, -0.2, '#3A2E2B', 'CherryBranch3');
  add('sphere', -0.5, 1.4, 0.4, 0.9, 0.8, 0.9, 0, 0, 0, '#FFB7C5', 'CherryBlossoms1');
  add('sphere', 0.5, 1.5, -0.4, 0.9, 0.8, 0.9, 0, 0, 0, '#FFA0B4', 'CherryBlossoms2');
  add('sphere', -0.2, 1.7, -0.5, 0.8, 0.8, 0.8, 0, 0, 0, '#FFB7C5', 'CherryBlossoms3');
  add('sphere', 0.3, 1.8, 0.3, 0.8, 0.8, 0.8, 0, 0, 0, '#FFC0CB', 'CherryBlossoms4');
  add('sphere', 0.0, 2.0, 0.0, 0.9, 0.8, 0.9, 0, 0, 0, '#FFA0B4', 'CherryBlossomsTop');
  add('box', 0.4, 0.02, 0.4, 0.15, 0.01, 0.15, 0, 0.4, 0, '#FFB7C5', 'CherryPetal1');
  add('box', -0.5, 0.02, -0.4, 0.12, 0.01, 0.12, 0, 1.1, 0, '#FFA0B4', 'CherryPetal2');
  add('box', 0.1, 0.02, -0.5, 0.18, 0.01, 0.12, 0, -0.5, 0, '#FFC0CB', 'CherryPetal3');
  add('box', -0.3, 0.02, 0.5, 0.14, 0.01, 0.14, 0, 0.8, 0, '#FFB7C5', 'CherryPetal4');
  return o;
}

function makePalmTree() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#8b7a6a', name = 'Palm') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  add('cylinder', 0, 0.2, 0, 0.2, 0.4, 0.2, 0, 0, 0, '#8b7a6a', 'PalmTrunk1');
  add('cylinder', 0.05, 0.6, 0.02, 0.19, 0.4, 0.19, 0.05, 0, 0, '#8b7a6a', 'PalmTrunk2');
  add('cylinder', 0.12, 1.0, 0.05, 0.18, 0.4, 0.18, 0.1, 0, 0, '#7a6a5a', 'PalmTrunk3');
  add('cylinder', 0.22, 1.38, 0.1, 0.17, 0.4, 0.17, 0.15, 0, 0, '#7a6a5a', 'PalmTrunk4');
  add('cylinder', 0.35, 1.75, 0.17, 0.16, 0.4, 0.16, 0.2, 0, 0, '#6a5a4a', 'PalmTrunk5');
  add('sphere', 0.3, 1.85, 0.2, 0.18, 0.18, 0.18, 0, 0, 0, '#4d3319', 'Coconut1');
  add('sphere', 0.4, 1.88, 0.1, 0.18, 0.18, 0.18, 0, 0, 0, '#4d3319', 'Coconut2');
  add('wedge', 0.35, 2.0, 0.17, 0.3, 1.2, 0.08, 0.4, 0, 0, '#2e7a3c', 'PalmFrond1');
  add('wedge', 0.35, 2.0, 0.17, 0.3, 1.2, 0.08, -0.4, Math.PI, 0, '#2e7a3c', 'PalmFrond2');
  add('wedge', 0.35, 2.0, 0.17, 0.3, 1.2, 0.08, 0, Math.PI/2, 0.4, '#2d6d37', 'PalmFrond3');
  add('wedge', 0.35, 2.0, 0.17, 0.3, 1.2, 0.08, 0, -Math.PI/2, -0.4, '#2d6d37', 'PalmFrond4');
  add('wedge', 0.35, 2.0, 0.17, 0.3, 1.2, 0.08, 0.28, Math.PI/4, 0.28, '#388e4c', 'PalmFrond5');
  add('wedge', 0.35, 2.0, 0.17, 0.3, 1.2, 0.08, -0.28, -Math.PI*3/4, -0.28, '#388e4c', 'PalmFrond6');
  add('wedge', 0.35, 2.0, 0.17, 0.3, 1.2, 0.08, 0.28, -Math.PI/4, -0.28, '#388e4c', 'PalmFrond7');
  add('wedge', 0.35, 2.0, 0.17, 0.3, 1.2, 0.08, -0.28, Math.PI*3/4, 0.28, '#388e4c', 'PalmFrond8');
  return o;
}

function makeBaobabTree() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#7a6a5a', name = 'Baobab') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  add('cylinder', 0, 0.7, 0, 0.9, 1.4, 0.9, 0, 0, 0, '#7a6a5a', 'BaobabTrunk');
  add('cylinder', -0.5, 1.3, 0.3, 0.35, 0.8, 0.35, 0.4, 0, -0.3, '#7a6a5a', 'BaobabBranch1');
  add('cylinder', 0.5, 1.3, -0.3, 0.35, 0.8, 0.35, -0.4, 0, 0.3, '#7a6a5a', 'BaobabBranch2');
  add('cylinder', 0.2, 1.4, 0.5, 0.3, 0.7, 0.3, 0.5, 0.4, 0, '#7a6a5a', 'BaobabBranch3');
  add('cylinder', -0.3, 1.4, -0.5, 0.3, 0.7, 0.3, -0.5, -0.4, 0, '#7a6a5a', 'BaobabBranch4');
  add('sphere', -0.7, 1.8, 0.4, 0.9, 0.5, 0.9, 0, 0, 0, '#2d6a4f', 'BaobabFoliage1');
  add('sphere', 0.7, 1.8, -0.4, 0.9, 0.5, 0.9, 0, 0, 0, '#2d6a4f', 'BaobabFoliage2');
  add('sphere', 0.3, 1.9, 0.7, 0.8, 0.45, 0.8, 0, 0, 0, '#40916c', 'BaobabFoliage3');
  add('sphere', -0.4, 1.9, -0.7, 0.8, 0.45, 0.8, 0, 0, 0, '#40916c', 'BaobabFoliage4');
  add('sphere', 0.0, 2.0, 0.0, 1.2, 0.6, 1.2, 0, 0, 0, '#1b4332', 'BaobabFoliageTop');
  return o;
}

function makeCypressTree() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#4d3b2c', name = 'Cypress') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  add('cylinder', 0, 0.5, 0, 0.18, 1.0, 0.18, 0, 0, 0, '#4d3b2c', 'CypressTrunk');
  add('cylinder', 0, 1.4, 0, 0.55, 1.8, 0.55, 0, 0, 0, '#1b3a24', 'CypressCol1');
  add('cylinder', 0, 2.3, 0, 0.4, 1.2, 0.4, 0, 0, 0, '#224d30', 'CypressCol2');
  add('cone', 0, 3.0, 0, 0.25, 0.8, 0.25, 0, 0, 0, '#2a5e3b', 'CypressCone');
  add('cylinder', 0.1, 1.3, 0.1, 0.25, 0.8, 0.25, 0, 0, 0, '#1b3a24', 'CypressDet1');
  add('cylinder', -0.1, 1.6, -0.1, 0.22, 0.8, 0.22, 0, 0, 0, '#224d30', 'CypressDet2');
  add('cylinder', 0.08, 2.0, -0.08, 0.2, 0.6, 0.2, 0, 0, 0, '#2a5e3b', 'CypressDet3');
  add('cylinder', -0.08, 1.1, 0.08, 0.24, 0.6, 0.24, 0, 0, 0, '#1b3a24', 'CypressDet4');
  return o;
}

function makeWillowTree() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#4A3B32', name = 'Willow') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  add('cylinder', 0, 0.6, 0, 0.35, 1.2, 0.35, 0, 0, 0, '#4A3B32', 'WillowTrunk');
  add('cylinder', -0.3, 1.1, 0.2, 0.18, 0.8, 0.18, 0.5, 0, -0.3, '#4A3B32', 'WillowBranch1');
  add('cylinder', 0.3, 1.1, -0.2, 0.18, 0.8, 0.18, -0.5, 0, 0.3, '#4A3B32', 'WillowBranch2');
  add('sphere', -0.4, 1.7, 0.3, 1.1, 0.8, 1.1, 0, 0, 0, '#6B8E23', 'WillowCanopyL');
  add('sphere', 0.4, 1.7, -0.3, 1.1, 0.8, 1.1, 0, 0, 0, '#6B8E23', 'WillowCanopyR');
  add('sphere', 0, 2.0, 0, 1.2, 0.9, 1.2, 0, 0, 0, '#8FBC8F', 'WillowCanopyTop');
  add('cylinder', -0.8, 1.1, 0.4, 0.06, 0.9, 0.06, 0, 0, 0, '#9ACD32', 'WillowVine1');
  add('cylinder', -0.4, 1.0, 0.8, 0.06, 0.8, 0.06, 0, 0, 0, '#9ACD32', 'WillowVine2');
  add('cylinder', 0.8, 1.1, -0.4, 0.06, 0.9, 0.06, 0, 0, 0, '#8FBC8F', 'WillowVine3');
  add('cylinder', 0.4, 1.0, -0.8, 0.06, 0.8, 0.06, 0, 0, 0, '#8FBC8F', 'WillowVine4');
  add('cylinder', -0.2, 1.0, -0.6, 0.05, 1.0, 0.05, 0, 0, 0, '#9ACD32', 'WillowVine5');
  add('cylinder', 0.6, 1.0, 0.6, 0.05, 1.0, 0.05, 0, 0, 0, '#9ACD32', 'WillowVine6');
  return o;
}

function makeCathedral() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#7d8a99', name = 'Cath') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };

  add('box', 0, 1.2, 0, 1.8, 2.4, 4.5, 0, 0, 0, '#7d8a99', 'Nave');
  add('box', -1.3, 0.8, 0, 0.8, 1.6, 3.6, 0, 0, 0, '#6c7987', 'AisleL');
  add('box', 1.3, 0.8, 0, 0.8, 1.6, 3.6, 0, 0, 0, '#6c7987', 'AisleR');
  add('box', -1.1, 1.2, -0.6, 0.8, 2.4, 1.2, 0, 0, 0, '#7d8a99', 'TranseptL');
  add('box', 1.1, 1.2, -0.6, 0.8, 2.4, 1.2, 0, 0, 0, '#7d8a99', 'TranseptR');

  add('wedge', 0, 2.9, -1.12, 1.8, 1.0, 2.25, 0, 0, 0, '#3d4a59', 'RoofL');
  add('wedge', 0, 2.9, 1.12, 1.8, 1.0, 2.25, 0, Math.PI, 0, '#3d4a59', 'RoofR');

  add('box', -0.9, 2.2, 2.35, 0.8, 4.4, 0.8, 0, 0, 0, '#6c7987', 'TowerL');
  add('box', 0.9, 2.2, 2.35, 0.8, 4.4, 0.8, 0, 0, 0, '#6c7987', 'TowerR');
  add('cone', -0.9, 5.2, 2.35, 0.9, 1.6, 0.9, 0, 0, 0, '#cda250', 'SpireL');
  add('cone', 0.9, 5.2, 2.35, 0.9, 1.6, 0.9, 0, 0, 0, '#cda250', 'SpireR');

  add('box', -0.9, 6.2, 2.35, 0.08, 0.5, 0.08, 0, 0, 0, '#cda250', 'CrossVL');
  add('box', -0.9, 6.1, 2.35, 0.3, 0.08, 0.08, 0, 0, 0, '#cda250', 'CrossHL');
  add('box', 0.9, 6.2, 2.35, 0.08, 0.5, 0.08, 0, 0, 0, '#cda250', 'CrossVR');
  add('box', 0.9, 6.1, 2.35, 0.3, 0.08, 0.08, 0, 0, 0, '#cda250', 'CrossHR');

  add('torus', 0, 2.4, 2.26, 1.0, 1.0, 0.1, 0, 0, 0, '#cda250', 'RoseWin');
  add('box', 0, 0.5, 2.26, 0.6, 1.0, 0.05, 0, 0, 0, '#7d8a99', 'DoorArch');
  add('box', 0, 0.45, 2.28, 0.4, 0.9, 0.05, 0, 0, 0, '#4a3525', 'DoorLeft');
  add('box', -0.9, 0.4, 2.76, 0.4, 0.8, 0.05, 0, 0, 0, '#4a3525', 'DoorL');
  add('box', 0.9, 0.4, 2.76, 0.4, 0.8, 0.05, 0, 0, 0, '#4a3525', 'DoorR');

  for (let i = 0; i < 5; i++) {
    const z = -1.8 + i * 0.9;
    add('wedge', -1.75, 0.7, z, 0.3, 1.4, 0.3, 0, -Math.PI/2, 0, '#6c7987', `ButtressL_${i}`);
    add('wedge', 1.75, 0.7, z, 0.3, 1.4, 0.3, 0, Math.PI/2, 0, '#6c7987', `ButtressR_${i}`);
  }

  for (let i = 0; i < 6; i++) {
    const z = -1.5 + i * 0.6;
    add('box', -1.71, 0.9, z, 0.05, 0.6, 0.25, 0, 0, 0, '#add8e6', `WinL_${i}`);
    add('box', 1.71, 0.9, z, 0.05, 0.6, 0.25, 0, 0, 0, '#add8e6', `WinR_${i}`);
  }

  for (let i = 0; i < 4; i++) {
    const x = -0.75 + i * 0.5;
    add('cylinder', x, 0.5, 2.6, 0.08, 1.0, 0.08, 0, 0, 0, '#d1d5db', `FrontPill_${i}`);
    add('box', x, 1.0, 2.6, 0.12, 0.05, 0.12, 0, 0, 0, '#9ca3af', `FrontPillCap_${i}`);
  }

  for (let i = 0; i < 3; i++) {
    const z = -1.2 + i * 1.2;
    add('cone', -0.9, 2.6, z, 0.2, 0.8, 0.2, 0, 0, 0, '#cda250', `SpireSmallL_${i}`);
    add('cone', 0.9, 2.6, z, 0.2, 0.8, 0.2, 0, 0, 0, '#cda250', `SpireSmallR_${i}`);
  }

  return o;
}

function makeMegamall() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#edf2f7', name = 'Mall') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };

  add('box', 0, 0.4, 0, 5.0, 0.8, 5.0, 0, 0, 0, '#e2e8f0', 'MainBody');
  add('box', 0, 1.1, 0, 4.0, 0.6, 4.0, 0, 0, 0, '#cbd5e0', 'UpperBody');
  add('sphere', 0, 1.3, 0, 2.0, 1.2, 2.0, 0, 0, 0, '#63b3ed', 'GlassDome');

  add('box', 0, 0.4, 2.6, 1.6, 0.8, 0.4, 0, 0, 0, '#4fd1c5', 'EntrLobby');
  add('box', 0, 0.85, 2.7, 2.0, 0.1, 0.8, 0.2, 0, 0, '#319795', 'EntrCanopy');
  add('cylinder', -0.9, 0.4, 2.9, 0.1, 0.8, 0.1, 0, 0, 0, '#718096', 'EntrPillarL');
  add('cylinder', 0.9, 0.4, 2.9, 0.1, 0.8, 0.1, 0, 0, 0, '#718096', 'EntrPillarR');
  add('box', 0, 1.2, 2.6, 1.2, 0.4, 0.1, 0, 0, 0, '#e53e3e', 'LogoSign');

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      const x = -1.5 + i * 1.5;
      const z = -1.6 + j * 0.7;
      add('box', x, 1.45, z, 0.8, 0.05, 0.5, 0.3, 0, 0, '#1a365d', `Solar_${i}_${j}`);
    }
  }

  const carColors = ['#e53e3e', '#3182ce', '#38a169', '#dd6b20', '#718096', '#319795'];
  for (let i = 0; i < 6; i++) {
    const x = -2.0 + i * 0.8;
    add('box', x, 0.1, -2.2, 0.4, 0.18, 0.7, 0, 0, 0, carColors[i % carColors.length], `CarA_${i}`);
    add('box', x, 0.1, -2.6, 0.4, 0.18, 0.7, 0, 0, 0, carColors[(i+2) % carColors.length], `CarB_${i}`);
  }

  for (let i = 0; i < 3; i++) {
    const z = -1.5 + i * 1.5;
    add('cylinder', -2.7, 0.4, z, 0.1, 0.8, 0.1, 0, 0, 0, '#744210', `TreeTrunkL_${i}`);
    add('sphere', -2.7, 0.9, z, 0.6, 0.6, 0.6, 0, 0, 0, '#276749', `TreeCanopyL_${i}`);
    add('cylinder', 2.7, 0.4, z, 0.1, 0.8, 0.1, 0, 0, 0, '#744210', `TreeTrunkR_${i}`);
    add('sphere', 2.7, 0.9, z, 0.6, 0.6, 0.6, 0, 0, 0, '#276749', `TreeCanopyR_${i}`);
  }

  for (let i = 0; i < 12; i++) {
    const angle = (i * Math.PI) / 6;
    const x = Math.cos(angle) * 1.0;
    const z = Math.sin(angle) * 1.0;
    add('cylinder', x, 1.4, z, 0.04, 0.4, 0.04, 0, angle, Math.PI/2, '#4a5568', `DomeBeam_${i}`);
  }

  return o;
}

function makeTechHQ() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#1a202c', name = 'Tech') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };

  add('box', -0.5, 0.6, -0.5, 2.8, 1.2, 2.2, 0, 0.1, 0, '#2d3748', 'BlockA');
  add('box', 0.8, 1.1, 0.6, 2.2, 1.0, 2.2, 0, -0.2, 0, '#4a5568', 'BlockB');
  add('box', -0.2, 1.8, 0.2, 2.0, 0.8, 2.0, 0, 0.3, 0, '#718096', 'BlockC');
  add('box', 0.4, 2.5, -0.4, 1.4, 0.6, 1.4, 0, -0.1, 0, '#cbd5e0', 'BlockD');

  add('cylinder', 0.4, 2.81, -0.4, 1.1, 0.02, 1.1, 0, 0, 0, '#718096', 'Helipad');
  add('box', 0.4, 2.82, -0.4, 0.1, 0.02, 0.8, 0, 0, 0, '#ffffff', 'HLineV');
  add('box', 0.4, 2.82, -0.4, 0.5, 0.02, 0.1, 0, 0, 0, '#ffffff', 'HLineH');
  add('cylinder', 0.4, 2.82, -0.4, 0.95, 0.02, 0.95, 0, 0, 0, '#e53e3e', 'HelipadRing');

  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI) / 4.5;
    const xA = -0.5 + Math.cos(angle) * 1.45;
    const zA = -0.5 + Math.sin(angle) * 1.15;
    add('box', xA, 0.6, zA, 0.06, 1.0, 0.2, 0, angle, 0, '#3182ce', `GlassA_${i}`);

    const xB = 0.8 + Math.cos(angle) * 1.15;
    const zB = 0.6 + Math.sin(angle) * 1.15;
    add('box', xB, 1.1, zB, 0.06, 0.8, 0.2, 0, angle, 0, '#3182ce', `GlassB_${i}`);
  }

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const px = Math.cos(angle) * 2.2;
    const pz = Math.sin(angle) * 2.2;
    add('cylinder', px, 0.6, pz, 0.05, 1.2, 0.05, 0, 0, 0, '#a0aec0', `LightPole_${i}`);
    add('sphere', px, 1.25, pz, 0.16, 0.16, 0.16, 0, 0, 0, '#fff', `LightSphere_${i}`);
  }

  for (let i = 0; i < 5; i++) {
    const angle = (i * Math.PI) / 2;
    const tx = -0.2 + Math.cos(angle) * 0.8;
    const tz = 0.2 + Math.sin(angle) * 0.8;
    add('cylinder', tx, 2.3, tz, 0.06, 0.4, 0.06, 0, 0, 0, '#744210', `GardenTrunk_${i}`);
    add('sphere', tx, 2.6, tz, 0.35, 0.35, 0.35, 0, 0, 0, '#48bb78', `GardenCanopy_${i}`);
  }

  add('cylinder', -0.1, 2.9, -0.9, 0.04, 1.0, 0.04, 0, 0, 0, '#fff', `Antenna1`);
  add('sphere', -0.1, 3.4, -0.9, 0.12, 0.12, 0.12, 0, 0, 0, '#e53e3e', `AntennaBall1`);
  add('cylinder', 0.9, 2.9, 0.1, 0.04, 0.8, 0.04, 0, 0, 0, '#fff', `Antenna2`);
  add('box', -0.8, 2.3, 0.8, 0.4, 0.3, 0.4, 0, 0.3, 0, '#a0aec0', `HVAC1`);
  add('box', -0.5, 2.3, 0.8, 0.3, 0.25, 0.3, 0, 0.3, 0, '#718096', `HVAC2`);
  add('box', 0.7, 1.7, -0.7, 0.5, 0.3, 0.5, 0, -0.2, 0, '#a0aec0', `HVAC3`);
  add('box', 1.0, 1.7, -0.5, 0.3, 0.25, 0.3, 0, -0.2, 0, '#718096', `HVAC4`);
  add('cylinder', 0.7, 1.9, -0.7, 0.2, 0.1, 0.2, 0, 0, 0, '#4a5568', `HVACFan1`);
  add('cylinder', 1.0, 1.85, -0.5, 0.12, 0.1, 0.12, 0, 0, 0, '#4a5568', `HVACFan2`);
  add('box', 0, 0.4, 1.8, 1.0, 0.8, 0.1, 0, 0.3, 0, '#ecc94b', `LogoBanner`);

  return o;
}

function makeResort() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#f7fafc', name = 'Resort') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };

  add('box', -2.0, 0.7, -1.0, 1.2, 1.4, 2.6, 0, 0, 0, '#f7fafc', 'WingLeft');
  add('box', 2.0, 0.7, -1.0, 1.2, 1.4, 2.6, 0, 0, 0, '#f7fafc', 'WingRight');
  add('box', 0, 0.8, -1.8, 3.2, 1.6, 1.0, 0, 0, 0, '#edf2f7', 'WingCenter');

  add('box', 0, 0.05, 0.4, 2.4, 0.1, 1.8, 0, 0, 0, '#3182ce', 'PoolWater');
  add('box', 0, 0.02, 0.4, 2.6, 0.08, 2.0, 0, 0, 0, '#e2e8f0', 'PoolBorder');

  for (let i = 0; i < 4; i++) {
    const z = -0.3 + i * 0.5;
    add('wedge', -1.5, 0.12, z, 0.25, 0.15, 0.4, 0, Math.PI/2, 0, '#ffffff', `LoungerL_${i}`);
    add('cylinder', -1.8, 0.3, z, 0.03, 0.6, 0.03, 0, 0, 0, '#a0aec0', `UmbrellaPoleL_${i}`);
    add('cone', -1.8, 0.6, z, 0.4, 0.18, 0.4, 0, 0, 0, '#ecc94b', `UmbrellaTopL_${i}`);

    add('wedge', 1.5, 0.12, z, 0.25, 0.15, 0.4, 0, -Math.PI/2, 0, '#ffffff', `LoungerR_${i}`);
    add('cylinder', 1.8, 0.3, z, 0.03, 0.6, 0.03, 0, 0, 0, '#a0aec0', `UmbrellaPoleR_${i}`);
    add('cone', 1.8, 0.6, z, 0.4, 0.18, 0.4, 0, 0, 0, '#ecc94b', `UmbrellaTopR_${i}`);
  }

  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 3.5;
    const px = Math.cos(angle) * 2.5;
    const pz = 0.5 + Math.sin(angle) * 1.6;
    add('cylinder', px, 0.6, pz, 0.08, 1.2, 0.08, 0.15, angle, 0, '#744210', `PalmTrunk_${i}`);
    add('cone', px, 1.25, pz, 0.7, 0.25, 0.7, 0, angle, 0, '#276749', `PalmLeaves_${i}`);
  }

  add('box', -2.0, 0.3, 1.2, 0.8, 0.6, 0.8, 0, 0, 0, '#e2e8f0', 'VillaL');
  add('wedge', -2.0, 0.7, 1.2, 0.9, 0.3, 0.9, 0, Math.PI/2, 0, '#9b2c2c', 'VillaRoofL');
  add('box', 2.0, 0.3, 1.2, 0.8, 0.6, 0.8, 0, 0, 0, '#e2e8f0', 'VillaR');
  add('wedge', 2.0, 0.7, 1.2, 0.9, 0.3, 0.9, 0, -Math.PI/2, 0, '#9b2c2c', 'VillaRoofR');

  add('cylinder', 0, 0.3, -1.0, 0.6, 0.6, 0.6, 0, 0, 0, '#744210', 'GazeboBase');
  add('cylinder', -0.25, 0.6, -1.0, 0.04, 0.6, 0.04, 0, 0, 0, '#a0aec0', 'GazeboPill1');
  add('cylinder', 0.25, 0.6, -1.0, 0.04, 0.6, 0.04, 0, 0, 0, '#a0aec0', 'GazeboPill2');
  add('cone', 0, 1.05, -1.0, 0.7, 0.3, 0.7, 0, 0, 0, '#dd6b20', 'GazeboRoof');

  add('box', 0, 0.7, -2.4, 1.2, 0.1, 0.6, 0.1, 0, 0, '#4fd1c5', 'LobbyCanopy');
  add('cylinder', -0.55, 0.35, -2.6, 0.06, 0.7, 0.06, 0, 0, 0, '#cbd5e0', 'LobbyPillL');
  add('cylinder', 0.55, 0.35, -2.6, 0.06, 0.7, 0.06, 0, 0, 0, '#cbd5e0', 'LobbyPillR');

  return o;
}

function makeNuclear() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#cbd5e0', name = 'Nuke') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };

  const buildTower = (tx, tz, suffix) => {
    add('cylinder', tx, 0.3, tz, 1.6, 0.6, 1.6, 0, 0, 0, '#a0aec0', `TowerBase_${suffix}`);
    add('cylinder', tx, 0.8, tz, 1.3, 0.4, 1.3, 0, 0, 0, '#a0aec0', `TowerMid1_${suffix}`);
    add('cylinder', tx, 1.2, tz, 1.1, 0.4, 1.1, 0, 0, 0, '#718096', `TowerMid2_${suffix}`);
    add('cylinder', tx, 1.6, tz, 1.05, 0.4, 1.05, 0, 0, 0, '#718096', `TowerThroat_${suffix}`);
    add('cylinder', tx, 2.0, tz, 1.25, 0.4, 1.25, 0, 0, 0, '#a0aec0', `TowerRim_${suffix}`);
    add('torus', tx, 2.2, tz, 1.2, 1.2, 0.1, Math.PI/2, 0, 0, '#e53e3e', `TowerBand_${suffix}`);
  };
  buildTower(-1.5, -1.0, 'A');
  buildTower(1.5, -1.0, 'B');

  add('cylinder', -1.5, 0.4, 1.5, 1.4, 0.8, 1.4, 0, 0, 0, '#cbd5e0', 'ReactorA_Base');
  add('sphere', -1.5, 0.8, 1.5, 1.35, 1.0, 1.35, 0, 0, 0, '#a0aec0', 'ReactorA_Dome');
  add('cylinder', 1.5, 0.4, 1.5, 1.4, 0.8, 1.4, 0, 0, 0, '#cbd5e0', 'ReactorB_Base');
  add('sphere', 1.5, 0.8, 1.5, 1.35, 1.0, 1.35, 0, 0, 0, '#a0aec0', 'ReactorB_Dome');

  add('box', 0, 0.6, 0.4, 1.8, 1.2, 2.2, 0, 0, 0, '#cbd5e0', 'TurbineHall');
  add('wedge', 0, 1.35, 0.4, 1.9, 0.3, 2.3, 0, 0, 0, '#4a5568', 'TurbineRoof');
  add('box', 0, 0.4, 1.6, 1.2, 0.8, 0.2, 0, 0, 0, '#718096', 'TurbineAnnex');

  add('cylinder', -0.5, 1.5, 1.8, 0.22, 3.0, 0.22, 0, 0, 0, '#e2e8f0', 'ChimneyA');
  add('torus', -0.5, 2.8, 1.8, 0.23, 0.23, 0.08, Math.PI/2, 0, 0, '#e53e3e', 'ChimneyA_Band1');
  add('torus', -0.5, 2.2, 1.8, 0.23, 0.23, 0.08, Math.PI/2, 0, 0, '#e53e3e', 'ChimneyA_Band2');

  add('cylinder', 0.5, 1.5, 1.8, 0.22, 3.0, 0.22, 0, 0, 0, '#e2e8f0', 'ChimneyB');
  add('torus', 0.5, 2.8, 1.8, 0.23, 0.23, 0.08, Math.PI/2, 0, 0, '#e53e3e', 'ChimneyB_Band1');
  add('torus', 0.5, 2.2, 1.8, 0.23, 0.23, 0.08, Math.PI/2, 0, 0, '#e53e3e', 'ChimneyB_Band2');

  for (let i = 0; i < 4; i++) {
    const x = -1.2 + i * 0.8;
    add('box', x, 0.25, -2.3, 0.5, 0.5, 0.5, 0, 0, 0, '#4a5568', `Transformer_${i}`);
    add('cylinder', x - 0.15, 0.6, -2.3, 0.04, 0.4, 0.04, 0, 0, 0, '#718096', `SubPoleA_${i}`);
    add('cylinder', x + 0.15, 0.6, -2.3, 0.04, 0.4, 0.04, 0, 0, 0, '#718096', `SubPoleB_${i}`);
  }

  add('cylinder', -0.7, 0.6, 0.4, 0.15, 0.8, 0.15, 0, 0, Math.PI/2, '#4fd1c5', 'PipeA_Horiz');
  add('cylinder', 0.7, 0.6, 0.4, 0.15, 0.8, 0.15, 0, 0, Math.PI/2, '#4fd1c5', 'PipeB_Horiz');
  add('cylinder', -1.5, 0.6, 0.4, 0.15, 1.0, 0.15, Math.PI/2, 0, 0, '#4fd1c5', 'PipeA_ToReactor');
  add('cylinder', 1.5, 0.6, 0.4, 0.15, 1.0, 0.15, Math.PI/2, 0, 0, '#4fd1c5', 'PipeB_ToReactor');
  add('cylinder', -1.5, 0.5, -0.2, 0.12, 0.8, 0.12, Math.PI/2, 0, 0, '#a0aec0', 'PipeA_ToTower');
  add('cylinder', 1.5, 0.5, -0.2, 0.12, 0.8, 0.12, Math.PI/2, 0, 0, '#a0aec0', 'PipeB_ToTower');

  return o;
}

function makeSkyGarden() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#2b6cb0', name = 'Sky') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };

  add('box', 0, 0.8, 0, 2.2, 1.6, 2.2, 0, 0, 0, '#3182ce', 'Lvl1');
  add('box', 0, 2.2, 0, 1.8, 1.2, 1.8, 0, 0.1, 0, '#2b6cb0', 'Lvl2');
  add('box', 0, 3.2, 0, 1.5, 0.8, 1.5, 0, -0.1, 0, '#2b6cb0', 'Lvl3');
  add('box', 0, 4.0, 0, 1.2, 0.8, 1.2, 0, 0.2, 0, '#1a365d', 'Lvl4');
  add('box', 0, 4.7, 0, 0.9, 0.6, 0.9, 0, -0.2, 0, '#1a365d', 'Lvl5');

  add('box', 1.15, 0.8, 0, 0.2, 1.6, 0.6, 0, 0, 0, 'rgba(79,209,197,0.8)', 'Elevator1');
  add('box', 0.95, 2.2, 0, 0.2, 1.2, 0.5, 0, 0.1, 0, 'rgba(79,209,197,0.8)', 'Elevator2');
  add('box', 0.8, 3.2, 0, 0.2, 0.8, 0.4, 0, -0.1, 0, 'rgba(79,209,197,0.8)', 'Elevator3');
  add('box', 0.65, 4.0, 0, 0.2, 0.8, 0.35, 0, 0.2, 0, 'rgba(79,209,197,0.8)', 'Elevator4');
  add('box', 0.5, 4.7, 0, 0.2, 0.6, 0.3, 0, -0.2, 0, 'rgba(79,209,197,0.8)', 'Elevator5');

  const gardenPositions = [
    { x: -0.9, y: 1.6, z: -0.9, r: 0 },
    { x: 0.9, y: 1.6, z: 0.9, r: 0 },
    { x: -0.7, y: 2.8, z: 0.7, r: 0.1 },
    { x: 0.7, y: 2.8, z: -0.7, r: 0.1 },
    { x: -0.5, y: 3.6, z: -0.5, r: -0.1 },
    { x: 0.5, y: 4.4, z: 0.5, r: 0.2 },
  ];
  gardenPositions.forEach((g, idx) => {
    add('box', g.x, g.y + 0.05, g.z, 0.5, 0.1, 0.5, 0, g.r, 0, '#38a169', `GardenBase_${idx}`);
    add('sphere', g.x, g.y + 0.25, g.z, 0.4, 0.4, 0.4, 0, 0, 0, '#2f855a', `GardenCanopy_${idx}`);
  });

  add('cylinder', 0, 5.3, 0, 0.06, 0.8, 0.06, 0, 0, 0, '#cbd5e0', 'MainAntenna');
  add('sphere', 0, 5.7, 0, 0.12, 0.12, 0.12, 0, 0, 0, '#e53e3e', 'AntennaRedDot');
  add('cylinder', -0.2, 5.1, -0.2, 0.03, 0.5, 0.03, 0, 0, 0, '#cbd5e0', 'SideAntenna');

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const s = 1.11;
    const wx = Math.cos(angle) * s;
    const wz = Math.sin(angle) * s;
    add('box', wx, 0.6, wz, angle % Math.PI === 0 ? 0.04 : 2.22, 0.2, angle % Math.PI === 0 ? 2.22 : 0.04, 0, 0, 0, '#63b3ed', `Ribbon1_${i}`);
    add('box', wx, 1.1, wz, angle % Math.PI === 0 ? 0.04 : 2.22, 0.2, angle % Math.PI === 0 ? 2.22 : 0.04, 0, 0, 0, '#63b3ed', `Ribbon2_${i}`);
  }

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 + 0.1;
    const s = 0.91;
    const wx = Math.cos(angle) * s;
    const wz = Math.sin(angle) * s;
    add('box', wx, 2.0, wz, angle % Math.PI === 0 ? 0.04 : 1.82, 0.15, angle % Math.PI === 0 ? 1.82 : 0.04, 0, 0.1, 0, '#63b3ed', `Ribbon3_${i}`);
    add('box', wx, 2.4, wz, angle % Math.PI === 0 ? 0.04 : 1.82, 0.15, angle % Math.PI === 0 ? 1.82 : 0.04, 0, 0.1, 0, '#63b3ed', `Ribbon4_${i}`);
  }

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2 - 0.1;
    const s = 0.76;
    const wx = Math.cos(angle) * s;
    const wz = Math.sin(angle) * s;
    add('box', wx, 3.1, wz, angle % Math.PI === 0 ? 0.04 : 1.52, 0.12, angle % Math.PI === 0 ? 1.52 : 0.04, 0, -0.1, 0, '#63b3ed', `Ribbon5_${i}`);
    add('box', wx, 3.4, wz, angle % Math.PI === 0 ? 0.04 : 1.52, 0.12, angle % Math.PI === 0 ? 1.52 : 0.04, 0, -0.1, 0, '#63b3ed', `Ribbon6_${i}`);
  }

  return o;
}

function makeCargoPort() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#718096', name = 'Port') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };

  add('box', 0, 0.05, 0, 5.0, 0.1, 3.6, 0, 0, 0, '#4a5568', 'DockPier');

  add('cylinder', -1.8, 0.8, -1.0, 0.08, 1.5, 0.08, 0.2, 0, 0, '#dd6b20', 'CraneLegFL');
  add('cylinder', -1.8, 0.8, -0.4, 0.08, 1.5, 0.08, -0.2, 0, 0, '#dd6b20', 'CraneLegFR');
  add('cylinder', -1.0, 0.8, -1.0, 0.08, 1.5, 0.08, 0.2, 0, 0, '#dd6b20', 'CraneLegBL');
  add('cylinder', -1.0, 0.8, -0.4, 0.08, 1.5, 0.08, -0.2, 0, 0, '#dd6b20', 'CraneLegBR');
  add('box', -1.4, 1.5, -0.7, 1.0, 0.1, 0.8, 0, 0, 0, '#ed8936', 'CranePlatform');
  add('box', -1.4, 1.55, 0.1, 0.2, 0.1, 2.2, 0, 0, 0, '#ed8936', 'CraneBoom');
  add('box', -1.4, 1.75, -0.7, 0.5, 0.4, 0.5, 0, 0, 0, '#4a5568', 'CraneCab');
  add('box', -1.4, 1.85, 0.2, 0.15, 0.2, 0.15, 0, 0, 0, '#ecc94b', 'CraneTrolley');
  add('cylinder', -1.4, 1.1, 0.2, 0.02, 1.3, 0.02, 0, 0, 0, '#ffffff', 'CraneCable');
  add('box', -1.4, 0.4, 0.2, 0.3, 0.15, 0.6, 0, 0, 0, '#3182ce', 'CraneHookContainer');

  add('wedge', 2.3, 0.1, 0, 0.8, 0.3, 3.2, 0, 0, Math.PI, '#1a202c', 'ShipHullBack');
  add('wedge', 2.3, 0.1, 1.6, 0.8, 0.3, 0.8, 0, 0, 0, '#1a202c', 'ShipHullFront');
  add('box', 2.3, 0.25, -0.8, 0.7, 0.4, 0.8, 0, 0, 0, '#e2e8f0', 'ShipCabin1');
  add('box', 2.3, 0.55, -0.8, 0.5, 0.3, 0.6, 0, 0, 0, '#cbd5e0', 'ShipCabin2');
  add('cylinder', 2.3, 0.8, -0.8, 0.05, 0.4, 0.05, 0, 0, 0, '#718096', 'ShipAntenna');
  add('box', 2.3, 0.28, 0.1, 0.5, 0.3, 0.8, 0, 0, 0, '#e53e3e', 'ShipContainerRed');
  add('box', 2.3, 0.28, 0.9, 0.5, 0.3, 0.8, 0, 0, 0, '#319795', 'ShipContainerTeal');
  add('box', 2.3, 0.58, 0.1, 0.5, 0.3, 0.8, 0, 0, 0, '#d69e2e', 'ShipContainerYellow');

  const containerColors = ['#e53e3e', '#3182ce', '#38a169', '#d69e2e', '#805ad5', '#dd6b20'];
  let cIdx = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const x = -0.4 + i * 0.75;
      const z = -1.2 + j * 1.4;
      add('box', x, 0.25, z, 0.6, 0.4, 1.2, 0, 0, 0, containerColors[cIdx++ % containerColors.length], `YardContainer_${i}_${j}_L1`);
      if ((i+j) % 2 === 0) {
        add('box', x, 0.65, z + 0.1, 0.6, 0.4, 1.2, 0, 0.08, 0, containerColors[cIdx++ % containerColors.length], `YardContainer_${i}_${j}_L2`);
      }
    }
  }

  add('box', -1.2, 0.2, 1.2, 0.3, 0.3, 0.4, 0, Math.PI/2, 0, '#e53e3e', 'TruckCab');
  add('box', -0.6, 0.22, 1.2, 0.28, 0.28, 0.8, 0, Math.PI/2, 0, '#718096', 'TruckTrailer');
  add('cylinder', -1.2, 0.1, 1.05, 0.1, 0.1, 0.1, 0, 0, Math.PI/2, '#111', 'WheelF1');
  add('cylinder', -1.2, 0.1, 1.35, 0.1, 0.1, 0.1, 0, 0, Math.PI/2, '#111', 'WheelF2');
  add('cylinder', -0.7, 0.1, 1.05, 0.1, 0.1, 0.1, 0, 0, Math.PI/2, '#111', 'WheelB1');
  add('cylinder', -0.7, 0.1, 1.35, 0.1, 0.1, 0.1, 0, 0, Math.PI/2, '#111', 'WheelB2');

  return o;
}

function makeUniversity() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#a28a6f', name = 'Uni') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };

  add('box', 0, 0.8, -1.8, 2.0, 1.6, 1.4, 0, 0, 0, '#a28a6f', 'Library');
  add('sphere', 0, 1.6, -1.8, 1.4, 1.0, 1.4, 0, 0, 0, '#ecc94b', 'LibraryDome');
  add('box', 0, 0.5, -1.05, 0.8, 1.0, 0.2, 0, 0, 0, '#d1d5db', 'LibraryPortico');
  add('cylinder', -0.3, 0.5, -0.92, 0.08, 1.0, 0.08, 0, 0, 0, '#ffffff', 'LibPill1');
  add('cylinder', 0.3, 0.5, -0.92, 0.08, 1.0, 0.08, 0, 0, 0, '#ffffff', 'LibPill2');
  add('cone', 0, 1.1, -1.05, 0.9, 0.3, 0.3, 0, 0, 0, '#9b2c2c', 'LibPediment');

  add('box', -2.0, 0.6, -0.5, 1.0, 1.2, 2.2, 0, 0, 0, '#a28a6f', 'HallLeft');
  add('wedge', -2.0, 1.35, -0.5, 1.1, 0.3, 2.3, 0, 0, 0, '#9b2c2c', 'HallLeftRoof');

  add('box', 2.0, 0.6, -0.5, 1.0, 1.2, 2.2, 0, 0, 0, '#a28a6f', 'HallRight');
  add('wedge', 2.0, 1.35, -0.5, 1.1, 0.3, 2.3, 0, 0, 0, '#9b2c2c', 'HallRightRoof');

  add('box', 0, 0.15, 0.5, 0.6, 0.3, 0.6, 0, 0, 0, '#cbd5e0', 'ObeliskBase');
  add('cylinder', 0, 1.0, 0.5, 0.15, 1.4, 0.15, 0, 0, 0, '#a0aec0', 'ObeliskShaft');
  add('cone', 0, 1.8, 0.5, 0.18, 0.25, 0.18, 0, 0, 0, '#ecc94b', 'ObeliskTip');

  for (let i = 0; i < 4; i++) {
    const xL = -1.7 + i * 0.4;
    const xR = 1.7 - i * 0.4;
    add('cylinder', xL, 0.45, -1.3, 0.05, 0.9, 0.05, 0, 0, 0, '#cbd5e0', `ColonnadeL_Pill_${i}`);
    add('box', xL, 0.92, -1.3, 0.42, 0.05, 0.1, 0, 0, 0, '#718096', `ColonnadeL_Arch_${i}`);
    add('cylinder', xR, 0.45, -1.3, 0.05, 0.9, 0.05, 0, 0, 0, '#cbd5e0', `ColonnadeR_Pill_${i}`);
    add('box', xR, 0.92, -1.3, 0.42, 0.05, 0.1, 0, 0, 0, '#718096', `ColonnadeR_Arch_${i}`);
  }

  add('box', 0, 0.02, 0.5, 2.6, 0.04, 2.2, 0, 0, 0, '#48bb78', 'QuadGrass');
  add('box', 0, 0.03, 0.5, 0.4, 0.02, 2.2, 0, 0, 0, '#cbd5e0', 'QuadPathV');
  add('box', 0, 0.03, 0.5, 2.6, 0.02, 0.4, 0, 0, 0, '#cbd5e0', 'QuadPathH');

  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    const bx = Math.cos(angle) * 1.0;
    const bz = 0.5 + Math.sin(angle) * 0.8;
    add('box', bx, 0.12, bz, 0.3, 0.12, 0.15, 0, angle, 0, '#744210', `Bench_${i}`);
    add('box', bx, 0.06, bz - 0.12 * Math.sin(angle), 0.02, 0.12, 0.15, 0, angle, 0, '#4a5568', `BenchLeg_${i}`);
  }

  for (let i = 0; i < 6; i++) {
    const x = -2.3 + i * 0.92;
    add('cylinder', x, 0.4, 1.2, 0.06, 0.8, 0.06, 0, 0, 0, '#744210', `CampusTreeTrunk_${i}`);
    add('sphere', x, 0.9, 1.2, 0.5, 0.5, 0.5, 0, 0, 0, '#276749', `CampusTreeCanopy_${i}`);
  }

  return o;
}

function makeEcoDome() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = 'rgba(72,187,120,0.3)', name = 'Dome') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };

  add('cylinder', 0, 0.05, 0, 3.2, 0.1, 3.2, 0, 0, 0, '#a0aec0', 'MainBase');
  add('sphere', 0, 0.5, 0, 2.8, 2.0, 2.8, 0, 0, 0, 'rgba(72,187,120,0.3)', 'CentralGlassDome');
  add('torus', 0, 0.1, 0, 2.8, 2.8, 0.1, Math.PI/2, 0, 0, '#319795', 'MainDomeRim');

  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const px = Math.cos(angle) * 1.9;
    const pz = Math.sin(angle) * 1.9;
    add('cylinder', px, 0.05, pz, 1.1, 0.1, 1.1, 0, 0, 0, '#a0aec0', `SatBase_${i}`);
    add('sphere', px, 0.35, pz, 0.9, 0.7, 0.9, 0, 0, 0, 'rgba(56,161,105,0.4)', `SatDome_${i}`);
    add('cylinder', px / 2, 0.15, pz / 2, 0.25, 0.9, 0.25, Math.PI/2, -angle, 0, '#cbd5e0', `Tunnel_${i}`);
  }

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const dist = 0.5 + (i % 2) * 0.4;
    const tx = Math.cos(angle) * dist;
    const tz = Math.sin(angle) * dist;
    add('cylinder', tx, 0.4, tz, 0.06, 0.8, 0.06, 0, 0, 0, '#5a3a1a', `DomeTreeTrunk_${i}`);
    add('sphere', tx, 0.9, tz, 0.45, 0.45, 0.45, 0, 0, 0, '#2d7a2d', `DomeTreeCanopy_${i}`);
  }

  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 + 0.5;
    const px = Math.cos(angle) * 2.3;
    const pz = Math.sin(angle) * 2.3;
    add('cylinder', px, 0.4, pz, 0.05, 0.8, 0.05, 0, 0, 0, '#718096', `SolarPole_${i}`);
    add('box', px, 0.8, pz, 0.4, 0.02, 0.4, 0.3, angle, 0, '#2b6cb0', `SolarPanel_${i}`);
  }

  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3 - 0.5;
    const wx = Math.cos(angle) * 2.1;
    const wz = Math.sin(angle) * 2.1;
    add('cylinder', wx, 0.7, wz, 0.06, 1.4, 0.06, 0, 0, 0, '#cbd5e0', `TurbinePole_${i}`);
    add('sphere', wx, 1.4, wz, 0.12, 0.12, 0.15, 0, 0, 0, '#ffffff', `TurbineHub_${i}`);
    add('wedge', wx, 1.7, wz, 0.08, 0.6, 0.03, 0, 0, 0, '#ffffff', `Blade1_${i}`);
    add('wedge', wx - 0.25, 1.25, wz, 0.08, 0.6, 0.03, 0, 0, (Math.PI * 2) / 3, '#ffffff', `Blade2_${i}`);
    add('wedge', wx + 0.25, 1.25, wz, 0.08, 0.6, 0.03, 0, 0, -(Math.PI * 2) / 3, '#ffffff', `Blade3_${i}`);
  }

  return o;
}

function makeHyperloop() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#2d3748', name = 'Loop') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };

  add('box', 0, 0.1, 0, 4.4, 0.2, 2.4, 0, 0, 0, '#718096', 'StationBase');

  for (let i = 0; i < 6; i++) {
    const x = -1.5 + i * 0.6;
    add('torus', x, 0.6, 0, 1.8, 1.8, 0.08, 0, Math.PI/2, 0, '#cbd5e0', `RoofArch_${i}`);
    add('box', x, 1.5, 0, 0.1, 0.02, 1.8, 0, 0, 0, 'rgba(79,209,197,0.4)', `GlassArch_${i}`);
  }

  add('cylinder', 0, 0.8, -0.6, 0.24, 5.0, 0.24, 0, 0, Math.PI/2, 'rgba(79,209,197,0.8)', 'TubeLeft');
  add('cylinder', 0, 0.8, 0.6, 0.24, 5.0, 0.24, 0, 0, Math.PI/2, 'rgba(79,209,197,0.8)', 'TubeRight');

  for (let i = 0; i < 4; i++) {
    const x = -1.8 + i * 1.2;
    add('cylinder', x, 0.4, -0.6, 0.08, 0.8, 0.08, 0, 0, 0, '#4a5568', `PylonL_${i}`);
    add('cylinder', x, 0.4, 0.6, 0.08, 0.8, 0.08, 0, 0, 0, '#4a5568', `PylonR_${i}`);
  }

  add('cylinder', -0.6, 0.8, -0.6, 0.16, 0.8, 0.16, 0, 0, Math.PI/2, '#e53e3e', 'PodRed');
  add('cone', -0.15, 0.8, -0.6, 0.16, 0.2, 0.16, 0, 0, -Math.PI/2, '#e53e3e', 'PodRedCone');
  add('cylinder', 0.6, 0.8, 0.6, 0.16, 0.8, 0.16, 0, 0, Math.PI/2, '#3182ce', 'PodBlue');
  add('cone', 1.05, 0.8, 0.6, 0.16, 0.2, 0.16, 0, 0, -Math.PI/2, '#3182ce', 'PodBlueCone');

  add('box', 0, 0.3, 1.5, 2.0, 0.6, 0.6, 0, 0, 0, '#2d3748', 'LobbyBody');
  add('box', 0, 0.65, 1.5, 2.2, 0.1, 0.8, 0, 0, 0, '#cbd5e0', 'LobbyRoof');
  for (let i = 0; i < 4; i++) {
    const x = -0.75 + i * 0.5;
    add('box', x, 0.12, 2.1, 0.15, 0.22, 0.15, 0, 0, 0, '#38a169', `ChargingPost_${i}`);
    add('box', x, 0.02, 1.9, 0.3, 0.02, 0.4, 0, 0, 0, '#a0aec0', `ChargingLine_${i}`);
    add('cylinder', x, 0.2, 2.1, 0.02, 0.2, 0.02, 0, 0, 0, '#e53e3e', `ChargerCable_${i}`);
    add('sphere', x, 0.25, 2.1, 0.06, 0.06, 0.06, 0, 0, 0, '#48bb78', `ChargerIndicator_${i}`);
  }

  add('box', -2.2, 0.1, 1.2, 0.4, 0.2, 0.4, 0, 0.3, 0, '#cbd5e0', 'SculptureBase');
  add('torus', -2.2, 0.45, 1.2, 0.3, 0.3, 0.06, 0, 0.3, Math.PI/2, '#ecc94b', 'SculptureRing1');
  add('torus', -2.2, 0.45, 1.2, 0.2, 0.2, 0.06, Math.PI/2, 0.3, 0, '#e53e3e', 'SculptureRing2');
  add('sphere', -2.2, 0.45, 1.2, 0.1, 0.1, 0.1, 0, 0, 0, '#4fd1c5', 'SculptureCore');
  add('box', 0, 0.8, 1.21, 0.8, 0.4, 0.02, 0, 0, 0, '#ed8936', 'HyperloopSign');

  return o;
}

// Procedural generators for massive futuristic complexes (>200 objects each)
function generateFuturisticArcology() {
  const objects = [];
  // Base plate
  objects.push({ geometry: 'box', position: {x:0, y:0.1, z:0}, scale: {x:8, y:0.2, z:8}, color: '#0f172a', name: 'Arcology_Platform' });
  
  // 4 corner towers
  const positions = [
    {x: -2, z: -2},
    {x: 2, z: -2},
    {x: -2, z: 2},
    {x: 2, z: 2}
  ];
  
  positions.forEach((pos, idx) => {
    const towerH = 10 + idx * 2; // heights 10, 12, 14, 16
    objects.push({
      geometry: 'box',
      position: {x: pos.x, y: towerH/2, z: pos.z},
      scale: {x: 1.8, y: towerH, z: 1.8},
      color: '#1e293b',
      name: `Tower_${idx}_Core`
    });
    
    // Spire
    objects.push({
      geometry: 'cylinder',
      position: {x: pos.x, y: towerH + 0.4, z: pos.z},
      scale: {x: 0.6, y: 0.8, z: 0.6},
      color: '#06b6d4',
      name: `Tower_${idx}_Cap`
    });
    objects.push({
      geometry: 'cylinder',
      position: {x: pos.x, y: towerH + 1.2, z: pos.z},
      scale: {x: 0.08, y: 1.6, z: 0.08},
      color: '#ffffff',
      name: `Tower_${idx}_Spire`
    });

    const steps = Math.floor(towerH - 1.5) * 2;
    for (let s = 0; s < steps; s++) {
      const y = 1.0 + s * 0.5;
      
      // Face +Z
      objects.push({
        geometry: 'box',
        position: {x: pos.x, y: y, z: pos.z + 0.91},
        scale: {x: 1.2, y: 0.2, z: 0.05},
        color: '#06b6d4',
        name: `T${idx}_W_Z_${s}`
      });
      // Face -Z
      objects.push({
        geometry: 'box',
        position: {x: pos.x, y: y, z: pos.z - 0.91},
        scale: {x: 1.2, y: 0.2, z: 0.05},
        color: '#06b6d4',
        name: `T${idx}_W_mZ_${s}`
      });
      // Face +X
      objects.push({
        geometry: 'box',
        position: {x: pos.x + 0.91, y: y, z: pos.z},
        scale: {x: 0.05, y: 0.2, z: 1.2},
        color: '#3b82f6',
        name: `T${idx}_W_X_${s}`
      });
      // Face -X
      objects.push({
        geometry: 'box',
        position: {x: pos.x - 0.91, y: y, z: pos.z},
        scale: {x: 0.05, y: 0.2, z: 1.2},
        color: '#3b82f6',
        name: `T${idx}_W_mX_${s}`
      });
    }
  });

  // Skybridges
  objects.push({
    geometry: 'box',
    position: {x: 0, y: 6, z: -2},
    scale: {x: 2.2, y: 0.6, z: 0.4},
    color: '#ec4899',
    name: 'Skybridge_North'
  });
  objects.push({
    geometry: 'box',
    position: {x: 0, y: 8, z: 2},
    scale: {x: 2.2, y: 0.6, z: 0.4},
    color: '#ec4899',
    name: 'Skybridge_South'
  });
  objects.push({
    geometry: 'box',
    position: {x: -2, y: 9, z: 0},
    scale: {x: 0.4, y: 0.6, z: 2.2},
    color: '#ec4899',
    name: 'Skybridge_West'
  });
  
  return objects;
}

function generateCyberHabitationDome() {
  const objects = [];
  // Base plate
  objects.push({ geometry: 'box', position: {x:0, y:0.1, z:0}, scale: {x:10, y:0.2, z:10}, color: '#090d16', name: 'Dome_Base' });
  
  // Center cyber spire
  objects.push({ geometry: 'cylinder', position: {x:0, y:6, z:0}, scale: {x:2.4, y:12, z:2.4}, color: '#334155', name: 'Dome_Center_Core' });
  
  // Glowing neon rings
  for (let r = 1; r <= 11; r += 2) {
    const numRingSegments = 12;
    const radius = 1.35;
    for (let s = 0; s < numRingSegments; s++) {
      const angle = (s / numRingSegments) * Math.PI * 2;
      objects.push({
        geometry: 'box',
        position: { x: Math.cos(angle) * radius, y: r, z: Math.sin(angle) * radius },
        scale: { x: 0.6, y: 0.15, z: 0.15 },
        rotation: { x: 0, y: -angle, z: 0 },
        color: '#a855f7',
        name: `Center_Ring_${r}_${s}`
      });
    }
  }

  // 6 outer towers
  const numOuter = 6;
  const outerRadius = 3.6;
  for (let i = 0; i < numOuter; i++) {
    const angle = (i / numOuter) * Math.PI * 2;
    const tx = Math.cos(angle) * outerRadius;
    const tz = Math.sin(angle) * outerRadius;
    const tHeight = 8;
    
    objects.push({
      geometry: 'cylinder',
      position: {x: tx, y: tHeight/2, z: tz},
      scale: {x: 1.0, y: tHeight, z: 1.0},
      color: '#1e293b',
      name: `Outer_Tower_${i}_Core`
    });

    // Spiral neon lights
    const steps = 16;
    for (let s = 0; s < steps; s++) {
      const y = 0.5 + s * 0.45;
      const spiralAngle = angle + (s * 0.4);
      const px = tx + Math.cos(spiralAngle) * 0.55;
      const pz = tz + Math.sin(spiralAngle) * 0.55;
      objects.push({
        geometry: 'box',
        position: {x: px, y: y, z: pz},
        scale: {x: 0.15, y: 0.15, z: 0.15},
        rotation: {x: 0, y: -spiralAngle, z: 0},
        color: '#10b981',
        name: `Outer_Tower_${i}_Node_${s}`
      });
    }

    // Radial Bridge
    objects.push({
      geometry: 'box',
      position: {x: tx * 0.5, y: 5.5, z: tz * 0.5},
      scale: {x: 0.25, y: 0.2, z: outerRadius * 0.65},
      rotation: {x: 0, y: angle + Math.PI/2, z: 0},
      color: '#3b82f6',
      name: `Radial_Bridge_${i}`
    });
  }

  // 12 outer columns
  for (let s = 0; s < 12; s++) {
    const angle = (s / 12) * Math.PI * 2;
    objects.push({
      geometry: 'cylinder',
      position: { x: Math.cos(angle) * 4.6, y: 1.5, z: Math.sin(angle) * 4.6 },
      scale: { x: 0.15, y: 3.0, z: 0.15 },
      color: '#475569',
      name: `Support_Col_${s}`
    });
  }

  // 12 center pods
  for (let l = 0; l < 4; l++) {
    const y = 2.5 + l * 2;
    for (let p = 0; p < 3; p++) {
      const angle = (p / 3) * Math.PI * 2 + (l * 0.5);
      const px = Math.cos(angle) * 1.45;
      const pz = Math.sin(angle) * 1.45;
      objects.push({
        geometry: 'box',
        position: {x: px, y: y, z: pz},
        scale: {x: 0.6, y: 0.5, z: 0.5},
        rotation: {x: 0, y: -angle, z: 0},
        color: '#f59e0b',
        name: `Center_Pod_${l}_${p}`
      });
    }
  }

  return objects;
}

function generateZenithTower() {
  const objects = [];
  // Base Plate
  objects.push({ geometry: 'box', position: {x:0, y:0.1, z:0}, scale: {x:12, y:0.2, z:12}, color: '#1e293b', name: 'Zenith_Base' });
  // Central Core Tower
  objects.push({ geometry: 'box', position: {x:0, y:8.0, z:0}, scale: {x:2.6, y:16.0, z:2.6}, color: '#334155', name: 'Zenith_Core' });

  // 4 Outer Wing Towers
  const wings = [
    {x: -3.2, z: -3.2},
    {x: 3.2, z: -3.2},
    {x: -3.2, z: 3.2},
    {x: 3.2, z: 3.2}
  ];
  wings.forEach((w, idx) => {
    objects.push({ geometry: 'box', position: {x: w.x, y: 6.0, z: w.z}, scale: {x: 1.8, y: 12.0, z: 1.8}, color: '#475569', name: `Zenith_Wing_${idx}` });
    // Spires on wings
    objects.push({ geometry: 'cylinder', position: {x: w.x, y: 12.3, z: w.z}, scale: {x: 0.2, y: 0.6, z: 0.2}, color: '#cbd5e1', name: `Zenith_Spire_${idx}` });
  });

  // Windows and Balconies Grid (creates ~240 objects)
  for (let wingIdx = 0; wingIdx < 4; wingIdx++) {
    const w = wings[wingIdx];
    for (let floor = 0; floor < 10; floor++) {
      const y = 1.0 + floor * 1.1;
      
      // Window front (X side)
      objects.push({
        geometry: 'box',
        position: {x: w.x + 0.91, y: y, z: w.z},
        scale: {x: 0.04, y: 0.5, z: 0.8},
        color: '#38bdf8',
        name: `ZWin_X_${wingIdx}_${floor}`
      });
      // Balcony railing front
      objects.push({
        geometry: 'box',
        position: {x: w.x + 1.1, y: y - 0.2, z: w.z},
        scale: {x: 0.05, y: 0.35, z: 1.0},
        color: '#94a3b8',
        name: `ZBal_X_${wingIdx}_${floor}`
      });

      // Window back (Z side)
      objects.push({
        geometry: 'box',
        position: {x: w.x, y: y, z: w.z + 0.91},
        scale: {x: 0.8, y: 0.5, z: 0.04},
        color: '#38bdf8',
        name: `ZWin_Z_${wingIdx}_${floor}`
      });
      // Balcony railing back
      objects.push({
        geometry: 'box',
        position: {x: w.x, y: y - 0.2, z: w.z + 1.1},
        scale: {x: 1.0, y: 0.35, z: 0.05},
        color: '#94a3b8',
        name: `ZBal_Z_${wingIdx}_${floor}`
      });

      // Window interior (other Z side)
      objects.push({
        geometry: 'box',
        position: {x: w.x, y: y, z: w.z - 0.91},
        scale: {x: 0.8, y: 0.5, z: 0.04},
        color: '#38bdf8',
        name: `ZWin_mZ_${wingIdx}_${floor}`
      });
    }
  }

  // Base Amenities (Tennis court lines + trees = ~50 objects)
  objects.push({ geometry: 'box', position: {x: 0, y: 0.11, z: 4.0}, scale: {x: 4.0, y: 0.02, z: 2.2}, color: '#16a34a', name: 'CourtBase' });
  for (let c = 0; c < 8; c++) {
    objects.push({
      geometry: 'box',
      position: {x: -1.8 + c * 0.5, y: 0.12, z: 4.0},
      scale: {x: 0.04, y: 0.01, z: 2.2},
      color: '#ffffff',
      name: `CourtLine_${c}`
    });
  }

  // Circular sky bridges connecting wings to core (8 segments = ~40 objects)
  for (let lvl = 0; lvl < 3; lvl++) {
    const bridgeY = 3.5 + lvl * 3.5;
    wings.forEach((w, idx) => {
      objects.push({
        geometry: 'box',
        position: {x: w.x * 0.5, y: bridgeY, z: w.z * 0.5},
        scale: {x: 1.5, y: 0.4, z: 0.6},
        rotation: {x: 0, y: Math.atan2(w.z, w.x), z: 0},
        color: '#0284c7',
        name: `ZBridge_${lvl}_${idx}`
      });
    });
  }

  return objects;
}

function generateMarinaBayHabitats() {
  const objects = [];
  // Base Plate
  objects.push({ geometry: 'box', position: {x:0, y:0.1, z:0}, scale: {x:12, y:0.2, z:12}, color: '#090d16', name: 'Marina_Base' });
  // Central Pool
  objects.push({ geometry: 'box', position: {x:0, y:0.12, z:0}, scale: {x:5.0, y:0.04, z:5.0}, color: '#0891b2', name: 'Marina_Pool' });

  // Generate Stacked Modular Apartments (creates ~350 objects)
  let count = 0;
  for (let xIdx = -3; xIdx <= 3; xIdx++) {
    for (let zIdx = -3; zIdx <= 3; zIdx++) {
      if (Math.abs(xIdx) <= 1 && Math.abs(zIdx) <= 1) continue; // Keep pool area clear
      
      const px = xIdx * 1.6;
      const pz = zIdx * 1.6;
      
      // Determine height of stack dynamically
      const maxH = Math.max(1, 4 - Math.abs(xIdx) - Math.abs(zIdx));
      for (let yIdx = 0; yIdx < maxH; yIdx++) {
        const py = 0.5 + yIdx * 1.3;
        
        // Apartment block
        objects.push({
          geometry: 'box',
          position: {x: px, y: py, z: pz},
          scale: {x: 1.3, y: 1.1, z: 1.3},
          color: '#cbd5e1',
          name: `Marina_Unit_${count}`
        });

        // Window pane
        objects.push({
          geometry: 'box',
          position: {x: px, y: py + 0.1, z: pz + 0.66},
          scale: {x: 0.8, y: 0.6, z: 0.04},
          color: '#0284c7',
          name: `Marina_Win_${count}`
        });

        // Balcony box
        objects.push({
          geometry: 'box',
          position: {x: px, y: py - 0.2, z: pz + 0.8},
          scale: {x: 1.0, y: 0.4, z: 0.3},
          color: '#f8fafc',
          name: `Marina_Bal_${count}`
        });

        // Support columns for floating units
        if (yIdx === 0) {
          objects.push({
            geometry: 'cylinder',
            position: {x: px, y: 0.2, z: pz},
            scale: {x: 0.15, y: 0.4, z: 0.15},
            color: '#475569',
            name: `Marina_Col_${count}`
          });
        }
        
        count++;
      }
    }
  }

  // Walkways and railings (adds ~80 objects)
  for (let walk = 0; walk < 10; walk++) {
    objects.push({
      geometry: 'box',
      position: {x: -3.0 + walk * 0.6, y: 1.8, z: -2.0},
      scale: {x: 0.5, y: 0.1, z: 0.8},
      color: '#64748b',
      name: `Marina_Walkway_${walk}`
    });
    objects.push({
      geometry: 'box',
      position: {x: 3.0 - walk * 0.6, y: 3.1, z: 2.0},
      scale: {x: 0.5, y: 0.1, z: 0.8},
      color: '#64748b',
      name: `Marina_Walkway2_${walk}`
    });
  }

  return objects;
}

function generateElysiumSociety() {
  const objects = [];
  // Base Plate
  objects.push({ geometry: 'box', position: {x:0, y:0.1, z:0}, scale: {x:12, y:0.2, z:12}, color: '#111827', name: 'Elysium_Base' });

  // 3 Primary Skyscrapers (shapes count ~360)
  const towers = [
    {x: -3.0, z: -1.5, height: 14},
    {x: 3.0, z: -1.5, height: 16},
    {x: 0, z: 3.0, height: 18}
  ];

  towers.forEach((t, idx) => {
    // Core Tower Structure
    objects.push({
      geometry: 'box',
      position: {x: t.x, y: t.height / 2, z: t.z},
      scale: {x: 2.4, y: t.height, z: 2.4},
      color: '#374151',
      name: `Elysium_Tower_${idx}`
    });

    // Spire Cap
    objects.push({
      geometry: 'cylinder',
      position: {x: t.x, y: t.height + 0.4, z: t.z},
      scale: {x: 0.8, y: 0.8, z: 0.8},
      color: '#f59e0b',
      name: `Elysium_Cap_${idx}`
    });
    objects.push({
      geometry: 'cone',
      position: {x: t.x, y: t.height + 1.2, z: t.z},
      scale: {x: 0.15, y: 1.6, z: 0.15},
      color: '#ffffff',
      name: `Elysium_Spire_${idx}`
    });

    // Window Facade Grid
    const floors = Math.floor(t.height - 1.5);
    for (let f = 0; f < floors; f++) {
      const y = 1.0 + f * 1.1;

      // Front Window Panes
      objects.push({
        geometry: 'box',
        position: {x: t.x + 1.21, y: y, z: t.z - 0.4},
        scale: {x: 0.04, y: 0.6, z: 0.5},
        color: '#60a5fa',
        name: `EWin_F1_${idx}_${f}`
      });
      objects.push({
        geometry: 'box',
        position: {x: t.x + 1.21, y: y, z: t.z + 0.4},
        scale: {x: 0.04, y: 0.6, z: 0.5},
        color: '#60a5fa',
        name: `EWin_F2_${idx}_${f}`
      });

      // Side Window Panes
      objects.push({
        geometry: 'box',
        position: {x: t.x - 0.4, y: y, z: t.z + 1.21},
        scale: {x: 0.5, y: 0.6, z: 0.04},
        color: '#60a5fa',
        name: `EWin_S1_${idx}_${f}`
      });
      objects.push({
        geometry: 'box',
        position: {x: t.x + 0.4, y: y, z: t.z + 1.21},
        scale: {x: 0.5, y: 0.6, z: 0.04},
        color: '#60a5fa',
        name: `EWin_S2_${idx}_${f}`
      });
    }
  });

  // Playground & badminton court (adds ~30 objects)
  objects.push({ geometry: 'box', position: {x: -2.5, y: 0.11, z: 3.0}, scale: {x: 2.2, y: 0.02, z: 1.6}, color: '#059669', name: 'Court' });
  for (let line = 0; line < 5; line++) {
    objects.push({
      geometry: 'box',
      position: {x: -2.5, y: 0.12, z: 2.3 + line * 0.35},
      scale: {x: 2.2, y: 0.01, z: 0.04},
      color: '#ffffff',
      name: `CourtLine_${line}`
    });
  }

  return objects;
}

function generateSolariaArcology() {
  const objects = [];
  // Base Plate
  objects.push({ geometry: 'box', position: {x:0, y:0.1, z:0}, scale: {x:12, y:0.2, z:12}, color: '#022c22', name: 'Solaria_Base' });

  // Stepped Circular Floors (creates ~350 objects)
  for (let floor = 0; floor < 8; floor++) {
    const y = 0.5 + floor * 1.5;
    const radius = 4.8 - floor * 0.5;
    const numPanels = 18 - floor * 2;

    // Platform Slab
    objects.push({
      geometry: 'cylinder',
      position: {x: 0, y: y, z: 0},
      scale: {x: radius * 2, y: 0.2, z: radius * 2},
      color: '#115e59',
      name: `Solaria_Slab_${floor}`
    });

    // Circular Wall Panels & Windows
    for (let p = 0; p < numPanels; p++) {
      const angle = (p / numPanels) * Math.PI * 2;
      const px = Math.cos(angle) * (radius - 0.2);
      const pz = Math.sin(angle) * (radius - 0.2);

      // Support Panel
      objects.push({
        geometry: 'box',
        position: {x: px, y: y + 0.7, z: pz},
        scale: {x: 0.4, y: 1.2, z: 0.4},
        rotation: {x: 0, y: -angle, z: 0},
        color: '#0d9488',
        name: `Solaria_Wall_${floor}_${p}`
      });

      // Window Pane
      objects.push({
        geometry: 'box',
        position: {x: px * 0.95, y: y + 0.7, z: pz * 0.95},
        scale: {x: 0.35, y: 0.9, z: 0.05},
        rotation: {x: 0, y: -angle, z: 0},
        color: '#22d3ee',
        name: `Solaria_Win_${floor}_${p}`
      });
    }

    // Solar panels on terraces
    if (floor > 0) {
      const sx = Math.cos(floor) * (radius + 0.25);
      const sz = Math.sin(floor) * (radius + 0.25);
      objects.push({
        geometry: 'box',
        position: {x: sx, y: y + 0.15, z: sz},
        scale: {x: 0.8, y: 0.05, z: 0.6},
        rotation: {x: 0.3, y: floor, z: 0},
        color: '#2563eb',
        name: `Solaria_Solar_${floor}`
      });
    }
  }

  // Sky garden trees at top
  for (let t = 0; t < 5; t++) {
    const angle = (t / 5) * Math.PI * 2;
    objects.push({
      geometry: 'sphere',
      position: {x: Math.cos(angle) * 0.8, y: 12.8, z: Math.sin(angle) * 0.8},
      scale: {x: 0.5, y: 0.5, z: 0.5},
      color: '#15803d',
      name: `Solaria_Tree_${t}`
    });
  }

  return objects;
}

function generateHyperBlockCondos() {
  const objects = [];
  // Base Plate
  objects.push({ geometry: 'box', position: {x:0, y:0.1, z:0}, scale: {x:12, y:0.2, z:12}, color: '#0f172a', name: 'Hyper_Base' });

  // Grid Stacking of Modular Blocks (creates ~360 objects)
  let count = 0;
  for (let x = -2; x <= 2; x++) {
    for (let z = -2; z <= 2; z++) {
      for (let y = 0; y < 3; y++) {
        // Skip random slots for open-air sky parks
        if ((x + z + y) % 3 === 0) continue;

        const px = x * 2.2;
        const py = 0.6 + y * 1.5;
        const pz = z * 2.2;

        // Condo unit block
        objects.push({
          geometry: 'box',
          position: {x: px, y: py, z: pz},
          scale: {x: 1.8, y: 1.3, z: 1.8},
          color: '#475569',
          name: `HBlock_Unit_${count}`
        });

        // Large front glass pane
        objects.push({
          geometry: 'box',
          position: {x: px, y: py, z: pz + 0.91},
          scale: {x: 1.2, y: 0.8, z: 0.04},
          color: '#38bdf8',
          name: `HBlock_Win_${count}`
        });

        // Industrial utility pipes
        objects.push({
          geometry: 'cylinder',
          position: {x: px - 0.92, y: py, z: pz},
          scale: {x: 0.08, y: 1.5, z: 0.08},
          color: '#94a3b8',
          name: `HBlock_Pipe_${count}`
        });

        // Warning neon dot
        objects.push({
          geometry: 'sphere',
          position: {x: px, y: py + 0.66, z: pz},
          scale: {x: 0.12, y: 0.12, z: 0.12},
          color: '#f43f5e',
          name: `HBlock_Beacon_${count}`
        });

        count++;
      }
    }
  }

  return objects;
}

// ── 20 New High-Complexity Procedural Generators ─────────────────
function generateEmpireFinancialCenter() {
  const o = [];
  o.push({ geometry: 'box', position: {x:0, y:8, z:0}, scale: {x:6, y:16, z:6}, color: '#1e293b', name: 'Core_Base' });
  o.push({ geometry: 'box', position: {x:0, y:20, z:0}, scale: {x:4.5, y:8, z:4.5}, color: '#334155', name: 'Core_Middle' });
  o.push({ geometry: 'box', position: {x:0, y:26, z:0}, scale: {x:3, y:4, z:3}, color: '#475569', name: 'Core_Top' });
  o.push({ geometry: 'cylinder', position: {x:0, y:30, z:0}, scale: {x:0.2, y:4, z:0.2}, color: '#00f2ff', name: 'Spire' });
  const colors = ['#38bdf8', '#0ea5e9', '#0284c7'];
  for (let floor = 0; floor < 15; floor++) {
    const y = 1.0 + floor * 1.0;
    const width = floor < 10 ? 5.8 : (floor < 13 ? 4.3 : 2.8);
    const halfW = width / 2;
    for (let col = 0; col < 10; col++) {
      const ratio = (col - 4.5) / 5;
      const offset = ratio * halfW;
      const winColor = colors[(floor + col) % colors.length];
      o.push({ geometry: 'box', position: {x: offset, y: y, z: halfW + 0.02}, scale: {x: 0.15, y: 0.4, z: 0.04}, color: winColor, name: `Win_Z_F${floor}_C${col}` });
      o.push({ geometry: 'box', position: {x: offset, y: y, z: -halfW - 0.02}, scale: {x: 0.15, y: 0.4, z: 0.04}, color: winColor, name: `Win_negZ_F${floor}_C${col}` });
      o.push({ geometry: 'box', position: {x: halfW + 0.02, y: y, z: offset}, scale: {x: 0.04, y: 0.4, z: 0.15}, color: winColor, name: `Win_X_F${floor}_C${col}` });
      o.push({ geometry: 'box', position: {x: -halfW - 0.02, y: y, z: offset}, scale: {x: 0.04, y: 0.4, z: 0.15}, color: winColor, name: `Win_negX_F${floor}_C${col}` });
    }
  }
  return o;
}

function generateMarinaTowerHotel() {
  const o = [];
  const towerPositions = [
    {x: -3.5, z: -0.5},
    {x: 0, z: 0.8},
    {x: 3.5, z: -0.5}
  ];
  towerPositions.forEach((pos, tIdx) => {
    o.push({ geometry: 'box', position: {x: pos.x, y: 6.5, z: pos.z}, scale: {x: 2.2, y: 13.0, z: 2.2}, color: '#334155', name: `TowerBase_${tIdx}` });
  });
  for (let t = 0; t < 3; t++) {
    const pos = towerPositions[t];
    for (let f = 0; f < 12; f++) {
      const y = 1.0 + f * 1.0;
      o.push({ geometry: 'box', position: {x: pos.x, y: y - 0.1, z: pos.z + 1.25}, scale: {x: 2.2, y: 0.08, z: 0.4}, color: '#f8fafc', name: `BalconyFloor_T${t}_F${f}` });
      o.push({ geometry: 'box', position: {x: pos.x, y: y + 0.15, z: pos.z + 1.45}, scale: {x: 2.2, y: 0.4, z: 0.05}, color: '#38bdf8', name: `BalconyGlass_T${t}_F${f}` });
      o.push({ geometry: 'box', position: {x: pos.x - 1.15, y: y + 0.15, z: pos.z + 1.25}, scale: {x: 0.05, y: 0.4, z: 0.4}, color: '#f8fafc', name: `BalconySideL_T${t}_F${f}` });
      o.push({ geometry: 'box', position: {x: pos.x + 1.15, y: y + 0.15, z: pos.z + 1.25}, scale: {x: 0.05, y: 0.4, z: 0.4}, color: '#f8fafc', name: `BalconySideR_T${t}_F${f}` });
      o.push({ geometry: 'box', position: {x: pos.x - 0.5, y: y + 0.4, z: pos.z + 1.08}, scale: {x: 0.8, y: 0.8, z: 0.02}, color: '#0284c7', name: `WindowL_T${t}_F${f}` });
      o.push({ geometry: 'box', position: {x: pos.x + 0.5, y: y + 0.4, z: pos.z + 1.08}, scale: {x: 0.8, y: 0.8, z: 0.02}, color: '#0284c7', name: `WindowR_T${t}_F${f}` });
      o.push({ geometry: 'box', position: {x: pos.x - 0.5, y: y + 0.4, z: pos.z - 1.08}, scale: {x: 0.8, y: 0.8, z: 0.02}, color: '#0284c7', name: `WindowBL_T${t}_F${f}` });
      o.push({ geometry: 'box', position: {x: pos.x + 0.5, y: y + 0.4, z: pos.z - 1.08}, scale: {x: 0.8, y: 0.8, z: 0.02}, color: '#0284c7', name: `WindowBR_T${t}_F${f}` });
      o.push({ geometry: 'cylinder', position: {x: pos.x - 1.12, y: y, z: pos.z - 1.12}, scale: {x: 0.1, y: 1.0, z: 0.1}, color: '#64748b', name: `PillarBL_T${t}_F${f}` });
      o.push({ geometry: 'cylinder', position: {x: pos.x + 1.12, y: y, z: pos.z - 1.12}, scale: {x: 0.1, y: 1.0, z: 0.1}, color: '#64748b', name: `PillarBR_T${t}_F${f}` });
    }
  }
  o.push({ geometry: 'box', position: {x: 0, y: 13.1, z: 0.1}, scale: {x: 9.8, y: 0.2, z: 3.5}, color: '#10b981', name: 'SkyParkDeck' });
  for (let i = 0; i < 6; i++) {
    const xOffset = -3.5 + i * 1.4;
    o.push({ geometry: 'cylinder', position: {x: xOffset, y: 13.4, z: 0.1}, scale: {x: 0.15, y: 0.4, z: 0.15}, color: '#78350f', name: `RoofTreeTrunk_${i}` });
    o.push({ geometry: 'sphere', position: {x: xOffset, y: 13.7, z: 0.1}, scale: {x: 0.55, y: 0.55, z: 0.55}, color: '#047857', name: `RoofTreeLeaves_${i}` });
  }
  return o;
}

function generateHelixTradeCenter() {
  const o = [];
  o.push({ geometry: 'cylinder', position: {x: 0, y: 9.0, z: 0}, scale: {x: 1.8, y: 18.0, z: 1.8}, color: '#0f172a', name: 'Helix_Central_Core' });
  for (let level = 0; level < 35; level++) {
    const y = 0.3 + level * 0.5;
    const baseAngle = (level * Math.PI) / 8;
    const radius = 2.0;
    for (let b = 0; b < 10; b++) {
      const angle = baseAngle + (b * Math.PI * 2) / 10;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const blockColor = b % 2 === 0 ? '#0ea5e9' : '#0369a1';
      o.push({
        geometry: 'box',
        position: {x, y, z},
        scale: {x: 0.5, y: 0.35, z: 0.5},
        rotation: {x: 0.1, y: -angle, z: 0},
        color: blockColor,
        name: `HelixBlock_L${level}_B${b}`
      });
    }
  }
  return o;
}

function generateCyberPlazaMall() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 0.1, z: 0}, scale: {x: 12, y: 0.2, z: 12}, color: '#1e293b', name: 'Floor_0' });
  o.push({ geometry: 'box', position: {x: 0, y: 4.0, z: 0}, scale: {x: 12, y: 0.2, z: 12}, color: '#1e293b', name: 'Floor_1' });
  o.push({ geometry: 'box', position: {x: 0, y: 8.0, z: 0}, scale: {x: 12, y: 0.2, z: 12}, color: '#1e293b', name: 'Floor_2' });
  const columns = [
    {x: -5.5, z: -5.5}, {x: 5.5, z: -5.5}, {x: -5.5, z: 5.5}, {x: 5.5, z: 5.5},
    {x: -5.5, z: 0}, {x: 5.5, z: 0}, {x: 0, z: -5.5}, {x: 0, z: 5.5}
  ];
  columns.forEach((col, idx) => {
    o.push({ geometry: 'cylinder', position: {x: col.x, y: 6.0, z: col.z}, scale: {x: 0.4, y: 12.0, z: 0.4}, color: '#475569', name: `MallColumn_${idx}` });
  });
  for (let lvl = 0; lvl < 3; lvl++) {
    const y = lvl * 4.0 + 1.8;
    for (let s = 0; s < 8; s++) {
      const angle = (s * Math.PI * 2) / 8;
      const rx = Math.cos(angle) * 4.2;
      const rz = Math.sin(angle) * 4.2;
      o.push({ geometry: 'box', position: {x: rx, y: y, z: rz}, scale: {x: 1.8, y: 2.8, z: 1.8}, color: '#334155', name: `Shop_L${lvl}_S${s}` });
      o.push({ geometry: 'box', position: {x: rx * 0.9, y: y, z: rz * 0.9}, scale: {x: 1.2, y: 2.2, z: 0.1}, rotation: {x: 0, y: -angle, z: 0}, color: '#38bdf8', name: `ShopGlass_L${lvl}_S${s}` });
    }
  }
  for (let esc = 0; esc < 2; esc++) {
    const startY = esc * 4.0 + 0.2;
    const startX = esc === 0 ? -2.0 : 2.0;
    for (let step = 0; step < 25; step++) {
      const sy = startY + (step * 3.8) / 25;
      const sz = -2.5 + (step * 5.0) / 25;
      o.push({ geometry: 'box', position: {x: startX, y: sy, z: sz}, scale: {x: 0.8, y: 0.1, z: 0.2}, color: '#94a3b8', name: `EscStep_E${esc}_S${step}` });
      o.push({ geometry: 'box', position: {x: startX + 0.42, y: sy + 0.35, z: sz}, scale: {x: 0.04, y: 0.7, z: 0.2}, color: '#00f2ff', name: `EscRail_E${esc}_S${step}` });
    }
  }
  for (let s = 0; s < 12; s++) {
    const baseAngle = (s * Math.PI * 2) / 12;
    for (let p = 0; p < 10; p++) {
      const radius = 1.0 + p * 0.35;
      const sx = Math.cos(baseAngle) * radius;
      const sz = Math.sin(baseAngle) * radius;
      const sy = 12.2 + (5 - p) * 0.15;
      o.push({ geometry: 'box', position: {x: sx, y: sy, z: sz}, scale: {x: 0.2, y: 0.1, z: 0.3}, rotation: {x: 0.2, y: -baseAngle, z: 0}, color: '#06b6d4', name: `SkylightFrame_S${s}_P${p}` });
    }
  }
  for (let n = 0; n < 24; n++) {
    const angle = (n * Math.PI * 2) / 24;
    const sx = Math.cos(angle) * 3.2;
    const sz = Math.sin(angle) * 3.2;
    o.push({ geometry: 'box', position: {x: sx, y: 7.8, z: sz}, scale: {x: 0.4, y: 0.3, z: 0.1}, rotation: {x: 0, y: -angle, z: 0}, color: '#f43f5e', name: `NeonSign_${n}` });
  }
  return o;
}

function generateShibuyaNeonTower() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 9.0, z: 0}, scale: {x: 4.5, y: 18.0, z: 4.5}, color: '#090d16', name: 'TowerCore' });
  for (let s = 0; s < 15; s++) {
    const y = 0.6 + s * 1.2;
    o.push({ geometry: 'box', position: {x: -2.3, y, z: -2.3}, scale: {x: 0.15, y: 1.2, z: 0.15}, color: '#334155', name: `Girder_C1_S${s}` });
    o.push({ geometry: 'box', position: {x: 2.3, y, z: -2.3}, scale: {x: 0.15, y: 1.2, z: 0.15}, color: '#334155', name: `Girder_C2_S${s}` });
    o.push({ geometry: 'box', position: {x: -2.3, y, z: 2.3}, scale: {x: 0.15, y: 1.2, z: 0.15}, color: '#334155', name: `Girder_C3_S${s}` });
    o.push({ geometry: 'box', position: {x: 2.3, y, z: 2.3}, scale: {x: 0.15, y: 1.2, z: 0.15}, color: '#334155', name: `Girder_C4_S${s}` });
    o.push({ geometry: 'box', position: {x: 0, y, z: -2.3}, scale: {x: 4.5, y: 0.08, z: 0.08}, rotation: {x: 0, y: 0, z: 0.3}, color: '#475569', name: `Brace_F_S${s}` });
    o.push({ geometry: 'box', position: {x: 0, y, z: 2.3}, scale: {x: 4.5, y: 0.08, z: 0.08}, rotation: {x: 0, y: 0, z: -0.3}, color: '#475569', name: `Brace_B_S${s}` });
    o.push({ geometry: 'box', position: {x: -2.3, y, z: 0}, scale: {x: 0.08, y: 0.08, z: 4.5}, rotation: {x: 0.3, y: 0, z: 0}, color: '#475569', name: `Brace_L_S${s}` });
    o.push({ geometry: 'box', position: {x: 2.3, y, z: 0}, scale: {x: 0.08, y: 0.08, z: 4.5}, rotation: {x: -0.3, y: 0, z: 0}, color: '#475569', name: `Brace_R_S${s}` });
  }
  const billboardColors = ['#ff0055', '#00ffaa', '#ffaa00', '#00aaff', '#cc00ff'];
  for (let b = 0; b < 10; b++) {
    const y = 3.0 + b * 1.4;
    const angle = (b * Math.PI) / 2.5;
    const bx = Math.cos(angle) * 2.32;
    const bz = Math.sin(angle) * 2.32;
    o.push({
      geometry: 'box',
      position: {x: bx, y, z: bz},
      scale: {x: 1.4, y: 1.0, z: 0.08},
      rotation: {x: 0, y: -angle, z: 0},
      color: billboardColors[b % billboardColors.length],
      name: `AdScreen_${b}`
    });
    o.push({
      geometry: 'box',
      position: {x: bx * 0.98, y, z: bz * 0.98},
      scale: {x: 1.5, y: 1.1, z: 0.1},
      rotation: {x: 0, y: -angle, z: 0},
      color: '#000000',
      name: `AdBack_${b}`
    });
  }
  const neonColors = ['#ff00ff', '#00ffff', '#ffff00', '#ff3300'];
  for (let c = 0; c < 4; c++) {
    const cx = c === 0 || c === 1 ? -2.4 : 2.4;
    const cz = c === 0 || c === 2 ? -2.4 : 2.4;
    const color = neonColors[c];
    for (let seg = 0; seg < 40; seg++) {
      const sy = 0.3 + seg * 0.45;
      o.push({
        geometry: 'cylinder',
        position: {x: cx, y: sy, z: cz},
        scale: {x: 0.06, y: 0.5, z: 0.06},
        color,
        name: `NeonTube_C${c}_S${seg}`
      });
    }
  }
  for (let a = 0; a < 6; a++) {
    o.push({ geometry: 'cylinder', position: {x: -1.0 + a * 0.4, y: 19.0, z: 0}, scale: {x: 0.05, y: 2.0, z: 0.05}, color: '#ffffff', name: `Antenna_${a}` });
    o.push({ geometry: 'sphere', position: {x: -1.0 + a * 0.4, y: 20.0, z: 0}, scale: {x: 0.15, y: 0.15, z: 0.15}, color: '#ff0000', name: `Beacon_${a}` });
  }
  return o;
}

function generateGrandCityHall() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 3.5, z: 0}, scale: {x: 10, y: 7.0, z: 6}, color: '#e2e8f0', name: 'MainHall' });
  for (let s = 0; s < 8; s++) {
    const sy = 0.1 + s * 0.15;
    const sz = 3.2 + s * 0.2;
    o.push({ geometry: 'box', position: {x: 0, y: sy, z: sz}, scale: {x: 8.0 - s * 0.2, y: 0.15, z: 1.0}, color: '#cbd5e1', name: `Stair_${s}` });
  }
  for (let col = 0; col < 20; col++) {
    const x = -4.5 + (col * 9.0) / 19;
    o.push({ geometry: 'cylinder', position: {x, y: 3.5, z: 3.1}, scale: {x: 0.18, y: 6.8, z: 0.18}, color: '#f1f5f9', name: `Col_R1_${col}` });
    o.push({ geometry: 'cylinder', position: {x, y: 3.5, z: 2.8}, scale: {x: 0.18, y: 6.8, z: 0.18}, color: '#f1f5f9', name: `Col_R2_${col}` });
  }
  o.push({ geometry: 'box', position: {x: 0, y: 7.1, z: 2.95}, scale: {x: 9.8, y: 0.4, z: 0.6}, color: '#cbd5e1', name: 'Entablature' });
  o.push({ geometry: 'box', position: {x: 0, y: 7.8, z: 0}, scale: {x: 6, y: 1.6, z: 6}, color: '#cbd5e1', name: 'DomeBase' });
  for (let ring = 0; ring < 12; ring++) {
    const rY = 8.6 + ring * 0.3;
    const radius = 2.6 * Math.cos((ring * Math.PI) / 22);
    for (let slice = 0; slice < 16; slice++) {
      const angle = (slice * Math.PI * 2) / 16;
      const rx = Math.cos(angle) * radius;
      const rz = Math.sin(angle) * radius;
      o.push({
        geometry: 'sphere',
        position: {x: rx, y: rY, z: rz},
        scale: {x: 0.6, y: 0.5, z: 0.6},
        color: '#64748b',
        name: `DomeRing_R${ring}_S${slice}`
      });
    }
  }
  o.push({ geometry: 'cylinder', position: {x: 0, y: 12.0, z: 0}, scale: {x: 0.3, y: 1.5, z: 0.3}, color: '#cbd5e1', name: 'DomeLantern' });
  o.push({ geometry: 'cylinder', position: {x: 0, y: 13.0, z: 0}, scale: {x: 0.05, y: 1.0, z: 0.05}, color: '#ffd700', name: 'SpireGolden' });
  o.push({ geometry: 'cylinder', position: {x: 0, y: 5.5, z: 3.12}, scale: {x: 1.0, y: 0.1, z: 1.0}, rotation: {x: Math.PI/2, y: 0, z: 0}, color: '#ffffff', name: 'ClockFace' });
  o.push({ geometry: 'box', position: {x: 0, y: 5.7, z: 3.16}, scale: {x: 0.05, y: 0.4, z: 0.05}, color: '#000000', name: 'ClockHandHour' });
  o.push({ geometry: 'box', position: {x: 0.2, y: 5.5, z: 3.16}, scale: {x: 0.5, y: 0.05, z: 0.05}, color: '#000000', name: 'ClockHandMin' });
  for (let f = 0; f < 2; f++) {
    const y = 2.0 + f * 3.0;
    for (let w = 0; w < 6; w++) {
      const zOffset = -2.5 + w * 1.0;
      o.push({ geometry: 'box', position: {x: -5.02, y, z: zOffset}, scale: {x: 0.04, y: 1.2, z: 0.5}, color: '#475569', name: `SideWinL_F${f}_W${w}` });
      o.push({ geometry: 'box', position: {x: 5.02, y, z: zOffset}, scale: {x: 0.04, y: 1.2, z: 0.5}, color: '#475569', name: `SideWinR_F${f}_W${w}` });
    }
  }
  for (let b = 0; b < 50; b++) {
    const bx = -4.9 + (b * 9.8) / 49;
    o.push({ geometry: 'cylinder', position: {x: bx, y: 7.2, z: -2.9}, scale: {x: 0.06, y: 0.4, z: 0.06}, color: '#e2e8f0', name: `Baluster_${b}` });
  }
  return o;
}

function generateSymphonyConcertHall() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 0.15, z: 0}, scale: {x: 12, y: 0.3, z: 10}, color: '#1e293b', name: 'PlazaBase' });
  for (let s = 0; s < 12; s++) {
    const sy = 0.2 + s * 0.1;
    const sz = 5.0 + s * 0.15;
    o.push({ geometry: 'box', position: {x: 0, y: sy, z: sz}, scale: {x: 10 - s * 0.4, y: 0.1, z: 0.8}, color: '#475569', name: `PlazaStep_${s}` });
  }
  const shellPositions = [
    {x: -3.5, y: 2.0, z: -2.0, sc: 1.5, rot: 0.2},
    {x: -1.5, y: 3.5, z: -1.5, sc: 2.2, rot: 0.1},
    {x: 1.5, y: 3.5, z: -1.5, sc: 2.2, rot: -0.1},
    {x: 3.5, y: 2.0, z: -2.0, sc: 1.5, rot: -0.2},
    {x: -2.5, y: 5.0, z: 0.5, sc: 2.8, rot: 0.3},
    {x: 0, y: 6.5, z: 1.0, sc: 3.5, rot: 0.0},
    {x: 2.5, y: 5.0, z: 0.5, sc: 2.8, rot: -0.3},
    {x: 0, y: 7.5, z: -1.0, sc: 4.0, rot: 0.0}
  ];
  shellPositions.forEach((pos, idx) => {
    for (let slice = 0; slice < 25; slice++) {
      const radius = pos.sc * (1.0 - (slice * 0.02));
      const angle = (slice * Math.PI) / 24 - Math.PI / 4;
      const ox = pos.x + Math.cos(angle) * radius;
      const oz = pos.z + Math.sin(angle) * radius;
      const oy = pos.y + (slice * 0.12);
      o.push({
        geometry: 'box',
        position: {x: ox, y: oy, z: oz},
        scale: {x: 0.3, y: 0.5, z: 0.8},
        rotation: {x: 0.1, y: pos.rot - angle, z: 0.2},
        color: '#f8fafc',
        name: `Shell_${idx}_Slice_${slice}`
      });
    }
  });
  for (let w = 0; w < 90; w++) {
    const wx = -4.5 + (w * 9.0) / 89;
    const wy = 1.0 + Math.sin((w / 89) * Math.PI) * 2.0;
    o.push({
      geometry: 'box',
      position: {x: wx, y: wy, z: 3.8},
      scale: {x: 0.08, y: wy * 2.0, z: 0.08},
      color: '#38bdf8',
      name: `GlassCol_${w}`
    });
  }
  return o;
}

function generateImperialMuseumOfArt() {
  const o = [];
  const pavs = [
    {x: -4.5, y: 2.5, z: -1.0, sx: 2.8, sy: 5.0, sz: 4.5},
    {x: 0.0, y: 3.0, z: -2.0, sx: 3.8, sy: 6.0, sz: 5.0},
    {x: 4.5, y: 2.5, z: -1.0, sx: 2.8, sy: 5.0, sz: 4.5}
  ];
  pavs.forEach((p, idx) => {
    o.push({ geometry: 'box', position: {x: p.x, y: p.y, z: p.z}, scale: {x: p.sx, y: p.sy, z: p.sz}, color: '#f1f5f9', name: `Pavilion_${idx}` });
    for (let c = 0; c < 12; c++) {
      const cx = (p.x - p.sx/2 + 0.2) + (c * (p.sx - 0.4)) / 11;
      o.push({ geometry: 'cylinder', position: {x: cx, y: p.y, z: p.z + p.sz/2 + 0.15}, scale: {x: 0.12, y: p.sy - 0.2, z: 0.12}, color: '#cbd5e1', name: `PavCol_${idx}_C${c}` });
    }
  });
  for (let lyr = 0; lyr < 12; lyr++) {
    const py = 0.2 + lyr * 0.35;
    const size = 3.6 * (1.0 - lyr / 12);
    for (let tile = 0; tile < 16; tile++) {
      const angle = (tile * Math.PI * 2) / 16;
      const tx = Math.cos(angle) * size;
      const tz = Math.sin(angle) * size + 2.0;
      o.push({
        geometry: 'box',
        position: {x: tx, y: py, z: tz},
        scale: {x: 0.25, y: 0.08, z: 0.25},
        rotation: {x: 0.4, y: -angle, z: 0},
        color: '#06b6d4',
        name: `PyramidGlass_L${lyr}_T${tile}`
      });
    }
  }
  const planters = [
    {x: -4.0, z: 3.5}, {x: -2.0, z: 3.5}, {x: 2.0, z: 3.5}, {x: 4.0, z: 3.5}
  ];
  planters.forEach((planter, idx) => {
    o.push({ geometry: 'box', position: {x: planter.x, y: 0.15, z: planter.z}, scale: {x: 1.2, y: 0.3, z: 1.2}, color: '#475569', name: `Planter_${idx}` });
    for (let f = 0; f < 20; f++) {
      const fx = planter.x - 0.4 + (f % 5) * 0.2;
      const fz = planter.z - 0.4 + Math.floor(f / 5) * 0.2;
      const color = f % 2 === 0 ? '#ef4444' : '#10b981';
      o.push({ geometry: 'sphere', position: {x: fx, y: 0.35, z: fz}, scale: {x: 0.12, y: 0.12, z: 0.12}, color, name: `Planter_${idx}_Flower_${f}` });
    }
  });
  return o;
}

function generateMetropolitanLibrary() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 5.0, z: 0}, scale: {x: 9, y: 10.0, z: 7}, color: '#0f172a', name: 'LibraryCore' });
  for (let r = 0; r < 10; r++) {
    const y = 0.5 + r * 0.95;
    for (let c = 0; c < 20; c++) {
      const x = -4.2 + (c * 8.4) / 19;
      o.push({
        geometry: 'box',
        position: {x, y, z: 3.52},
        scale: {x: 0.35, y: 0.08, z: 0.25},
        rotation: {x: 0.5, y: 0, z: 0},
        color: '#f59e0b',
        name: `LouverF_R${r}_C${c}`
      });
      o.push({
        geometry: 'box',
        position: {x, y, z: -3.52},
        scale: {x: 0.35, y: 0.08, z: 0.25},
        rotation: {x: -0.5, y: 0, z: 0},
        color: '#f59e0b',
        name: `LouverB_R${r}_C${c}`
      });
    }
  }
  o.push({ geometry: 'box', position: {x: -1.2, y: 2.0, z: 3.6}, scale: {x: 0.3, y: 4.0, z: 0.4}, color: '#e2e8f0', name: 'ArchL' });
  o.push({ geometry: 'box', position: {x: 1.2, y: 2.0, z: 3.6}, scale: {x: 0.3, y: 4.0, z: 0.4}, color: '#e2e8f0', name: 'ArchR' });
  o.push({ geometry: 'box', position: {x: 0, y: 4.15, z: 3.6}, scale: {x: 2.7, y: 0.3, z: 0.4}, color: '#e2e8f0', name: 'ArchTop' });
  return o;
}

function generateJusticeCourtyard() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 4.0, z: -3.5}, scale: {x: 10.0, y: 8.0, z: 2.0}, color: '#e2e8f0', name: 'CourtHouse' });
  for (let p = 0; p < 40; p++) {
    let px = 0, pz = 0;
    if (p < 15) {
      px = -4.8;
      pz = -3.0 + p * 0.55;
    } else if (p < 30) {
      px = 4.8;
      pz = -3.0 + (p - 15) * 0.55;
    } else {
      px = -4.8 + (p - 30) * 0.96;
      pz = 5.0;
    }
    o.push({ geometry: 'cylinder', position: {x: px, y: 1.0, z: pz}, scale: {x: 0.15, y: 2.0, z: 0.15}, color: '#cbd5e1', name: `FencePillar_${p}` });
  }
  o.push({ geometry: 'box', position: {x: 0, y: 0.2, z: 0}, scale: {x: 1.2, y: 0.4, z: 1.2}, color: '#94a3b8', name: 'ObeliskBase' });
  o.push({ geometry: 'cylinder', position: {x: 0, y: 3.0, z: 0}, scale: {x: 0.35, y: 5.2, z: 0.35}, color: '#cbd5e1', name: 'ObeliskShaft' });
  o.push({ geometry: 'cone', position: {x: 0, y: 5.8, z: 0}, scale: {x: 0.35, y: 0.5, z: 0.35}, color: '#f59e0b', name: 'ObeliskCap' });
  const fountainCenters = [{x: -2.5, z: 1.0}, {x: 2.5, z: 1.0}];
  fountainCenters.forEach((fc, fIdx) => {
    o.push({ geometry: 'cylinder', position: {x: fc.x, y: 0.25, z: fc.z}, scale: {x: 1.0, y: 0.5, z: 1.0}, color: '#475569', name: `FountainBasin_${fIdx}` });
    for (let j = 0; j < 130; j++) {
      const angle = (j * Math.PI * 2) / 25;
      const dist = 0.1 + (Math.floor(j / 25) * 0.2);
      const jx = fc.x + Math.cos(angle) * dist;
      const jz = fc.z + Math.sin(angle) * dist;
      const jy = 0.5 + Math.sin((j % 25) / 25 * Math.PI) * 0.8;
      o.push({
        geometry: 'sphere',
        position: {x: jx, y: jy, z: jz},
        scale: {x: 0.04, y: 0.04, z: 0.04},
        color: '#60a5fa',
        name: `WaterJet_${fIdx}_J${j}`
      });
    }
  });
  for (let b = 0; b < 8; b++) {
    const angle = (b * Math.PI * 2) / 8;
    const bx = Math.cos(angle) * 3.5;
    const bz = Math.sin(angle) * 3.5;
    o.push({
      geometry: 'box',
      position: {x: bx, y: 0.35, z: bz},
      scale: {x: 0.8, y: 0.1, z: 0.3},
      rotation: {x: 0, y: -angle, z: 0},
      color: '#78350f',
      name: `Bench_${b}`
    });
  }
  return o;
}

function generateEdenBioDome() {
  const o = [];
  o.push({ geometry: 'cylinder', position: {x: 0, y: 0.1, z: 0}, scale: {x: 8.0, y: 0.2, z: 8.0}, color: '#065f46', name: 'DomeFloor' });
  for (let slice = 0; slice < 12; slice++) {
    const baseAngle = (slice * Math.PI * 2) / 12;
    for (let seg = 0; seg < 15; seg++) {
      const vRatio = seg / 15;
      const angleHeight = vRatio * Math.PI / 2;
      const radius = 3.9 * Math.cos(angleHeight);
      const y = 0.2 + 3.9 * Math.sin(angleHeight);
      const x = Math.cos(baseAngle) * radius;
      const z = Math.sin(baseAngle) * radius;
      o.push({
        geometry: 'box',
        position: {x, y, z},
        scale: {x: 0.1, y: 0.45, z: 0.1},
        rotation: {x: angleHeight, y: -baseAngle, z: 0},
        color: '#f8fafc',
        name: `Lattice_S${slice}_G${seg}`
      });
      o.push({
        geometry: 'box',
        position: {x: x * 1.01, y, z: z * 1.01},
        scale: {x: 0.4, y: 0.4, z: 0.02},
        rotation: {x: angleHeight, y: -baseAngle, z: 0},
        color: '#34d399',
        name: `Glass_S${slice}_G${seg}`
      });
    }
  }
  for (let t = 0; t < 12; t++) {
    const angle = (t * Math.PI * 2) / 12;
    const rad = 1.5 + (t % 2) * 0.8;
    const tx = Math.cos(angle) * rad;
    const tz = Math.sin(angle) * rad;
    o.push({ geometry: 'cylinder', position: {x: tx, y: 0.5, z: tz}, scale: {x: 0.1, y: 0.8, z: 0.1}, color: '#78350f', name: `InnerTreeTrunk_${t}` });
    o.push({ geometry: 'sphere', position: {x: tx, y: 0.9, z: tz}, scale: {x: 0.5, y: 0.5, z: 0.5}, color: '#047857', name: `InnerTreeLeaves_${t}` });
  }
  return o;
}

function generateVerticalForestTower() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 7.5, z: 0}, scale: {x: 4, y: 15.0, z: 4}, color: '#475569', name: 'ForestTowerCore' });
  for (let f = 0; f < 15; f++) {
    const y = 0.5 + f * 1.0;
    for (let side = 0; side < 8; side++) {
      const angle = (side * Math.PI * 2) / 8;
      const bx = Math.cos(angle) * 2.05;
      const bz = Math.sin(angle) * 2.05;
      o.push({
        geometry: 'box',
        position: {x: bx, y: y - 0.1, z: bz},
        scale: {x: 1.0, y: 0.08, z: 1.0},
        rotation: {x: 0, y: -angle, z: 0},
        color: '#e2e8f0',
        name: `Balcony_F${f}_S${side}`
      });
      o.push({
        geometry: 'box',
        position: {x: bx * 0.95, y: y + 0.4, z: bz * 0.95},
        scale: {x: 0.8, y: 0.8, z: 0.05},
        rotation: {x: 0, y: -angle, z: 0},
        color: '#0ea5e9',
        name: `Window_F${f}_S${side}`
      });
      o.push({
        geometry: 'box',
        position: {x: bx * 1.1, y: y + 0.1, z: bz * 1.1},
        scale: {x: 0.7, y: 0.25, z: 0.2},
        rotation: {x: 0, y: -angle, z: 0},
        color: '#78350f',
        name: `Planter_F${f}_S${side}`
      });
      o.push({
        geometry: 'sphere',
        position: {x: bx * 1.1, y: y + 0.35, z: bz * 1.1},
        scale: {x: 0.45, y: 0.45, z: 0.45},
        color: '#16a34a',
        name: `Plant_F${f}_S${side}`
      });
    }
  }
  return o;
}

function generateSolariaOasisPlaza() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 0.1, z: 0}, scale: {x: 10, y: 0.2, z: 10}, color: '#0284c7', name: 'OasisBase' });
  for (let s = 0; s < 16; s++) {
    const angle = (s * Math.PI * 2) / 16;
    for (let slat = 0; slat < 10; slat++) {
      const radius = 2.0 + slat * 0.28;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      o.push({
        geometry: 'box',
        position: {x, y: 1.8, z},
        scale: {x: 0.08, y: 0.08, z: 0.25},
        rotation: {x: 0, y: -angle, z: 0},
        color: '#e2e8f0',
        name: `PergolaSlats_S${s}_L${slat}`
      });
    }
    const px = Math.cos(angle) * 4.5;
    const pz = Math.sin(angle) * 4.5;
    o.push({ geometry: 'cylinder', position: {x: px, y: 0.9, z: pz}, scale: {x: 0.1, y: 1.8, z: 0.1}, color: '#cbd5e1', name: `PergolaPillar_${s}` });
  }
  for (let sc = 0; sc < 32; sc++) {
    const angle = (sc * Math.PI * 2) / 24;
    const px = Math.cos(angle) * 3.5;
    const pz = Math.sin(angle) * 3.5;
    o.push({ geometry: 'cylinder', position: {x: px, y: 0.5, z: pz}, scale: {x: 0.06, y: 1.0, z: 0.06}, color: '#94a3b8', name: `SolarPole_${sc}` });
    o.push({
      geometry: 'box',
      position: {x: px, y: 1.05, z: pz},
      scale: {x: 0.5, y: 0.04, z: 0.5},
      rotation: {x: 0.4, y: -angle, z: 0},
      color: '#1e40af',
      name: `SolarPanel_${sc}`
    });
    o.push({
      geometry: 'box',
      position: {x: px * 1.02, y: 1.06, z: pz * 1.02},
      scale: {x: 0.54, y: 0.02, z: 0.54},
      rotation: {x: 0.4, y: -angle, z: 0},
      color: '#f59e0b',
      name: `SolarBorder_${sc}`
    });
  }
  o.push({ geometry: 'cylinder', position: {x: 0, y: 0.8, z: 0}, scale: {x: 0.5, y: 1.6, z: 0.5}, color: '#cbd5e1', name: 'SculptureCore' });
  for (let w = 0; w < 40; w++) {
    const angle = (w * Math.PI * 2) / 20;
    const r = 0.2 + (w % 2) * 0.15;
    const wx = Math.cos(angle) * r;
    const wz = Math.sin(angle) * r;
    const wy = 1.0 + (w / 40) * 0.6;
    o.push({ geometry: 'sphere', position: {x: wx, y: wy, z: wz}, scale: {x: 0.08, y: 0.08, z: 0.08}, color: '#38bdf8', name: `FountainWater_${w}` });
  }
  return o;
}

function generateSuspendedSkyGardens() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 0.2, z: 0}, scale: {x: 10, y: 0.3, z: 8}, color: '#7c2d12', name: 'Deck_Level0' });
  o.push({ geometry: 'box', position: {x: -1.0, y: 2.2, z: -0.5}, scale: {x: 7.5, y: 0.3, z: 6.5}, color: '#9a3412', name: 'Deck_Level1' });
  o.push({ geometry: 'box', position: {x: -2.0, y: 4.2, z: -1.0}, scale: {x: 5.0, y: 0.3, z: 5.0}, color: '#b45309', name: 'Deck_Level2' });
  const columns = [
    {x: -4.0, z: -3.0}, {x: 4.0, z: -3.0}, {x: -4.0, z: 3.0}, {x: 4.0, z: 3.0},
    {x: -2.5, z: 0}, {x: 2.5, z: 0}, {x: 0, z: -2.0}, {x: 0, z: 2.0}
  ];
  columns.forEach((col, idx) => {
    o.push({ geometry: 'cylinder', position: {x: col.x, y: 2.1, z: col.z}, scale: {x: 0.25, y: 4.2, z: 0.25}, color: '#78350f', name: `TreeTrunk_${idx}` });
  });
  for (let p = 0; p < 120; p++) {
    const angle = (p * Math.PI * 2) / 30;
    const radius = 1.0 + (p % 4) * 0.8;
    const x = -1.5 + Math.cos(angle) * radius;
    const z = -0.5 + Math.sin(angle) * radius;
    const y = 1.0 + (p / 120) * 4.0;
    const color = p % 3 === 0 ? '#15803d' : (p % 3 === 1 ? '#166534' : '#14532d');
    o.push({ geometry: 'sphere', position: {x, y, z}, scale: {x: 0.3, y: 0.3, z: 0.3}, color, name: `HangingPlant_${p}` });
  }
  for (let w = 0; w < 180; w++) {
    const wx = 1.0 + (w % 8) * 0.15;
    const wz = -0.5 + Math.floor(w / 8) % 5 * 0.15;
    const wy = 0.3 + (w / 180) * 3.8;
    o.push({ geometry: 'sphere', position: {x: wx, y: wy, z: wz}, scale: {x: 0.05, y: 0.05, z: 0.05}, color: '#38bdf8', name: `WaterDrop_${w}` });
  }
  return o;
}

function generateRenewableEnergyEcoPark() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 0.1, z: 0}, scale: {x: 10.0, y: 0.2, z: 10.0}, color: '#047857', name: 'EcoParkBase' });
  const turbines = [{x: -3.5, z: -3.5}, {x: 3.5, z: -3.5}, {x: 0, z: 3.5}];
  turbines.forEach((t, idx) => {
    o.push({ geometry: 'cylinder', position: {x: t.x, y: 4.0, z: t.z}, scale: {x: 0.2, y: 8.0, z: 0.2}, color: '#f8fafc', name: `TurbinePole_${idx}` });
    o.push({ geometry: 'sphere', position: {x: t.x, y: 8.0, z: t.z}, scale: {x: 0.45, y: 0.45, z: 0.45}, color: '#cbd5e1', name: `TurbineHub_${idx}` });
    for (let blade = 0; blade < 3; blade++) {
      const baseAngle = (blade * Math.PI * 2) / 3;
      for (let seg = 0; seg < 5; seg++) {
        const dist = 0.4 + seg * 0.4;
        const bx = t.x + Math.cos(baseAngle) * dist;
        const by = 8.0 + Math.sin(baseAngle) * dist;
        o.push({
          geometry: 'box',
          position: {x: bx, y: by, z: t.z + 0.1},
          scale: {x: 0.25, y: 0.08, z: 0.05},
          rotation: {x: 0, y: 0, z: baseAngle},
          color: '#ffffff',
          name: `TurbineBlade_${idx}_B${blade}_S${seg}`
        });
      }
    }
  });
  for (let r = 0; r < 12; r++) {
    const z = -2.0 + r * 0.45;
    for (let c = 0; c < 12; c++) {
      const x = -2.5 + c * 0.45;
      if (Math.abs(x) < 0.6 && Math.abs(z) < 0.6) continue;
      o.push({ geometry: 'box', position: {x, y: 0.35, z}, scale: {x: 0.32, y: 0.03, z: 0.32}, rotation: {x: 0.3, y: 0, z: 0}, color: '#1d4ed8', name: `SolarField_R${r}_C${c}` });
      o.push({ geometry: 'cylinder', position: {x, y: 0.18, z: z - 0.08}, scale: {x: 0.03, y: 0.3, z: 0.03}, color: '#475569', name: `SolarBracket_R${r}_C${c}` });
    }
  }
  for (let b = 0; b < 6; b++) {
    o.push({ geometry: 'box', position: {x: -2.0 + b * 0.8, y: 0.4, z: 4.2}, scale: {x: 0.6, y: 0.6, z: 0.6}, color: '#059669', name: `BatteryUnit_${b}` });
  }
  return o;
}

function generatePetrochemicalRefinery() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 0.15, z: 0}, scale: {x: 12, y: 0.3, z: 10}, color: '#1e293b', name: 'RefineryPlatform' });
  for (let c = 0; c < 15; c++) {
    const x = -4.5 + (c * 9.0) / 14;
    const h = 5.0 + Math.sin(c * 1.5) * 3.0;
    o.push({ geometry: 'cylinder', position: {x, y: h/2, z: -2.0}, scale: {x: 0.7, y: h, z: 0.7}, color: '#64748b', name: `DistillCol_${c}` });
    o.push({ geometry: 'cylinder', position: {x, y: h + 0.5, z: -2.0}, scale: {x: 0.1, y: 1.0, z: 0.1}, color: '#f97316', name: `FlareStack_${c}` });
  }
  const tanks = [{x: -3.5, z: 2.5}, {x: -1.2, z: 2.5}, {x: 1.2, z: 2.5}, {x: 3.5, z: 2.5}];
  tanks.forEach((t, idx) => {
    o.push({ geometry: 'sphere', position: {x: t.x, y: 1.5, z: t.z}, scale: {x: 1.8, y: 1.8, z: 1.8}, color: '#cbd5e1', name: `RefineryTank_${idx}` });
    o.push({ geometry: 'cylinder', position: {x: t.x, y: 0.3, z: t.z}, scale: {x: 0.8, y: 0.6, z: 0.8}, color: '#475569', name: `TankBase_${idx}` });
  });
  for (let p = 0; p < 280; p++) {
    const px = -4.5 + (p % 15) * 0.65;
    const py = 0.5 + Math.floor(p / 15) * 0.25;
    const pz = -2.0 + (p % 3 === 0 ? 1.5 : (p % 3 === 1 ? 3.0 : 0));
    const isVertical = p % 2 === 0;
    o.push({
      geometry: 'cylinder',
      position: {x: px, y: py, z: pz},
      scale: isVertical ? {x: 0.08, y: 0.6, z: 0.08} : {x: 0.6, y: 0.08, z: 0.08},
      rotation: isVertical ? {x: 0, y: 0, z: 0} : {x: 0, y: 0, z: Math.PI/2},
      color: p % 4 === 0 ? '#94a3b8' : (p % 4 === 1 ? '#ef4444' : '#f59e0b'),
      name: `RefineryPipe_${p}`
    });
  }
  return o;
}

function generateTeslaMegaFactory() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 2.5, z: 0}, scale: {x: 11, y: 5.0, z: 7}, color: '#f1f5f9', name: 'FactoryMain' });
  for (let r = 0; r < 12; r++) {
    const sz = -3.0 + (r * 6.0) / 11;
    for (let c = 0; c < 12; c++) {
      const sx = -5.0 + (c * 10.0) / 11;
      o.push({ geometry: 'box', position: {x: sx, y: 5.05, z: sz}, scale: {x: 0.7, y: 0.04, z: 0.4}, color: '#1e3a8a', name: `RoofSolar_${r}_${c}` });
    }
  }
  for (let d = 0; d < 10; d++) {
    const dz = -3.0 + (d * 6.0) / 9;
    o.push({ geometry: 'box', position: {x: 5.52, y: 1.0, z: dz}, scale: {x: 0.04, y: 1.8, z: 0.5}, color: '#475569', name: `DockFrame_${d}` });
    o.push({ geometry: 'box', position: {x: 5.51, y: 1.0, z: dz}, scale: {x: 0.02, y: 1.7, z: 0.45}, color: '#cbd5e1', name: `DockDoor_${d}` });
  }
  for (let c = 0; c < 100; c++) {
    const cx = -4.5 + c * 0.09;
    o.push({ geometry: 'cylinder', position: {x: cx, y: 0.45, z: 4.0}, scale: {x: 0.06, y: 0.6, z: 0.06}, rotation: {x: Math.PI/2, y: 0, z: 0}, color: '#475569', name: `ConveyorRoller_${c}` });
  }
  for (let v = 0; v < 40; v++) {
    const vx = -4.8 + (v * 9.6) / 39;
    o.push({ geometry: 'cylinder', position: {x: vx, y: 5.6, z: -3.2}, scale: {x: 0.08, y: 1.2, z: 0.08}, color: '#94a3b8', name: `VentTube_${v}` });
    o.push({ geometry: 'sphere', position: {x: vx, y: 6.2, z: -3.2}, scale: {x: 0.12, y: 0.12, z: 0.12}, color: '#ef4444', name: `VentCap_${v}` });
  }
  return o;
}

function generateGeothermalPowerPlant() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 0.15, z: 0}, scale: {x: 10, y: 0.3, z: 10}, color: '#334155', name: 'PowerPlantPlat' });
  const towers = [{x: -3.0, z: -2.5}, {x: 3.0, z: -2.5}, {x: 0, z: 2.8}];
  towers.forEach((t, tIdx) => {
    for (let s = 0; s < 35; s++) {
      const y = 0.3 + s * 0.18;
      const radius = 1.0 - Math.sin((s / 35) * Math.PI) * 0.35;
      o.push({
        geometry: 'cylinder',
        position: {x: t.x, y, z: t.z},
        scale: {x: radius, y: 0.18, z: radius},
        color: '#cbd5e1',
        name: `CoolTower_${tIdx}_R${s}`
      });
    }
  });
  for (let p = 0; p < 10; p++) {
    const px = -4.0 + p * 0.88;
    const pz = 0.5;
    o.push({ geometry: 'cylinder', position: {x: px, y: 2.0, z: pz}, scale: {x: 0.1, y: 4.0, z: 0.1}, color: '#475569', name: `GridPole_${p}` });
    o.push({ geometry: 'box', position: {x: px, y: 3.5, z: pz}, scale: {x: 1.0, y: 0.1, z: 0.1}, color: '#475569', name: `GridArm_${p}` });
    for (let ins = 0; ins < 10; ins++) {
      const iy = 3.4 - ins * 0.08;
      o.push({ geometry: 'cone', position: {x: px - 0.4, y: iy, z: pz}, scale: {x: 0.05, y: 0.08, z: 0.05}, color: '#60a5fa', name: `InsL_${p}_I${ins}` });
      o.push({ geometry: 'cone', position: {x: px + 0.4, y: iy, z: pz}, scale: {x: 0.05, y: 0.08, z: 0.05}, color: '#60a5fa', name: `InsR_${p}_I${ins}` });
    }
  }
  return o;
}

function generateHeavyCargoRailYard() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 0.15, z: 0}, scale: {x: 12, y: 0.3, z: 10}, color: '#1e293b', name: 'RailYardFloor' });
  for (let track = 0; track < 3; track++) {
    const tz = -3.5 + track * 1.5;
    o.push({ geometry: 'box', position: {x: 0, y: 0.32, z: tz - 0.3}, scale: {x: 11.8, y: 0.04, z: 0.04}, color: '#94a3b8', name: `RailLine_${track}_L` });
    o.push({ geometry: 'box', position: {x: 0, y: 0.32, z: tz + 0.3}, scale: {x: 11.8, y: 0.04, z: 0.04}, color: '#94a3b8', name: `RailLine_${track}_R` });
    for (let tie = 0; tie < 35; tie++) {
      const tx = -5.5 + tie * 0.32;
      o.push({ geometry: 'box', position: {x: tx, y: 0.22, z: tz}, scale: {x: 0.08, y: 0.1, z: 0.8}, color: '#78350f', name: `RailTie_${track}_T${tie}` });
    }
  }
  const containerColors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  for (let s = 0; s < 15; s++) {
    const sx = -4.5 + (s % 5) * 2.2;
    const sz = 1.8 + Math.floor(s / 5) * 1.2;
    for (let c = 0; c < 15; c++) {
      const cy = 0.5 + c * 0.3;
      o.push({
        geometry: 'box',
        position: {x: sx, y: cy, z: sz},
        scale: {x: 1.8, y: 0.28, z: 0.8},
        color: containerColors[(s + c) % containerColors.length],
        name: `Container_S${s}_C${c}`
      });
    }
  }
  o.push({ geometry: 'box', position: {x: -3.0, y: 2.0, z: -1.0}, scale: {x: 0.3, y: 4.0, z: 0.3}, color: '#f59e0b', name: 'GantryLegL' });
  o.push({ geometry: 'box', position: {x: 3.0, y: 2.0, z: -1.0}, scale: {x: 0.3, y: 4.0, z: 0.3}, color: '#f59e0b', name: 'GantryLegR' });
  o.push({ geometry: 'box', position: {x: 0, y: 4.15, z: -1.0}, scale: {x: 6.3, y: 0.3, z: 0.3}, color: '#f59e0b', name: 'GantryBeam' });
  return o;
}
function generateSteelSmeltingFoundry() {
  const o = [];
  o.push({ geometry: 'box', position: {x: 0, y: 0.15, z: 0}, scale: {x: 12, y: 0.3, z: 10}, color: '#334155', name: 'FoundryDeck' });
  const furnaces = [{x: -4.0, z: -2.0}, {x: 0.0, z: -2.0}, {x: 4.0, z: -2.0}];
  furnaces.forEach((f, idx) => {
    o.push({ geometry: 'cylinder', position: {x: f.x, y: 3.0, z: f.z}, scale: {x: 1.6, y: 6.0, z: 1.6}, color: '#475569', name: `FurnaceBody_${idx}` });
    o.push({ geometry: 'cone', position: {x: f.x, y: 6.5, z: f.z}, scale: {x: 1.2, y: 1.0, z: 1.2}, color: '#334155', name: `FurnaceTop_${idx}` });
  });
  for (let c = 0; c < 160; c++) {
    const fIdx = c % 3;
    const startX = furnaces[fIdx].x;
    const ratio = Math.floor(c / 3) / 53;
    const cx = startX + (c % 2 === 0 ? 0.3 : -0.3) * ratio;
    const cz = -1.2 + ratio * 4.5;
    const cy = 0.35 + Math.sin(ratio * Math.PI) * 0.15;
    o.push({
      geometry: 'box',
      position: {x: cx, y: cy, z: cz},
      scale: {x: 0.15, y: 0.08, z: 0.15},
      color: c % 2 === 0 ? '#ff5500' : '#ffaa00',
      name: `MoltenFlow_${c}`
    });
  }
  const chimneys = [{x: -4.5, z: 3.5}, {x: 4.5, z: 3.5}];
  chimneys.forEach((ch, cIdx) => {
    o.push({ geometry: 'cylinder', position: {x: ch.x, y: 4.5, z: ch.z}, scale: {x: 0.6, y: 9.0, z: 0.6}, color: '#1e293b', name: `FoundryChimney_${cIdx}` });
    for (let r = 0; r < 70; r++) {
      const ry = 0.5 + r * 0.16;
      o.push({
        geometry: 'box',
        position: {x: ch.x, y: ry, z: ch.z + 0.32},
        scale: {x: 0.35, y: 0.04, z: 0.04},
        color: '#f59e0b',
        name: `ChimneyLadder_${cIdx}_R${r}`
      });
    }
  });
  return o;
}

function makeGiantGoldenOak() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#5c4033', name = 'GoldenOak') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Thick gnarled trunk (20 segments/subsections)
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const rad = 0.5 + Math.sin(i * 0.8) * 0.1;
    add('cylinder', Math.cos(angle) * 0.15, 0.1 + i * 0.15, Math.sin(angle) * 0.15, rad, 0.25, rad, 0.05 * Math.sin(i), angle * 0.2, 0.05 * Math.cos(i), '#5c4033', `Trunk_${i}`);
  }
  // 8 sprawling roots
  for (let r = 0; r < 8; r++) {
    const rAngle = (r / 8) * Math.PI * 2;
    for (let j = 0; j < 8; j++) {
      const dist = 0.5 + j * 0.35;
      const rx = Math.cos(rAngle) * dist;
      const rz = Math.sin(rAngle) * dist;
      const ry = 0.12 - j * 0.02;
      add('box', rx, ry, rz, 0.5 - j * 0.05, 0.2 - j * 0.02, 0.5 - j * 0.05, 0.1, rAngle, -0.1, '#5c4033', `Root_${r}_${j}`);
    }
  }
  // Gnarled branches (around 120 blocks)
  const branches = [
    { startY: 1.5, angle: 0, pitch: 0.6, len: 14, scale: 0.25 },
    { startY: 1.8, angle: Math.PI / 4, pitch: 0.5, len: 12, scale: 0.22 },
    { startY: 2.1, angle: Math.PI / 2, pitch: 0.7, len: 15, scale: 0.2 },
    { startY: 2.4, angle: Math.PI * 0.75, pitch: 0.4, len: 13, scale: 0.2 },
    { startY: 2.6, angle: Math.PI, pitch: 0.6, len: 14, scale: 0.18 },
    { startY: 2.8, angle: Math.PI * 1.25, pitch: 0.5, len: 12, scale: 0.18 },
    { startY: 3.0, angle: Math.PI * 1.5, pitch: 0.7, len: 15, scale: 0.16 },
    { startY: 3.2, angle: Math.PI * 1.75, pitch: 0.4, len: 13, scale: 0.16 },
  ];
  branches.forEach((br, bIdx) => {
    let cx = 0, cy = br.startY, cz = 0;
    for (let k = 0; k < br.len; k++) {
      const step = 0.25;
      cx += Math.cos(br.angle) * step * Math.cos(br.pitch);
      cz += Math.sin(br.angle) * step * Math.cos(br.pitch);
      cy += step * Math.sin(br.pitch) + Math.sin(k * 1.2) * 0.08;
      const sz = br.scale * (1.0 - k / br.len);
      add('cylinder', cx, cy, cz, sz, step * 1.2, sz, br.pitch, -br.angle, Math.sin(k * 0.5) * 0.3, '#5c4033', `Branch_${bIdx}_${k}`);
    }
  });
  // 12 glowing golden canopy spheres
  const goldenLeafColors = ['#f59e0b', '#d97706', '#fbbf24', '#f59e0b', '#d97706'];
  const leafSpheres = [
    { x: 1.5, y: 3.2, z: 0.0, r: 1.6 },
    { x: -1.2, y: 3.5, z: 1.2, r: 1.4 },
    { x: 1.1, y: 3.7, z: -1.1, r: 1.5 },
    { x: -1.3, y: 3.8, z: -1.3, r: 1.3 },
    { x: 0.0, y: 4.2, z: 1.6, r: 1.5 },
    { x: 1.7, y: 4.0, z: 1.3, r: 1.3 },
    { x: -1.6, y: 4.1, z: 0.0, r: 1.4 },
    { x: 0.0, y: 4.5, z: -1.7, r: 1.5 },
    { x: 1.0, y: 4.8, z: 1.0, r: 1.2 },
    { x: -1.0, y: 4.9, z: -0.8, r: 1.3 },
    { x: 0.0, y: 5.3, z: 0.0, r: 1.7 },
    { x: 0.5, y: 5.6, z: -0.5, r: 1.2 }
  ];
  leafSpheres.forEach((ls, lIdx) => {
    add('sphere', ls.x, ls.y, ls.z, ls.r, ls.r * 0.85, ls.r, 0, 0, 0, goldenLeafColors[lIdx % goldenLeafColors.length], `GoldenLeaves_${lIdx}`);
  });
  return o;
}

function makeAncientGrandBanyan() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#4b3b2f', name = 'Banyan') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Massive sprawling trunk base
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2;
    const r = 0.9 + Math.sin(i * 1.5) * 0.15;
    add('cylinder', Math.cos(angle) * 0.4, 0.1 + i * 0.08, Math.sin(angle) * 0.4, r - i * 0.015, 0.2, r - i * 0.015, 0, 0, 0, '#4b3b2f', `Base_${i}`);
  }
  // Split trunks rising up (4 major splits, ~60 pieces)
  const splits = [
    { ox: 0.4, oz: 0.4, angle: Math.PI / 4, scale: 0.45 },
    { ox: -0.4, oz: 0.4, angle: Math.PI * 0.75, scale: 0.4 },
    { ox: -0.4, oz: -0.4, angle: Math.PI * 1.25, scale: 0.45 },
    { ox: 0.4, oz: -0.4, angle: Math.PI * 1.75, scale: 0.4 }
  ];
  splits.forEach((sp, sIdx) => {
    let cx = sp.ox, cy = 1.0, cz = sp.oz;
    for (let k = 0; k < 15; k++) {
      cx += Math.cos(sp.angle) * 0.15;
      cz += Math.sin(sp.angle) * 0.15;
      cy += 0.22;
      const sz = sp.scale * (1.0 - k * 0.05);
      add('cylinder', cx, cy, cz, sz, 0.35, sz, 0.15, sp.angle, 0.1, '#4b3b2f', `SplitTrunk_${sIdx}_${k}`);
    }
  });
  // 15 hanging aerial roots reaching down
  for (let r = 0; r < 15; r++) {
    const rAngle = (r / 15) * Math.PI * 2;
    const rx = Math.cos(rAngle) * (1.6 + Math.sin(r * 2.3) * 0.4);
    const rz = Math.sin(rAngle) * (1.6 + Math.sin(r * 2.3) * 0.4);
    const rHeight = 2.0 + Math.random() * 1.0;
    for (let h = 0; h < 8; h++) {
      const hy = (h / 8) * rHeight;
      add('cylinder', rx, rHeight - hy, rz, 0.08, rHeight / 7, 0.08, 0.05 * Math.sin(h), rAngle, 0.05 * Math.cos(h), '#5a4a3a', `AerialRoot_${r}_${h}`);
    }
  }
  // Sprawling canopy of 15 dark forest green leaf spheres
  const foliageColors = ['#14532d', '#166534', '#15803d', '#14532d', '#166534'];
  const foliageSpheres = [
    { x: 1.8, y: 3.4, z: 0.5, r: 1.5 },
    { x: -1.7, y: 3.5, z: 0.8, r: 1.6 },
    { x: 0.9, y: 3.6, z: -1.6, r: 1.4 },
    { x: -0.8, y: 3.7, z: -1.7, r: 1.5 },
    { x: 2.1, y: 3.8, z: -1.0, r: 1.3 },
    { x: -2.0, y: 3.9, z: -0.9, r: 1.4 },
    { x: 0.0, y: 4.1, z: 2.2, r: 1.6 },
    { x: 1.2, y: 4.2, z: 1.7, r: 1.3 },
    { x: -1.3, y: 4.3, z: 1.6, r: 1.4 },
    { x: 0.0, y: 4.5, z: -2.2, r: 1.5 },
    { x: 1.5, y: 4.6, z: -1.5, r: 1.3 },
    { x: -1.5, y: 4.7, z: -1.4, r: 1.4 },
    { x: 0.8, y: 5.0, z: 0.8, r: 1.5 },
    { x: -0.8, y: 5.1, z: -0.8, r: 1.5 },
    { x: 0.0, y: 5.4, z: 0.0, r: 1.8 }
  ];
  foliageSpheres.forEach((fs, fIdx) => {
    add('sphere', fs.x, fs.y, fs.z, fs.r, fs.r * 0.8, fs.r, 0, 0, 0, foliageColors[fIdx % foliageColors.length], `BanyanLeaves_${fIdx}`);
  });
  return o;
}

function generateHangingGardens() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#6b7280', name = 'Gardens') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Base layers & columns (100 objects)
  add('box', 0, 0.15, 0, 8.0, 0.3, 8.0, 0, 0, 0, '#4b5563', 'Foundation');
  // Columns on base tier
  for (let x = -3.5; x <= 3.5; x += 1.4) {
    for (let z = -3.5; z <= 3.5; z += 1.4) {
      if (Math.abs(x) > 3.0 || Math.abs(z) > 3.0) {
        add('cylinder', x, 0.9, z, 0.22, 1.2, 0.22, 0, 0, 0, '#78716c', 'Col_Tier1');
        add('box', x, 1.55, z, 0.35, 0.1, 0.35, 0, 0, 0, '#57534e', 'ColCap_Tier1');
      }
    }
  }
  // Tier 2 deck & columns
  add('box', 0, 1.7, 0, 6.0, 0.25, 6.0, 0, 0, 0, '#4b5563', 'Deck_Tier2');
  for (let x = -2.5; x <= 2.5; x += 1.2) {
    for (let z = -2.5; z <= 2.5; z += 1.2) {
      if (Math.abs(x) > 2.0 || Math.abs(z) > 2.0) {
        add('cylinder', x, 2.4, z, 0.18, 1.1, 0.18, 0, 0, 0, '#78716c', 'Col_Tier2');
        add('box', x, 2.98, z, 0.28, 0.08, 0.28, 0, 0, 0, '#57534e', 'ColCap_Tier2');
      }
    }
  }
  // Tier 3 deck & columns
  add('box', 0, 3.1, 0, 4.0, 0.2, 4.0, 0, 0, 0, '#4b5563', 'Deck_Tier3');
  for (let x = -1.5; x <= 1.5; x += 1.0) {
    for (let z = -1.5; z <= 1.5; z += 1.0) {
      add('cylinder', x, 3.7, z, 0.14, 1.0, 0.14, 0, 0, 0, '#78716c', 'Col_Tier3');
    }
  }
  // Top tier dome structure
  add('box', 0, 4.25, 0, 2.2, 0.15, 2.2, 0, 0, 0, '#57534e', 'TopDeck');
  add('sphere', 0, 4.6, 0, 1.2, 0.8, 1.2, 0, 0, 0, '#e2e8f0', 'CentralDome');
  // Water streams / waterfalls (30 elements)
  const waterColor = '#38bdf8';
  for (let w = 0; w < 4; w++) {
    const angle = (w / 4) * Math.PI * 2;
    const wx = Math.cos(angle) * 2.8;
    const wz = Math.sin(angle) * 2.8;
    for (let s = 0; s < 8; s++) {
      add('box', wx, 3.0 - s * 0.38, wz, 0.12, 0.4, 0.12, 0.1, angle, 0, waterColor, `Waterfall_${w}_${s}`);
    }
  }
  // Sprawling hanging garden plant spheres and leaves (~130 objects)
  const gardenColors = ['#15803d', '#166534', '#14532d', '#22c55e', '#84cc16'];
  for (let p = 0; p < 130; p++) {
    const tier = p % 3;
    const angle = (p / 130) * Math.PI * 20;
    let rad = 3.6 - tier * 0.9 + Math.sin(p * 0.5) * 0.25;
    let px = Math.cos(angle) * rad;
    let pz = Math.sin(angle) * rad;
    let py = 1.8;
    if (tier === 1) py = 3.2;
    if (tier === 2) py = 4.3;
    const scale = 0.15 + (p % 4) * 0.06;
    add('sphere', px, py + Math.sin(p) * 0.1, pz, scale, scale * 0.9, scale, 0.1 * Math.sin(p), angle, 0, gardenColors[p % gardenColors.length], `GardenFlora_${p}`);
  }
  return o;
}

function generateRomanInsula() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#b45309', name = 'Insula') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // 4 floors of clay / stone bricks (~160 blocks)
  const brickColors = ['#9a3412', '#c2410c', '#ea580c', '#b45309'];
  for (let f = 0; f < 4; f++) {
    const fy = 0.5 + f * 1.25;
    // Four outer walls per floor, building a square hollow structure
    // Each wall is split into smaller modular blocks for detailed texture
    for (let w = 0; w < 36; w++) {
      const wallIdx = w % 4;
      const seg = Math.floor(w / 4); // 9 segments per wall side
      const offset = -2.8 + seg * 0.7;
      let bx = 0, bz = 0, ry = 0;
      if (wallIdx === 0) { bx = offset; bz = -3.0; ry = 0; }
      else if (wallIdx === 1) { bx = 3.0; bz = offset; ry = Math.PI / 2; }
      else if (wallIdx === 2) { bx = -offset; bz = 3.0; ry = 0; }
      else { bx = -3.0; bz = -offset; ry = Math.PI / 2; }

      // Don't place block if it's the center entry on the ground floor
      if (f === 0 && wallIdx === 0 && seg === 4) {
        add('box', bx, fy + 0.5, bz, 0.1, 1.2, 0.1, 0, ry, 0, '#3f3f46', 'ArchSupport');
        continue;
      }
      // Alternate bricks
      const color = brickColors[(f + w) % brickColors.length];
      add('box', bx, fy, bz, 0.65, 1.2, 0.22, 0, ry, 0, color, `Brick_${f}_${w}`);
    }
  }
  // Window arch frames (~60 pieces)
  for (let f = 1; f < 4; f++) {
    const fy = f * 1.25 + 0.6;
    for (let w = 0; w < 4; w++) {
      const angle = w * (Math.PI / 2);
      const wx = Math.cos(angle) * 3.08;
      const wz = Math.sin(angle) * 3.08;
      // Window arch headers
      add('box', wx, fy + 0.5, wz, 0.8, 0.12, 0.35, 0, angle, 0, '#78716c', `WinArch_${f}_${w}`);
      add('box', wx - Math.sin(angle) * 0.35, fy, wz + Math.cos(angle) * 0.35, 0.1, 0.8, 0.25, 0, angle, 0, '#78716c', `WinPostL_${f}_${w}`);
      add('box', wx + Math.sin(angle) * 0.35, fy, wz - Math.cos(angle) * 0.35, 0.1, 0.8, 0.25, 0, angle, 0, '#78716c', `WinPostR_${f}_${w}`);
      // Glass
      add('box', wx, fy, wz, 0.6, 0.7, 0.05, 0, angle, 0, '#7dd3fc', `WinGlass_${f}_${w}`);
    }
  }
  // Inner courtyard well
  add('cylinder', 0, 0.25, 0, 0.6, 0.5, 0.6, 0, 0, 0, '#78716c', 'WellWall');
  add('cylinder', 0, 0.2, 0, 0.45, 0.5, 0.45, 0, 0, 0, '#0284c7', 'WellWater');
  add('box', -0.3, 0.7, 0, 0.08, 0.9, 0.08, 0, 0, 0, '#52525b', 'WellPostL');
  add('box', 0.3, 0.7, 0, 0.08, 0.9, 0.08, 0, 0, 0, '#52525b', 'WellPostR');
  add('box', 0, 1.15, 0, 0.68, 0.08, 0.2, 0, 0, 0, '#b45309', 'WellRoof');

  // Clay-red tiled roof (50 interlocking wedges/slabs)
  const roofColor = '#9a3412';
  for (let r = 0; r < 50; r++) {
    const layer = Math.floor(r / 16);
    const step = r % 16;
    const rAngle = (step / 16) * Math.PI * 2;
    const rad = 3.3 - layer * 0.8;
    const rx = Math.cos(rAngle) * rad;
    const rz = Math.sin(rAngle) * rad;
    const ry = 5.25 + layer * 0.4;
    add('wedge', rx, ry, rz, 0.7, 0.3, 0.6, 0.4, -rAngle, 0, roofColor, `RoofTile_${r}`);
  }
  return o;
}

function generateSamuraiEstate() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#27272a', name = 'Samurai') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Base platform
  add('box', 0, 0.15, 0, 9.0, 0.3, 9.0, 0, 0, 0, '#52525b', 'Platform');
  // Traditional gatehouse (60 parts)
  const gateX = -4.0;
  add('box', gateX, 0.9, -1.0, 0.35, 1.5, 0.35, 0, 0, 0, '#7f1d1d', 'GatePostL');
  add('box', gateX, 0.9, 1.0, 0.35, 1.5, 0.35, 0, 0, 0, '#7f1d1d', 'GatePostR');
  add('box', gateX, 1.6, 0, 0.3, 0.25, 2.4, 0, 0, 0, '#7f1d1d', 'GateLintel');
  add('wedge', gateX, 1.9, 0, 0.8, 0.4, 3.0, 0, 0, 0, '#18181b', 'GateRoof');
  // Gate doors
  add('box', gateX, 0.75, -0.45, 0.08, 1.1, 0.8, 0, 0.3, 0, '#b45309', 'GateDoorL');
  add('box', gateX, 0.75, 0.45, 0.08, 1.1, 0.8, 0, -0.3, 0, '#b45309', 'GateDoorR');

  // Main Estate walls and sliding tatami wood frames (80 parts)
  const wallColors = ['#fafaf9', '#f5f5f4', '#e7e5e4'];
  const frameColor = '#78350f';
  // Central structure
  add('box', 1.0, 0.8, 0, 5.0, 1.2, 5.0, 0, 0, 0, wallColors[0], 'MainStructureBody');
  for (let w = 0; w < 16; w++) {
    const angle = (w / 16) * Math.PI * 2;
    const wx = 1.0 + Math.cos(angle) * 2.52;
    const wz = Math.sin(angle) * 2.52;
    // Outer wooden frames
    add('box', wx, 0.8, wz, 0.15, 1.15, 0.9, 0, angle + Math.PI/2, 0, frameColor, `SlidingFrame_${w}`);
    // Tatami grid pattern dividers
    for (let g = 0; g < 4; g++) {
      add('box', wx, 0.3 + g * 0.3, wz, 0.18, 0.04, 0.8, 0, angle + Math.PI/2, 0, '#d97706', `TatamiGrid_${w}_${g}`);
    }
  }

  // Multi-layered curved pagoda roofs (~90 pieces)
  const roofColor = '#18181b';
  // Lower roof tier
  for (let r = 0; r < 32; r++) {
    const angle = (r / 32) * Math.PI * 2;
    const rx = 1.0 + Math.cos(angle) * 3.1;
    const rz = Math.sin(angle) * 3.1;
    add('wedge', rx, 1.55, rz, 0.9, 0.35, 0.75, 0.25, -angle, 0.1, roofColor, `LowerRoofTile_${r}`);
  }
  // Upper structure & roof tier
  add('box', 1.0, 2.1, 0, 3.2, 1.0, 3.2, 0, 0, 0, '#fafaf9', 'UpperStructureBody');
  for (let r = 0; r < 24; r++) {
    const angle = (r / 24) * Math.PI * 2;
    const rx = 1.0 + Math.cos(angle) * 2.1;
    const rz = Math.sin(angle) * 2.1;
    add('wedge', rx, 2.75, rz, 0.8, 0.3, 0.65, 0.3, -angle, 0.15, roofColor, `UpperRoofTile_${r}`);
  }
  // Top spire
  add('cone', 1.0, 3.6, 0, 0.6, 1.2, 0.6, 0, 0, 0, '#ca8a04', 'RoofSpire');

  // Zen gardens (sand and rocks, 30 elements)
  add('box', -2.8, 0.18, -2.8, 2.5, 0.05, 2.5, 0, 0, 0, '#e7e5e4', 'SandGarden');
  const rockColors = ['#71717a', '#52525b', '#3f3f46'];
  for (let s = 0; s < 8; s++) {
    const sx = -3.5 + Math.sin(s * 1.7) * 0.9;
    const sz = -3.5 + Math.cos(s * 2.3) * 0.9;
    add('sphere', sx, 0.28, sz, 0.3 + (s % 3) * 0.1, 0.2 + (s % 2) * 0.08, 0.3 + (s % 3) * 0.08, 0.1, s * 0.8, -0.15, rockColors[s % rockColors.length], `ZenRock_${s}`);
  }
  return o;
}

function generatePuebloDwelling() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#d97706', name = 'Pueblo') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Adobe clay rooms stacked on multiple tiers (120 rooms & brick subsections)
  const clayColors = ['#c2410c', '#b45309', '#d97706', '#ea580c', '#d97706'];
  const rooms = [
    // Tier 1 (Ground)
    { x: -2.2, y: 0.6, z: -2.2, sx: 2.4, sy: 1.2, sz: 2.4 },
    { x: 0.2, y: 0.6, z: -2.2, sx: 2.2, sy: 1.2, sz: 2.4 },
    { x: 2.4, y: 0.6, z: -2.2, sx: 2.0, sy: 1.2, sz: 2.4 },
    { x: -2.2, y: 0.6, z: 0.2, sx: 2.4, sy: 1.2, sz: 2.2 },
    { x: 2.4, y: 0.6, z: 0.2, sx: 2.0, sy: 1.2, sz: 2.2 },
    { x: -2.2, y: 0.6, z: 2.4, sx: 2.4, sy: 1.2, sz: 2.0 },
    // Tier 2
    { x: -1.8, y: 1.7, z: -1.8, sx: 2.2, sy: 1.0, sz: 2.2 },
    { x: 0.4, y: 1.7, z: -1.8, sx: 2.0, sy: 1.0, sz: 2.2 },
    { x: 2.0, y: 1.7, z: -1.8, sx: 1.8, sy: 1.0, sz: 2.2 },
    { x: -1.8, y: 1.7, z: 0.4, sx: 2.2, sy: 1.0, sz: 2.0 },
    // Tier 3
    { x: -1.4, y: 2.6, z: -1.4, sx: 2.0, sy: 0.8, sz: 2.0 },
    { x: 0.6, y: 2.6, z: -1.4, sx: 1.8, sy: 0.8, sz: 2.0 }
  ];

  rooms.forEach((rm, rIdx) => {
    // Generate room base
    add('box', rm.x, rm.y, rm.z, rm.sx, rm.sy, rm.sz, 0, 0, 0, clayColors[rIdx % clayColors.length], `AdobeRoom_${rIdx}`);
    // Tiny entryways and dark square windows for each room
    add('box', rm.x, rm.y + rm.sy * 0.1, rm.z + rm.sz * 0.505, 0.4, 0.6, 0.05, 0, 0, 0, '#1c1917', `Entry_${rIdx}`);
    add('box', rm.x + rm.sx * 0.505, rm.y + rm.sy * 0.25, rm.z, 0.05, 0.25, 0.25, 0, 0, 0, '#1c1917', `WinSide_${rIdx}`);

    // Wooden ceiling logs protruding outwards (vigas, 10 per room = 120 total)
    for (let v = 0; v < 10; v++) {
      const vx = rm.x - rm.sx * 0.45 + (v * rm.sx * 0.1);
      add('cylinder', vx, rm.y + rm.sy * 0.42, rm.z, 0.08, rm.sz * 1.15, 0.08, Math.PI / 2, 0, 0, '#78350f', `CeilingLog_${rIdx}_${v}`);
    }
  });

  // Support ladders leaning between tiers (5 ladders, ~30 blocks)
  const ladders = [
    { lx: -0.8, ly: 1.1, lz: 0.5, rx: 0.25, ry: 0, rz: 0.15, h: 1.6 },
    { lx: 1.5, ly: 1.1, lz: -0.5, rx: 0.15, ry: 0.5, rz: -0.2, h: 1.6 },
    { lx: -0.6, ly: 2.0, lz: -0.6, rx: 0.2, ry: -0.3, rz: 0.1, h: 1.4 },
    { lx: 0.9, ly: 2.0, lz: -0.6, rx: -0.15, ry: 0.4, rz: 0.2, h: 1.4 },
    { lx: 0.0, ly: 2.9, lz: -0.3, rx: 0.25, ry: 0.2, rz: -0.1, h: 1.2 }
  ];
  ladders.forEach((ld, lIdx) => {
    add('box', ld.lx - 0.15, ld.ly, ld.lz, 0.05, ld.h, 0.05, ld.rx, ld.ry, ld.rz, '#a16207', `LadderRailsL_${lIdx}`);
    add('box', ld.lx + 0.15, ld.ly, ld.lz, 0.05, ld.h, 0.05, ld.rx, ld.ry, ld.rz, '#a16207', `LadderRailsR_${lIdx}`);
    const rungs = Math.floor(ld.h / 0.25);
    for (let rg = 0; rg < rungs; rg++) {
      const rgy = ld.ly - ld.h * 0.4 + rg * 0.25;
      add('cylinder', ld.lx, rgy, ld.lz, 0.02, 0.32, 0.02, ld.rx, ld.ry, ld.rz + Math.PI/2, '#a16207', `LadderRung_${lIdx}_${rg}`);
    }
  });

  // Clay pottery and decorations (around 40 shapes scattered)
  for (let p = 0; p < 20; p++) {
    const potX = -3.0 + Math.sin(p * 2.1) * 6.0;
    const potZ = -3.0 + Math.cos(p * 1.8) * 6.0;
    const potY = 0.3 + (potX * potX + potZ * potZ > 12 ? 0 : 1.1);
    add('cylinder', potX, potY, potZ, 0.18, 0.25, 0.18, 0, 0, 0, '#c2410c', `ClayPot_${p}`);
    add('sphere', potX, potY + 0.15, potZ, 0.22, 0.18, 0.22, 0, 0, 0, '#ea580c', `ClayPotRim_${p}`);
  }
  return o;
}

function generateChineseSiheyuan() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#3f3f46', name = 'Siheyuan') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Symmetrical enclosure brick walls (80 modular segments)
  const wallColor = '#52525b';
  for (let i = 0; i < 40; i++) {
    const offset = -4.5 + i * 0.23;
    // South Wall
    if (Math.abs(offset) > 0.8) {
      add('box', offset, 0.7, -4.5, 0.24, 1.4, 0.35, 0, 0, 0, wallColor, `WallSouth_${i}`);
    }
    // North Wall
    add('box', offset, 0.7, 4.5, 0.24, 1.4, 0.35, 0, 0, 0, wallColor, `WallNorth_${i}`);
    // East Wall
    add('box', 4.5, 0.7, offset, 0.35, 1.4, 0.24, 0, Math.PI/2, 0, wallColor, `WallEast_${i}`);
    // West Wall
    add('box', -4.5, 0.7, offset, 0.35, 1.4, 0.24, 0, Math.PI/2, 0, wallColor, `WallWest_${i}`);
  }

  // Central Courtyard garden (water basin, rocks, and trees)
  add('box', 0, 0.15, 0, 3.5, 0.1, 3.5, 0, 0, 0, '#78716c', 'CourtyardBasin');
  add('box', 0, 0.2, 0, 2.5, 0.05, 2.5, 0, 0, 0, '#0284c7', 'CourtyardWater');
  // Decorative Archway (Gate) in south wall center
  add('box', -0.7, 0.9, -4.5, 0.2, 1.8, 0.2, 0, 0, 0, '#7f1d1d', 'ArchPostL');
  add('box', 0.7, 0.9, -4.5, 0.2, 1.8, 0.2, 0, 0, 0, '#7f1d1d', 'ArchPostR');
  add('box', 0, 1.8, -4.5, 0.2, 0.2, 1.6, 0, 0, 0, '#7f1d1d', 'ArchLintel');
  add('wedge', 0, 2.05, -4.5, 0.6, 0.35, 2.0, 0, 0, 0, '#18181b', 'ArchRoof');

  // Main Pavilion (North building) & Side pavilions (East/West buildings, ~120 blocks)
  const brickColor = '#a1a1aa';
  const pillarColor = '#7f1d1d';
  const tileColor = '#18181b';
  // North Hall
  add('box', 0, 0.9, 3.4, 5.0, 1.8, 1.8, 0, 0, 0, brickColor, 'NorthHallBody');
  add('wedge', 0, 2.1, 3.4, 2.1, 0.6, 5.5, 0, 0, 0, tileColor, 'NorthHallRoofL');
  add('wedge', 0, 2.1, 3.4, 2.1, 0.6, 5.5, 0, Math.PI, 0, tileColor, 'NorthHallRoofR');
  // East Hall
  add('box', 3.4, 0.8, 0, 1.6, 1.6, 4.0, 0, 0, 0, brickColor, 'EastHallBody');
  add('wedge', 3.4, 1.8, 0, 1.8, 0.5, 4.4, 0, Math.PI/2, 0, tileColor, 'EastHallRoofL');
  add('wedge', 3.4, 1.8, 0, 1.8, 0.5, 4.4, 0, -Math.PI/2, 0, tileColor, 'EastHallRoofR');
  // West Hall
  add('box', -3.4, 0.8, 0, 1.6, 1.6, 4.0, 0, 0, 0, brickColor, 'WestHallBody');
  add('wedge', -3.4, 1.8, 0, 1.8, 0.5, 4.4, 0, Math.PI/2, 0, tileColor, 'WestHallRoofL');
  add('wedge', -3.4, 1.8, 0, 1.8, 0.5, 4.4, 0, -Math.PI/2, 0, tileColor, 'WestHallRoofR');

  // Pillars for pavilions (24 pillars)
  const pavilionPillars = [
    { x: -2.3, z: 2.3 }, { x: -0.8, z: 2.3 }, { x: 0.8, z: 2.3 }, { x: 2.3, z: 2.3 },
    { x: 2.4, z: -1.8 }, { x: 2.4, z: 1.8 }, { x: -2.4, z: -1.8 }, { x: -2.4, z: 1.8 }
  ];
  pavilionPillars.forEach((p, idx) => {
    add('cylinder', p.x, 0.85, p.z, 0.12, 1.7, 0.12, 0, 0, 0, pillarColor, `PavilionPillar_${idx}`);
  });

  // Brick walkways and courtyard steps (~40 blocks)
  for (let w = 0; w < 20; w++) {
    add('box', -2.2 + w * 0.23, 0.16, 2.2, 0.2, 0.03, 0.6, 0, 0, 0, '#71717a', `WalkwayNorth_${w}`);
    add('box', -2.2 + w * 0.23, 0.16, -2.2, 0.2, 0.03, 0.6, 0, 0, 0, '#71717a', `WalkwaySouth_${w}`);
  }
  return o;
}

function generateRomanColosseum() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#d6d3d1', name = 'Colosseum') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Layered circular arcades, broken ruin segments (280 objects)
  const stoneColor = '#e7e5e4';
  const darkStone = '#a8a29e';

  // Base Arena Floor (Sand arena)
  add('cylinder', 0, 0.1, 0, 4.0, 0.2, 4.0, 0, 0, 0, '#fef08a', 'SandArena');

  // Concentric layered arcade rings
  for (let f = 0; f < 3; f++) {
    const fy = 0.5 + f * 1.1;
    const rad = 4.8 + f * 0.25;
    const count = 36 - f * 3;
    for (let a = 0; a < count; a++) {
      const angle = (a / count) * Math.PI * 2;
      // Colosseum is broken / ruined on one side (from angle 0 to PI/2, some parts are missing)
      if (angle > 0.1 && angle < Math.PI * 0.55 && f > 0) {
        // Skip some arches to look ruined
        if (Math.sin(a * 1.5) > -0.2) continue;
      }

      const ax = Math.cos(angle) * rad;
      const az = Math.sin(angle) * rad;

      // Pillars / Arcade posts (2 per archway)
      add('box', ax, fy, az, 0.25, 1.0, 0.25, 0, -angle, 0, stoneColor, `ArcadePillar_${f}_${a}`);

      // Arch header
      add('box', ax, fy + 0.5, az, 0.45, 0.12, 0.25, 0, -angle, 0, darkStone, `ArcadeArch_${f}_${a}`);

      // Outer columns on arcade face
      add('cylinder', ax * 1.04, fy, az * 1.04, 0.08, 0.95, 0.08, 0, -angle, 0, '#d6d3d1', `ArcadeCol_${f}_${a}`);
    }
  }

  // Inner stepped seating (Cavea, ~100 blocks)
  for (let r = 0; r < 5; r++) {
    const sRad = 4.0 + r * 0.15;
    const sHeight = 0.2 + r * 0.25;
    const sCount = 30;
    for (let s = 0; s < sCount; s++) {
      const angle = (s / sCount) * Math.PI * 2;
      // Match the ruined side
      if (angle > 0.2 && angle < Math.PI * 0.5 && r > 2) continue;

      const sx = Math.cos(angle) * sRad;
      const sz = Math.sin(angle) * sRad;
      add('box', sx, sHeight, sz, 0.25, 0.25, 0.55, 0.4, -angle, 0, '#d6d3d1', `Seating_${r}_${s}`);
    }
  }

  // Broken ruin segments lying inside and outside the arena (~40 blocks)
  for (let b = 0; b < 24; b++) {
    const bx = -2.5 + Math.sin(b * 1.9) * 5.0;
    const bz = -2.5 + Math.cos(b * 1.4) * 5.0;
    add('box', bx, 0.18, bz, 0.3 + (b % 3) * 0.1, 0.15 + (b % 2) * 0.1, 0.3 + (b % 2) * 0.1, Math.random() * 0.4, Math.random() * Math.PI, Math.random() * 0.3, '#78716c', `RuinRubble_${b}`);
  }
  return o;
}

function generateParthenon() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#f5f5f4', name = 'Parthenon') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Grand rectangular base (3 steps)
  add('box', 0, 0.12, 0, 5.0, 0.24, 8.5, 0, 0, 0, '#e7e5e4', 'BaseStep1');
  add('box', 0, 0.28, 0, 4.7, 0.16, 8.2, 0, 0, 0, '#f5f5f4', 'BaseStep2');
  add('box', 0, 0.4, 0, 4.4, 0.12, 7.9, 0, 0, 0, '#fafaf9', 'BaseStep3');

  // Doric colonnade columns on all sides (46 columns total, with capitals and bases = ~140 blocks)
  const colColor = '#fafaf9';
  const columns = [];
  // Long sides (17 columns per side)
  for (let z = -3.7; z <= 3.701; z += 0.46) {
    columns.push({ x: -2.0, z });
    columns.push({ x: 2.0, z });
  }
  // Front and Back sides (6 additional columns per end)
  for (let x = -1.54; x <= 1.5401; x += 0.51) {
    columns.push({ x, z: -3.7 });
    columns.push({ x, z: 3.7 });
  }

  columns.forEach((col, idx) => {
    // Column shafts
    add('cylinder', col.x, 1.45, col.z, 0.16, 2.0, 0.16, 0, 0, 0, colColor, `Column_${idx}`);
    // Column capitals
    add('box', col.x, 2.5, col.z, 0.24, 0.08, 0.24, 0, 0, 0, '#e7e5e4', `Capital_${idx}`);
  });

  // Inner chamber (Cella)
  add('box', 0, 1.45, 0, 2.6, 2.0, 6.0, 0, 0, 0, '#f5f5f4', 'CellaBody');
  add('box', 0, 0.7, -3.01, 0.6, 1.2, 0.06, 0, 0, 0, '#78350f', 'CellaDoor');

  // Decorative pediment frieze and architrave (~100 blocks)
  add('box', 0, 2.62, 0, 4.2, 0.16, 7.7, 0, 0, 0, '#e7e5e4', 'Architrave');
  add('box', 0, 2.76, 0, 4.3, 0.12, 7.8, 0, 0, 0, '#fafaf9', 'Frieze');

  // Triglyphs and Metopes decoration (repeating detailed slabs along the frieze)
  for (let mz = -3.7; mz <= 3.701; mz += 0.4) {
    add('box', -2.16, 2.76, mz, 0.04, 0.1, 0.08, 0, 0, 0, '#d6d3d1', `FriezeDetL_${mz}`);
    add('box', 2.16, 2.76, mz, 0.04, 0.1, 0.08, 0, 0, 0, '#d6d3d1', `FriezeDetR_${mz}`);
  }

  // Triangular pediments at front and back ends
  // Front Pediment (slanted wedges)
  add('wedge', -1.05, 3.02, -3.7, 2.1, 0.45, 0.2, 0, 0, 0, '#fafaf9', 'PedimentFrontL');
  add('wedge', 1.05, 3.02, -3.7, 2.1, 0.45, 0.2, 0, Math.PI, 0, '#fafaf9', 'PedimentFrontR');
  // Back Pediment
  add('wedge', -1.05, 3.02, 3.7, 2.1, 0.45, 0.2, 0, 0, 0, '#fafaf9', 'PedimentBackL');
  add('wedge', 1.05, 3.02, 3.7, 2.1, 0.45, 0.2, 0, Math.PI, 0, '#fafaf9', 'PedimentBackR');
  return o;
}

function generatePyramidGiza() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#fef08a', name = 'Pyramid') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Stepped limestone block sloped sides (18 tiers, ~220 blocks)
  const pyramidColor = '#eab308';
  const alternateColor = '#ca8a04';
  const totalTiers = 18;
  for (let t = 0; t < totalTiers; t++) {
    const ty = 0.1 + t * 0.25;
    const baseWidth = 8.5 - t * 0.45;
    // We construct each square tier out of 12 sub-blocks to get detailed block edges
    for (let s = 0; s < 12; s++) {
      const angle = (s / 12) * Math.PI * 2;
      const bx = Math.cos(angle) * (baseWidth * 0.42);
      const bz = Math.sin(angle) * (baseWidth * 0.42);
      const color = (t + s) % 2 === 0 ? pyramidColor : alternateColor;
      add('box', bx, ty, bz, baseWidth * 0.22, 0.26, baseWidth * 0.22, 0, angle, 0, color, `SteppedBlock_${t}_${s}`);
    }
  }

  // Golden apex capstone
  add('cone', 0, 0.1 + totalTiers * 0.25 + 0.3, 0, 0.8, 0.6, 0.8, 0, 0, 0, '#fbbf24', 'GoldenCapstone');

  // Sphinx guardian statue at front (30 parts)
  const spX = 0;
  const spY = 0.3;
  const spZ = -4.25;
  add('box', spX, spY, spZ, 0.6, 0.45, 1.2, 0, 0, 0, '#ca8a04', 'SphinxBody');
  add('sphere', spX, spY + 0.35, spZ - 0.45, 0.35, 0.35, 0.35, 0, 0, 0, '#ca8a04', 'SphinxHead');
  add('box', spX, spY + 0.38, spZ - 0.3, 0.48, 0.15, 0.3, 0.1, 0, 0, '#eab308', 'SphinxHeaddress');
  // Paws
  add('box', spX - 0.22, spY - 0.12, spZ - 0.65, 0.15, 0.15, 0.4, 0, 0, 0, '#ca8a04', 'SphinxPawL');
  add('box', spX + 0.22, spY - 0.12, spZ - 0.65, 0.15, 0.15, 0.4, 0, 0, 0, '#ca8a04', 'SphinxPawR');
  return o;
}

function generateStonehenge() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#78716c', name = 'Stonehenge') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Concentric circles of massive standing sarsen stones & lintels (~250 shapes)
  const grassColor = '#166534';
  const stoneColor = '#57534e';
  const lintelColor = '#78716c';

  // Grass base
  add('cylinder', 0, 0.05, 0, 8.5, 0.1, 8.5, 0, 0, 0, grassColor, 'StonehengeBase');

  // Outer Circle (18 standing stones + 18 lintels)
  const outerCount = 18;
  const outerRad = 3.6;
  for (let i = 0; i < outerCount; i++) {
    const angle = (i / outerCount) * Math.PI * 2;
    const sx = Math.cos(angle) * outerRad;
    const sz = Math.sin(angle) * outerRad;
    const sy = 0.85;

    // Outer upright monolith (broken/crooked look using small rotations)
    const rx = 0.05 * Math.sin(i * 1.7);
    const rz = 0.05 * Math.cos(i * 2.3);
    add('box', sx, sy, sz, 0.45, 1.6, 0.28, rx, -angle, rz, stoneColor, `OuterUpright_${i}`);

    // Horizontal Lintel bridging to next stone
    const nextAngle = ((i + 1) / outerCount) * Math.PI * 2;
    const lx = (Math.cos(angle) + Math.cos(nextAngle)) * 0.5 * outerRad;
    const lz = (Math.sin(angle) + Math.sin(nextAngle)) * 0.5 * outerRad;
    // Don't place all lintels to simulate ruins / fallen stones (skip 4 of them)
    if (i % 5 !== 0) {
      add('box', lx, 1.7, lz, 0.85, 0.22, 0.35, 0, -angle - Math.PI/outerCount, 0, lintelColor, `OuterLintel_${i}`);
    }
  }

  // Inner Circle (12 smaller standing monoliths)
  const innerCount = 12;
  const innerRad = 2.4;
  for (let i = 0; i < innerCount; i++) {
    const angle = (i / innerCount) * Math.PI * 2;
    const sx = Math.cos(angle) * innerRad;
    const sz = Math.sin(angle) * innerRad;
    const sy = 0.55;
    const rx = 0.08 * Math.cos(i * 1.5);
    const rz = 0.08 * Math.sin(i * 1.2);
    add('box', sx, sy, sz, 0.3, 1.0, 0.2, rx, -angle, rz, '#44403c', `InnerStone_${i}`);
  }

  // Central trilithons (5 pairs of massive stones with lintels in horseshoe shape, ~120 blocks)
  const horseshoes = [
    { angle: -Math.PI * 0.35, h: 2.1 },
    { angle: -Math.PI * 0.15, h: 2.35 },
    { angle: Math.PI * 0.0, h: 2.5 },
    { angle: Math.PI * 0.15, h: 2.35 },
    { angle: Math.PI * 0.35, h: 2.1 }
  ];
  horseshoes.forEach((hs, idx) => {
    const rad = 1.35;
    const cx1 = Math.cos(hs.angle - 0.12) * rad;
    const cz1 = Math.sin(hs.angle - 0.12) * rad;
    const cx2 = Math.cos(hs.angle + 0.12) * rad;
    const cz2 = Math.sin(hs.angle + 0.12) * rad;

    // Two upright monoliths
    add('box', cx1, hs.h * 0.5, cz1, 0.5, hs.h, 0.3, 0.03, -hs.angle, 0.03, '#292524', `HorseshoeUprightA_${idx}`);
    add('box', cx2, hs.h * 0.5, cz2, 0.5, hs.h, 0.3, -0.03, -hs.angle, -0.03, '#292524', `HorseshoeUprightB_${idx}`);

    // Top lintel
    const lx = Math.cos(hs.angle) * rad;
    const lz = Math.sin(hs.angle) * rad;
    add('box', lx, hs.h + 0.12, lz, 0.9, 0.25, 0.4, 0, -hs.angle, 0, '#57534e', `HorseshoeLintel_${idx}`);
  });

  // Fallen stones lying around the center
  for (let f = 0; f < 8; f++) {
    const fx = -1.2 + Math.sin(f * 2.5) * 2.2;
    const fz = -1.2 + Math.cos(f * 2.1) * 2.2;
    add('box', fx, 0.15, fz, 0.9, 0.22, 0.4, 0.1, f * 0.9, 0.05, '#44403c', `FallenStone_${f}`);
  }
  return o;
}

function generateMayanTemple() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#78716c', name = 'Mayan') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // 9 stepped pyramid terraces (150 blocks)
  const stoneColor = '#78716c';
  const darkStone = '#57534e';
  const stairColor = '#a8a29e';

  for (let t = 0; t < 9; t++) {
    const ty = 0.18 + t * 0.42;
    const size = 8.0 - t * 0.75;
    // Render detailed modular blocks along each terrace perimeter
    for (let b = 0; b < 12; b++) {
      const angle = (b / 12) * Math.PI * 2;
      const bx = Math.cos(angle) * (size * 0.44);
      const bz = Math.sin(angle) * (size * 0.44);
      add('box', bx, ty, bz, size * 0.25, 0.44, size * 0.25, 0, angle, 0, (t + b) % 2 === 0 ? stoneColor : darkStone, `Terrace_${t}_${b}`);
    }
  }

  // Steep central stairways on all 4 faces (~80 blocks)
  for (let s = 0; s < 4; s++) {
    const angle = s * (Math.PI / 2);
    const steps = 18;
    for (let st = 0; st < steps; st++) {
      const ratio = st / steps;
      const sy = 0.12 + ratio * 3.8;
      const dist = 4.2 - ratio * 3.4;
      const sx = Math.cos(angle) * dist;
      const sz = Math.sin(angle) * dist;
      // Step blocks
      add('box', sx, sy, sz, 0.95, 0.15, 0.25, 0, angle, 0, stairColor, `Stairs_${s}_${st}`);
    }
    // Stairway banisters / side walls
    add('box', Math.cos(angle) * 2.3, 1.9, Math.sin(angle) * 2.3, 0.12, 4.0, 4.6, 0.65, angle, 0, darkStone, `Banister_${s}`);
  }

  // Top temple chamber (20 blocks)
  const topY = 4.15;
  add('box', 0, topY, 0, 1.8, 1.0, 1.8, 0, 0, 0, stoneColor, 'TempleChamber');
  add('box', 0, topY + 0.6, 0, 2.1, 0.2, 2.1, 0, 0, 0, darkStone, 'TempleRoof');
  add('box', 0, topY - 0.1, -0.905, 0.45, 0.65, 0.05, 0, 0, 0, '#1c1917', 'TempleEntry');
  return o;
}

function generateGreatBazaar() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#a1a1aa', name = 'Bazaar') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Vaulted domed ceilings (~90 blocks)
  const domeColor = '#dc2626';
  const brickColor = '#d4d4d8';
  add('box', 0, 0.15, 0, 8.5, 0.3, 8.5, 0, 0, 0, '#71717a', 'Foundations');

  // Vault arches for grid layout
  const gridPositions = [-3.0, 0, 3.0];
  gridPositions.forEach((x, xIdx) => {
    gridPositions.forEach((z, zIdx) => {
      // 9 domes
      add('sphere', x, 3.0, z, 1.4, 0.75, 1.4, 0, 0, 0, domeColor, `Dome_${xIdx}_${zIdx}`);
      add('cylinder', x, 2.65, z, 1.3, 0.1, 1.3, 0, 0, 0, '#ca8a04', `DomeTrim_${xIdx}_${zIdx}`);

      // Support pillars
      add('box', x - 0.9, 1.25, z - 0.9, 0.25, 2.5, 0.25, 0, 0, 0, brickColor, `DomePillarA_${xIdx}_${zIdx}`);
      add('box', x + 0.9, 1.25, z + 0.9, 0.25, 2.5, 0.25, 0, 0, 0, brickColor, `DomePillarB_${xIdx}_${zIdx}`);
    });
  });

  // Grid merchant stalls with colorful goods (100 objects)
  const awningColors = ['#f43f5e', '#3b82f6', '#10b981', '#ca8a04', '#ea580c'];
  const stallPositions = [
    { x: -2.8, z: -1.4 }, { x: -2.8, z: 1.4 }, { x: 0, z: -1.4 }, { x: 0, z: 1.4 },
    { x: 2.8, z: -1.4 }, { x: 2.8, z: 1.4 }, { x: -1.4, z: -2.8 }, { x: 1.4, z: -2.8 }
  ];
  stallPositions.forEach((pos, idx) => {
    const yaw = (idx % 2) * (Math.PI / 2);
    // Stall counter
    add('box', pos.x, 0.5, pos.y, 1.1, 0.7, 0.7, 0, yaw, 0, '#78350f', `Stall_${idx}`);
    // Fabric Awning
    add('box', pos.x, 1.15, pos.y, 1.25, 0.08, 0.85, 0.18, yaw, 0, awningColors[idx % awningColors.length], `Awning_${idx}`);
    // Goods boxes & jars on counters
    for (let g = 0; g < 6; g++) {
      const gx = pos.x - 0.3 + g * 0.13;
      add('box', gx, 0.9, pos.y, 0.1, 0.15, 0.1, 0, yaw, 0, '#d97706', `Goods_${idx}_${g}`);
    }
  });

  // Hanging lanterns (~40 shapes)
  for (let l = 0; l < 24; l++) {
    const lx = -3.0 + (l % 5) * 1.5;
    const lz = -3.0 + Math.floor(l / 5) * 1.5;
    add('cylinder', lx, 2.4, lz, 0.02, 0.4, 0.02, 0, 0, 0, '#1c1917', `LanternChain_${l}`);
    add('sphere', lx, 2.15, lz, 0.15, 0.22, 0.15, 0, 0, 0, '#eab308', `LanternLight_${l}`);
  }

  // Arched entrance gate (30 blocks)
  const gateZ = -4.3;
  add('box', -1.2, 1.4, gateZ, 0.35, 2.8, 0.45, 0, 0, 0, brickColor, 'GatePostL');
  add('box', 1.2, 1.4, gateZ, 0.35, 2.8, 0.45, 0, 0, 0, brickColor, 'GatePostR');
  add('box', 0, 2.9, gateZ, 2.65, 0.35, 0.45, 0, 0, 0, '#71717a', 'GateArchTop');
  add('torus', 0, 2.6, gateZ, 1.1, 1.1, 0.15, 0, 0, 0, '#ca8a04', 'GateOrnament');
  return o;
}

function generateRomanForum() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#e2e8f0', name = 'Forum') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Open courtyard plaza, stone stalls, fabric awnings (270 objects)
  const pavementColor = '#cbd5e1';
  const stoneColor = '#f1f5f9';
  const fabricColors = ['#f43f5e', '#ef4444', '#eab308', '#3b82f6', '#ec4899'];

  // Courtyard base
  add('box', 0, 0.12, 0, 8.5, 0.24, 8.5, 0, 0, 0, pavementColor, 'CourtyardPlaza');

  // Surrounded stone columns (Doric double rows, 48 columns total)
  const columns = [];
  for (let x = -3.8; x <= 3.81; x += 1.2) {
    columns.push({ x, z: -3.8 });
    columns.push({ x, z: 3.8 });
  }
  for (let z = -2.6; z <= 2.61; z += 1.2) {
    columns.push({ x: -3.8, z });
    columns.push({ x: 3.8, z });
  }
  columns.forEach((col, idx) => {
    add('cylinder', col.x, 1.3, col.z, 0.15, 2.2, 0.15, 0, 0, 0, stoneColor, `ColColumn_${idx}`);
    add('box', col.x, 2.45, col.z, 0.25, 0.1, 0.25, 0, 0, 0, '#cbd5e1', `ColCap_${idx}`);
    add('box', col.x, 0.25, col.z, 0.25, 0.1, 0.25, 0, 0, 0, '#cbd5e1', `ColBase_${idx}`);
  });

  // Merchant stalls with fabric awnings (~120 blocks)
  const stallPositions = [
    { x: -2.0, z: -2.0, yaw: 0 }, { x: 2.0, z: -2.0, yaw: 0 },
    { x: -2.0, z: 2.0, yaw: Math.PI }, { x: 2.0, z: 2.0, yaw: Math.PI },
    { x: -2.2, z: 0, yaw: Math.PI/2 }, { x: 2.2, z: 0, yaw: -Math.PI/2 }
  ];
  stallPositions.forEach((pos, sIdx) => {
    // Stone counter blocks
    add('box', pos.x, 0.45, pos.z, 1.2, 0.65, 0.65, 0, pos.yaw, 0, stoneColor, `StallCounter_${sIdx}`);
    // Support posts (4 per stall)
    add('cylinder', pos.x - 0.5, 1.1, pos.z - 0.25, 0.05, 1.3, 0.05, 0, 0, 0, '#78350f', `StallPostA_${sIdx}`);
    add('cylinder', pos.x - 0.5, 1.1, pos.z + 0.25, 0.05, 1.3, 0.05, 0, 0, 0, '#78350f', `StallPostB_${sIdx}`);
    add('cylinder', pos.x + 0.5, 1.1, pos.z - 0.25, 0.05, 1.3, 0.05, 0, 0, 0, '#78350f', `StallPostC_${sIdx}`);
    add('cylinder', pos.x + 0.5, 1.1, pos.z + 0.25, 0.05, 1.3, 0.05, 0, 0, 0, '#78350f', `StallPostD_${sIdx}`);
    // Slanted fabric awning
    add('box', pos.x, 1.78, pos.z, 1.35, 0.06, 0.8, 0.25, pos.yaw, 0, fabricColors[sIdx % fabricColors.length], `StallAwning_${sIdx}`);

    // Baskets and pottery on counters
    for (let b = 0; b < 4; b++) {
      const bx = pos.x - 0.35 + b * 0.23;
      add('cylinder', bx, 0.85, pos.z, 0.14, 0.2, 0.14, 0, pos.yaw, 0, '#ca8a04', `StallGood_${sIdx}_${b}`);
    }
  });

  // Centerpiece Monumental Column
  add('box', 0, 0.35, 0, 0.85, 0.3, 0.85, 0, 0, 0, '#94a3b8', 'MonBase');
  add('cylinder', 0, 1.9, 0, 0.3, 2.8, 0.3, 0, 0, 0, stoneColor, 'MonShaft');
  add('sphere', 0, 3.45, 0, 0.45, 0.45, 0.45, 0, 0, 0, '#ca8a04', 'MonStatue');
  return o;
}

function generateMedievalCustomHouse() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#78716c', name = 'CustomHouse') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Waterfront stone docks, cargo cranes, warehouse goods barrels (~260 shapes)
  const dockColor = '#4b5563';
  const brickColor = '#a8a29e';
  const timberColor = '#451a03';
  const roofColor = '#9a3412';

  // Base Dock Deck
  add('box', 0, 0.2, 0, 8.5, 0.4, 8.5, 0, 0, 0, dockColor, 'DockPlaza');
  // Water interface (blue tiles on front side)
  add('box', 0, 0.05, -4.3, 8.5, 0.1, 0.8, 0, 0, 0, '#0284c7', 'HarborWater');

  // Custom House building (120 blocks)
  add('box', 1.0, 1.4, 1.5, 4.5, 2.0, 4.0, 0, 0, 0, brickColor, 'HouseBody');
  // Timber frame lines
  for (let h = 0; h < 6; h++) {
    const hz = -0.5 + h * 0.8;
    add('box', 3.28, 1.4, hz, 0.06, 2.0, 0.08, 0, 0, 0, timberColor, `TimberPostR_${h}`);
    add('box', -1.28, 1.4, hz, 0.06, 2.0, 0.08, 0, 0, 0, timberColor, `TimberPostL_${h}`);
  }
  // Gabled roof
  add('wedge', 1.0, 2.9, 1.5, 2.3, 1.0, 4.4, 0, Math.PI/2, 0, roofColor, 'RoofL');
  add('wedge', 1.0, 2.9, 1.5, 2.3, 1.0, 4.4, 0, -Math.PI/2, 0, roofColor, 'RoofR');

  // Cargo Crane (timber poles, gears, pulley rope, 50 blocks)
  const crX = -2.8;
  const crY = 1.0;
  const crZ = -1.5;
  // Crane mast & boom
  add('box', crX, crY, crZ, 0.25, 2.2, 0.25, 0, 0, 0, timberColor, 'CraneMast');
  add('box', crX + 0.6, crY + 1.0, crZ, 1.6, 0.18, 0.18, 0, 0, 0.45, timberColor, 'CraneBoom');
  add('box', crX + 0.2, crY + 0.35, crZ, 0.8, 0.12, 0.12, 0, 0, -0.6, timberColor, 'CraneStrut');
  // Pulley rope
  add('cylinder', crX + 1.25, crY + 0.2, crZ, 0.03, 1.4, 0.03, 0, 0, 0, '#e2e8f0', 'PulleyRope');
  add('box', crX + 1.25, crY - 0.45, crZ, 0.35, 0.35, 0.35, 0, 0.1, 0, '#ca8a04', 'CargoBox');

  // Warehouse goods barrels, boxes, and sack stacks (~80 elements)
  for (let b = 0; b < 24; b++) {
    const bx = -2.5 + Math.sin(b * 1.8) * 1.5;
    const bz = 2.0 + Math.cos(b * 1.5) * 1.8;
    add('cylinder', bx, 0.6, bz, 0.22, 0.5, 0.22, 0, 0, 0, '#78350f', `Barrel_${b}`);
    add('torus', bx, 0.4, bz, 0.24, 0.24, 0.05, Math.PI/2, 0, 0, '#27272a', `BarrelRingA_${b}`);
    add('torus', bx, 0.8, bz, 0.24, 0.24, 0.05, Math.PI/2, 0, 0, '#27272a', `BarrelRingB_${b}`);
  }
  for (let s = 0; s < 12; s++) {
    const sx = -3.2 + (s % 3) * 0.4;
    const sz = -0.5 + Math.floor(s / 3) * 0.4;
    add('box', sx, 0.5, sz, 0.35, 0.28, 0.35, 0.05, s * 0.5, 0.05, '#d97706', `CargoCrate_${s}`);
  }
  return o;
}

function generateSilkRoadCaravanserai() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#d97706', name = 'Caravanserai') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Fortified brick walls, central inner courtyard, stables, lodging rooms (~280 shapes)
  const clayColor = '#b45309';
  const darkClay = '#9a3412';
  const timberColor = '#78350f';

  // Base platform
  add('box', 0, 0.15, 0, 8.5, 0.3, 8.5, 0, 0, 0, '#78716c', 'Foundation');

  // Fortified outer walls (100 blocks)
  for (let w = 0; w < 44; w++) {
    const seg = w % 11;
    const wallIdx = Math.floor(w / 11);
    const offset = -3.7 + seg * 0.74;
    let wx = 0, wz = 0, ry = 0;
    if (wallIdx === 0) { wx = offset; wz = -3.8; ry = 0; }
    else if (wallIdx === 1) { wx = 3.8; wz = offset; ry = Math.PI / 2; }
    else if (wallIdx === 2) { wx = -offset; wz = 3.8; ry = 0; }
    else { wx = -3.8; wz = -offset; ry = Math.PI / 2; }

    // Skip gate entrance
    if (wallIdx === 0 && seg === 5) continue;

    add('box', wx, 1.0, wz, 0.72, 1.8, 0.45, 0, ry, 0, clayColor, `OuterWall_${w}`);
    add('box', wx, 2.0, wz, 0.75, 0.3, 0.5, 0, ry, 0, darkClay, `Crenellation_${w}`);
  }

  // Inner Courtyard stable bays and animal gates (~100 shapes)
  const stableBays = [
    { x: -2.6, z: -2.2, yaw: 0 }, { x: -2.6, z: -0.8, yaw: 0 }, { x: -2.6, z: 0.6, yaw: 0 }, { x: -2.6, z: 2.0, yaw: 0 },
    { x: 2.6, z: -2.2, yaw: Math.PI }, { x: 2.6, z: -0.8, yaw: Math.PI }, { x: 2.6, z: 0.6, yaw: Math.PI }, { x: 2.6, z: 2.0, yaw: Math.PI }
  ];
  stableBays.forEach((bay, idx) => {
    // Arched stables partition
    add('box', bay.x, 0.8, bay.z, 0.15, 1.3, 1.1, 0, bay.yaw, 0, '#d1d5db', `StableWall_${idx}`);
    add('box', bay.x - Math.cos(bay.yaw) * 0.4, 0.8, bay.z, 0.08, 1.1, 0.08, 0, bay.yaw, 0, timberColor, `StablePost_${idx}`);
    // Straw pile
    add('cylinder', bay.x, 0.22, bay.z, 0.6, 0.15, 0.6, 0, bay.yaw, 0, '#ca8a04', `Straw_${idx}`);
  });

  // Arched merchant lodging rooms on upper level (second floor balcony, ~60 shapes)
  for (let l = 0; l < 10; l++) {
    const lx = -2.8 + l * 0.62;
    // North side upper lodging rooms
    add('box', lx, 2.05, 2.6, 0.58, 0.8, 0.9, 0, 0, 0, clayColor, `RoomN_${l}`);
    add('box', lx, 1.7, 1.9, 0.6, 0.1, 0.6, 0, 0, 0, timberColor, `RoomDeck_${l}`);
    // Support posts
    add('cylinder', lx, 1.0, 1.6, 0.08, 1.5, 0.08, 0, 0, 0, timberColor, `LodgingSupport_${l}`);
  }

  // Fortified gate tower (front center)
  add('box', 0, 1.35, -3.8, 1.6, 2.5, 0.9, 0, 0, 0, darkClay, 'GateTower');
  add('box', 0, 1.0, -3.8, 0.95, 1.5, 1.1, 0, 0, 0, '#1c1917', 'GatePortal');
  return o;
}

function generateGreekAgora() {
  const o = [];
  const add = (geom, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, color = '#f1f5f9', name = 'Agora') => {
    o.push({ geometry: geom, position: { x, y, z }, scale: { x: sx, y: sy, z: sz }, rotation: { x: rx, y: ry, z: rz }, color, name });
  };
  // Long double-row colonnade walkway, merchant market stalls, tiled roof canopy (~270 shapes)
  const columnColor = '#fafaf9';
  const wallColor = '#e2e8f0';
  const roofColor = '#9a3412';

  // Base platform
  add('box', 0, 0.15, 0, 8.5, 0.3, 8.5, 0, 0, 0, '#cbd5e1', 'Foundation');

  // Double row of colonnade (40 columns total)
  // Row 1 (Outer)
  for (let z = -3.8; z <= 3.81; z += 0.44) {
    add('cylinder', -2.2, 1.3, z, 0.12, 2.2, 0.12, 0, 0, 0, columnColor, `ColOuter_${z}`);
    add('box', -2.2, 2.45, z, 0.22, 0.08, 0.22, 0, 0, 0, '#cbd5e1', `ColCapOut_${z}`);
  }
  // Row 2 (Inner)
  for (let z = -3.8; z <= 3.81; z += 0.44) {
    add('cylinder', -0.6, 1.3, z, 0.12, 2.2, 0.12, 0, 0, 0, columnColor, `ColInner_${z}`);
    add('box', -0.6, 2.45, z, 0.22, 0.08, 0.22, 0, 0, 0, '#cbd5e1', `ColCapIn_${z}`);
  }

  // Back wall enclosing the walkways
  add('box', 2.8, 1.3, 0, 0.45, 2.2, 8.0, 0, 0, 0, wallColor, 'BackWall');

  // Multi-room merchant chambers along back wall (12 chambers, ~100 blocks)
  for (let c = 0; c < 8; c++) {
    const cz = -3.15 + c * 0.9;
    // Room dividers
    add('box', 1.3, 1.2, cz, 2.6, 2.0, 0.15, 0, 0, 0, '#cbd5e1', `ChamberWall_${c}`);
    // Chamber doors/stalls
    add('box', 0.8, 0.8, cz + 0.45, 0.05, 1.4, 0.65, 0, Math.PI/2, 0, '#78350f', `ChamberCounter_${c}`);
    // Colorful fabric canopy over counter
    add('box', 0.6, 1.65, cz + 0.45, 0.85, 0.06, 0.75, 0.22, Math.PI/2, 0, c % 2 === 0 ? '#ef4444' : '#eab308', `ChamberAwning_${c}`);

    // Goods boxes on counters
    for (let g = 0; g < 4; g++) {
      const gx = cz + 0.25 + g * 0.13;
      add('box', 0.8, 0.95, gx, 0.1, 0.12, 0.1, 0, 0, 0, '#d97706', `ChamberGoods_${c}_${g}`);
    }
  }

  // Tiled roof canopy
  add('wedge', 0.3, 2.9, 0, 3.1, 0.9, 8.4, 0, Math.PI/2, 0, roofColor, 'RoofL');
  add('wedge', 0.3, 2.9, 0, 3.1, 0.9, 8.4, 0, -Math.PI/2, 0, roofColor, 'RoofR');
  return o;
}


// Prebuilt building templates — collections of primitives
export const TEMPLATES = [
  {
    id: 'empire_financial_center',
    name: 'Empire Financial Center',
    icon: '🏙️',
    category: 'commercial',
    width: 12.0,
    height: 12.0,
    objects: generateEmpireFinancialCenter(),
  },
  {
    id: 'marina_tower_hotel',
    name: 'Marina Tower Hotel',
    icon: '🏢',
    category: 'commercial',
    width: 12.0,
    height: 12.0,
    objects: generateMarinaTowerHotel(),
  },
  {
    id: 'helix_trade_center',
    name: 'Helix Trade Center',
    icon: '🧬',
    category: 'commercial',
    width: 12.0,
    height: 12.0,
    objects: generateHelixTradeCenter(),
  },
  {
    id: 'cyber_plaza_mall',
    name: 'Cyber Plaza Mall',
    icon: '🛍️',
    category: 'commercial',
    width: 12.0,
    height: 12.0,
    objects: generateCyberPlazaMall(),
  },
  {
    id: 'shibuya_neon_tower',
    name: 'Shibuya Neon Tower',
    icon: '🗼',
    category: 'commercial',
    width: 12.0,
    height: 12.0,
    objects: generateShibuyaNeonTower(),
  },
  {
    id: 'grand_city_hall',
    name: 'Grand City Hall',
    icon: '🏛️',
    category: 'civic',
    width: 12.0,
    height: 12.0,
    objects: generateGrandCityHall(),
  },
  {
    id: 'symphony_concert_hall',
    name: 'Symphony Concert Hall',
    icon: '🎵',
    category: 'civic',
    width: 12.0,
    height: 12.0,
    objects: generateSymphonyConcertHall(),
  },
  {
    id: 'imperial_museum_of_art',
    name: 'Imperial Museum of Art',
    icon: '🎨',
    category: 'civic',
    width: 12.0,
    height: 12.0,
    objects: generateImperialMuseumOfArt(),
  },
  {
    id: 'metropolitan_library',
    name: 'Metropolitan Library',
    icon: '📚',
    category: 'civic',
    width: 12.0,
    height: 12.0,
    objects: generateMetropolitanLibrary(),
  },
  {
    id: 'justice_courtyard',
    name: 'Justice Courtyard',
    icon: '⚖️',
    category: 'civic',
    width: 12.0,
    height: 12.0,
    objects: generateJusticeCourtyard(),
  },
  {
    id: 'eden_bio_dome',
    name: 'Eden Bio-Dome',
    icon: '🔮',
    category: 'green',
    width: 12.0,
    height: 12.0,
    objects: generateEdenBioDome(),
  },
  {
    id: 'vertical_forest_tower',
    name: 'Vertical Forest Tower',
    icon: '🌲',
    category: 'green',
    width: 12.0,
    height: 12.0,
    objects: generateVerticalForestTower(),
  },
  {
    id: 'solaria_oasis_plaza',
    name: 'Solaria Oasis Plaza',
    icon: '☀️',
    category: 'green',
    width: 12.0,
    height: 12.0,
    objects: generateSolariaOasisPlaza(),
  },
  {
    id: 'suspended_sky_gardens',
    name: 'Suspended Sky-Gardens',
    icon: '🌱',
    category: 'green',
    width: 12.0,
    height: 12.0,
    objects: generateSuspendedSkyGardens(),
  },
  {
    id: 'renewable_energy_eco_park',
    name: 'Renewable Energy Eco-Park',
    icon: '🔋',
    category: 'green',
    width: 12.0,
    height: 12.0,
    objects: generateRenewableEnergyEcoPark(),
  },
  {
    id: 'petrochemical_refinery',
    name: 'Petrochemical Refinery',
    icon: '🏭',
    category: 'industrial',
    width: 12.0,
    height: 12.0,
    objects: generatePetrochemicalRefinery(),
  },
  {
    id: 'tesla_mega_factory',
    name: 'Tesla Mega-Factory',
    icon: '⚡',
    category: 'industrial',
    width: 12.0,
    height: 12.0,
    objects: generateTeslaMegaFactory(),
  },
  {
    id: 'geothermal_power_plant',
    name: 'Geothermal Power Plant',
    icon: '🌋',
    category: 'industrial',
    width: 12.0,
    height: 12.0,
    objects: generateGeothermalPowerPlant(),
  },
  {
    id: 'heavy_cargo_rail_yard',
    name: 'Heavy Cargo Rail Yard',
    icon: '🚂',
    category: 'industrial',
    width: 12.0,
    height: 12.0,
    objects: generateHeavyCargoRailYard(),
  },
  {
    id: 'steel_smelting_foundry',
    name: 'Steel Smelting Foundry',
    icon: '🔥',
    category: 'industrial',
    width: 12.0,
    height: 12.0,
    objects: generateSteelSmeltingFoundry(),
  },
  {
    id: 'metro_station',
    name: 'Elevated Metro Station',
    category: 'metro',
    isMetroStation: true,
    width: 20.0,
    height: 10.0,
    objects: [
      // 1. Raised Concrete Platform Deck
      { geometry: 'box', position: {x:0, y:9.0, z:0}, scale: {x:20, y:0.4, z:9.6}, color: '#334155', name: 'PlatformDeck' },
      
      // 2. Futuristic Gullwing Shed Roof Canopy (Composite Panels + Slanted Wings)
      { geometry: 'box', position: {x:0, y:13.8, z:0}, scale: {x:20, y:0.12, z:3.8}, color: '#0f172a', name: 'RoofSpine' },
      { geometry: 'box', position: {x:0, y:13.45, z:-2.8}, scale: {x:20, y:0.08, z:3.6}, rotation: {x:-0.2, y:0, z:0}, color: '#1e293b', name: 'RoofWingLeft' },
      { geometry: 'box', position: {x:0, y:13.45, z:2.8}, scale: {x:20, y:0.08, z:3.6}, rotation: {x:0.2, y:0, z:0}, color: '#1e293b', name: 'RoofWingRight' },
      
      // 3. Glowing Neon Cyan Glass Skylight Ribbons
      { geometry: 'box', position: {x:0, y:13.7, z:-1.1}, scale: {x:20, y:0.05, z:0.8}, color: '#00f2ff', name: 'SkylightLeft' },
      { geometry: 'box', position: {x:0, y:13.7, z:1.1}, scale: {x:20, y:0.05, z:0.8}, color: '#00f2ff', name: 'SkylightRight' },
      
      // 4. Structural Steel Ring Portal Frames (Front, Center, Back)
      { geometry: 'box', position: {x:-8.0, y:11.2, z:-4.6}, scale: {x:0.35, y:4.4, z:0.35}, color: '#64748b', name: 'SteelFrameFL' },
      { geometry: 'box', position: {x:-8.0, y:11.2, z:4.6}, scale: {x:0.35, y:4.4, z:0.35}, color: '#64748b', name: 'SteelFrameFR' },
      { geometry: 'box', position: {x:-8.0, y:13.4, z:0}, scale: {x:0.35, y:0.35, z:9.25}, color: '#64748b', name: 'SteelFrameTopF' },
      
      { geometry: 'box', position: {x:0, y:11.2, z:-4.6}, scale: {x:0.35, y:4.4, z:0.35}, color: '#64748b', name: 'SteelFrameCL' },
      { geometry: 'box', position: {x:0, y:11.2, z:4.6}, scale: {x:0.35, y:4.4, z:0.35}, color: '#64748b', name: 'SteelFrameCR' },
      { geometry: 'box', position: {x:0, y:13.4, z:0}, scale: {x:0.35, y:0.35, z:9.25}, color: '#64748b', name: 'SteelFrameTopC' },
      
      { geometry: 'box', position: {x:8.0, y:11.2, z:-4.6}, scale: {x:0.35, y:4.4, z:0.35}, color: '#64748b', name: 'SteelFrameBL' },
      { geometry: 'box', position: {x:8.0, y:11.2, z:4.6}, scale: {x:0.35, y:4.4, z:0.35}, color: '#64748b', name: 'SteelFrameBR' },
      { geometry: 'box', position: {x:8.0, y:13.4, z:0}, scale: {x:0.35, y:0.35, z:9.25}, color: '#64748b', name: 'SteelFrameTopB' },
      
      // 5. Heavy concrete support pillars (ground to deck)
      { geometry: 'cylinder', position: {x:-8.0, y:4.5, z:-3.8}, scale: {x:0.9, y:9.0, z:0.9}, color: '#475569', name: 'PillarFL' },
      { geometry: 'cylinder', position: {x:-8.0, y:4.5, z:3.8}, scale: {x:0.9, y:9.0, z:0.9}, color: '#475569', name: 'PillarFR' },
      { geometry: 'cylinder', position: {x:8.0, y:4.5, z:-3.8}, scale: {x:0.9, y:9.0, z:0.9}, color: '#475569', name: 'PillarBL' },
      { geometry: 'cylinder', position: {x:8.0, y:4.5, z:3.8}, scale: {x:0.9, y:9.0, z:0.9}, color: '#475569', name: 'PillarBR' },
      
      // 6. Ground ticket hall (stays at base)
      { geometry: 'box', position: {x:0, y:2.0, z:0}, scale: {x:9.0, y:4.0, z:6.4}, color: '#1e293b', name: 'TicketHall' },
      { geometry: 'box', position: {x:0, y:2.0, z:3.22}, scale: {x:8.0, y:3.2, z:0.06}, color: '#38bdf8', name: 'GlassFacadeFront' },
      { geometry: 'box', position: {x:0, y:2.0, z:-3.22}, scale: {x:8.0, y:3.2, z:0.06}, color: '#38bdf8', name: 'GlassFacadeBack' },
      
      // 7. Escalator structural connectors (ticket hall roof y=4.0 to platform y=9.0)
      { geometry: 'box', position: {x:-4.8, y:6.5, z:1.6}, scale: {x:0.8, y:5.0, z:1.8}, color: '#64748b', name: 'EscalatorLeft' },
      { geometry: 'box', position: {x:4.8, y:6.5, z:1.6}, scale: {x:0.8, y:5.0, z:1.8}, color: '#64748b', name: 'EscalatorRight' },
      
      // 8. Glowing neon orange warnings and cyan display signs
      { geometry: 'box', position: {x:0, y:9.22, z:-2.6}, scale: {x:19.8, y:0.05, z:0.3}, color: '#f97316', name: 'WarningStripeLeft' },
      { geometry: 'box', position: {x:0, y:9.22, z:2.6}, scale: {x:19.8, y:0.05, z:0.3}, color: '#f97316', name: 'WarningStripeRight' },
      { geometry: 'box', position: {x:-4.0, y:12.2, z:0}, scale: {x:1.8, y:0.65, z:0.12}, color: '#00f2ff', name: 'InfoScreenLeft' },
      { geometry: 'box', position: {x:4.0, y:12.2, z:0}, scale: {x:1.8, y:0.65, z:0.12}, color: '#00f2ff', name: 'InfoScreenRight' },
    ],
  },
  {
    id: 'neo_arcology',
    name: 'Neo-Arcology Complex',
    icon: '🏙️',
    category: 'residential',
    width: 8.0,
    height: 8.0,
    objects: generateFuturisticArcology(),
  },
  {
    id: 'cyber_habitation_dome',
    name: 'Cyber-Habitation Dome',
    icon: '🔮',
    category: 'residential',
    width: 10.0,
    height: 10.0,
    objects: generateCyberHabitationDome(),
  },
  {
    id: 'zenith_residential_tower',
    name: 'Zenith Residential Tower Complex',
    icon: '🏢',
    category: 'residential',
    width: 12.0,
    height: 12.0,
    objects: generateZenithTower(),
  },
  {
    id: 'marina_bay_habitats',
    name: 'Marina Bay Habitats',
    icon: '🏙️',
    category: 'residential',
    width: 12.0,
    height: 12.0,
    objects: generateMarinaBayHabitats(),
  },
  {
    id: 'elysium_skyline_society',
    name: 'Elysium Skyline Society',
    icon: '🏰',
    category: 'residential',
    width: 12.0,
    height: 12.0,
    objects: generateElysiumSociety(),
  },
  {
    id: 'solaria_green_arcology',
    name: 'Solaria Green Arcology',
    icon: '🌿',
    category: 'residential',
    width: 12.0,
    height: 12.0,
    objects: generateSolariaArcology(),
  },
  {
    id: 'hyper_block_condos',
    name: 'Hyper-Block Condominiums',
    icon: '🏫',
    category: 'residential',
    width: 12.0,
    height: 12.0,
    objects: generateHyperBlockCondos(),
  },
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
  {
    id: 'cathedral',
    name: 'Gothic Cathedral',
    icon: '⛪',
    category: 'civic',
    width: 4.5,
    height: 6.0,
    objects: makeCathedral(),
  },
  {
    id: 'megamall',
    name: 'Mega Mall',
    icon: '🛍️',
    category: 'commercial',
    width: 6.0,
    height: 6.0,
    objects: makeMegamall(),
  },
  {
    id: 'techhq',
    name: 'Tech HQ',
    icon: '🏢',
    category: 'commercial',
    width: 5.0,
    height: 5.0,
    objects: makeTechHQ(),
  },
  {
    id: 'resort',
    name: 'Luxury Resort',
    icon: '🏨',
    category: 'residential',
    width: 6.0,
    height: 5.0,
    objects: makeResort(),
  },
  {
    id: 'nuclear',
    name: 'Nuclear Plant',
    icon: '⚛️',
    category: 'industrial',
    width: 5.5,
    height: 5.5,
    objects: makeNuclear(),
  },
  {
    id: 'skygarden',
    name: 'Sky Garden Tower',
    icon: '🏙️',
    category: 'residential',
    width: 4.0,
    height: 4.0,
    objects: makeSkyGarden(),
  },
  {
    id: 'cargoport',
    name: 'Cargo Port',
    icon: '⚓',
    category: 'industrial',
    width: 6.0,
    height: 4.5,
    objects: makeCargoPort(),
  },
  {
    id: 'university',
    name: 'Grand University',
    icon: '🎓',
    category: 'civic',
    width: 5.5,
    height: 5.5,
    objects: makeUniversity(),
  },
  {
    id: 'ecodome',
    name: 'Eco-Dome Biosphere',
    icon: '🌴',
    category: 'green',
    width: 5.0,
    height: 5.0,
    objects: makeEcoDome(),
  },
  {
    id: 'hyperloop',
    name: 'Hyperloop Hub',
    icon: '🚀',
    category: 'civic',
    width: 6.0,
    height: 3.5,
    objects: makeHyperloop(),
  },
  {
    id: 'tree_goldenoak',
    name: 'Giant Golden Oak',
    icon: '🌳',
    category: 'green',
    width: 2.0,
    height: 2.0,
    objects: makeGiantGoldenOak(),
  },
  {
    id: 'tree_banyan',
    name: 'Ancient Grand Banyan',
    icon: '🌳',
    category: 'green',
    width: 2.5,
    height: 2.5,
    objects: makeAncientGrandBanyan(),
  },
  {
    id: 'tree_pine',
    name: 'Pine Tree',
    icon: '🌲',
    category: 'green',
    width: 1.5,
    height: 1.5,
    objects: makePineTree(),
  },
  {
    id: 'tree_birch',
    name: 'Birch Tree',
    icon: '🌳',
    category: 'green',
    width: 1.5,
    height: 1.5,
    objects: makeBirchTree(),
  },
  {
    id: 'tree_maple',
    name: 'Maple Tree',
    icon: '🍁',
    category: 'green',
    width: 1.5,
    height: 1.5,
    objects: makeMapleTree(),
  },
  {
    id: 'tree_cherry',
    name: 'Cherry Blossom Tree',
    icon: '🌸',
    category: 'green',
    width: 1.5,
    height: 1.5,
    objects: makeCherryTree(),
  },
  {
    id: 'tree_palm',
    name: 'Palm Tree',
    icon: '🌴',
    category: 'green',
    width: 1.5,
    height: 1.5,
    objects: makePalmTree(),
  },
  {
    id: 'tree_cypress',
    name: 'Cypress Tree',
    icon: '🌲',
    category: 'green',
    width: 1.5,
    height: 1.5,
    objects: makeCypressTree(),
  },
  {
    id: 'tree_willow',
    name: 'Willow Tree',
    icon: '🌿',
    category: 'green',
    width: 1.5,
    height: 1.5,
    objects: makeWillowTree(),
  },
  {
    id: 'babylon_hanging_gardens',
    name: 'Hanging Gardens of Babylon',
    icon: '🏛️',
    category: 'residential',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generateHangingGardens(),
  },
  {
    id: 'roman_insula_tenement',
    name: 'Roman Insula Tenement',
    icon: '🏢',
    category: 'residential',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generateRomanInsula(),
  },
  {
    id: 'japanese_samurai_estate',
    name: 'Japanese Samurai Estate',
    icon: '🏯',
    category: 'residential',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generateSamuraiEstate(),
  },
  {
    id: 'pueblo_cliff_dwelling',
    name: 'Pueblo Cliff Dwelling',
    icon: '🛖',
    category: 'residential',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generatePuebloDwelling(),
  },
  {
    id: 'chinese_siheyuan_courtyard',
    name: 'Chinese Siheyuan Courtyard',
    icon: '🏡',
    category: 'residential',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generateChineseSiheyuan(),
  },
  {
    id: 'roman_colosseum',
    name: 'Roman Colosseum',
    icon: '🏛️',
    category: 'civic',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generateRomanColosseum(),
  },
  {
    id: 'parthenon_temple',
    name: 'Parthenon Temple',
    icon: '🏛️',
    category: 'civic',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generateParthenon(),
  },
  {
    id: 'great_pyramid_giza',
    name: 'Great Pyramid of Giza',
    icon: '🔺',
    category: 'civic',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generatePyramidGiza(),
  },
  {
    id: 'stonehenge_monolith_circle',
    name: 'Stonehenge Monolith Circle',
    icon: '🪨',
    category: 'civic',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generateStonehenge(),
  },
  {
    id: 'mayan_temple_kukulkan',
    name: 'Mayan Temple of Kukulkan',
    icon: '🛕',
    category: 'civic',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generateMayanTemple(),
  },
  {
    id: 'great_bazaar_istanbul',
    name: 'Great Bazaar of Istanbul',
    icon: '🛍️',
    category: 'commercial',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generateGreatBazaar(),
  },
  {
    id: 'roman_forum_market',
    name: 'Roman Forum Market',
    icon: '🏛️',
    category: 'commercial',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generateRomanForum(),
  },
  {
    id: 'medieval_port_custom_house',
    name: 'Medieval Port Custom House',
    icon: '⚓',
    category: 'commercial',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generateMedievalCustomHouse(),
  },
  {
    id: 'silk_road_caravanserai',
    name: 'Silk Road Caravanserai',
    icon: '🏰',
    category: 'commercial',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generateSilkRoadCaravanserai(),
  },
  {
    id: 'greek_agora_market_stoa',
    name: 'Greek Agora Market Stoa',
    icon: '🏛️',
    category: 'commercial',
    width: 6.0,
    height: 6.0,
    isHistorical: true,
    objects: generateGreekAgora(),
  },
  {
    id: 'observatory',
    name: 'Space Observatory',
    icon: '🔭',
    category: 'civic',
    width: 3.5,
    height: 3.5,
    objects: [
      { geometry: 'box',      position: {x:0,y:0.4,z:0},   scale: {x:3.0,y:0.8,z:3.0},   rotation: {x:0,y:0,z:0}, color: '#556677', name: 'Obs_Base' },
      { geometry: 'sphere',   position: {x:0,y:1.0,z:0},   scale: {x:2.2,y:1.8,z:2.2},   rotation: {x:0,y:0,z:0}, color: '#e2e8f0', name: 'Obs_Dome' },
      { geometry: 'cylinder', position: {x:0,y:1.2,z:0.5}, scale: {x:0.3,y:1.2,z:0.3},   rotation: {x:Math.PI/6,y:0,z:0}, color: '#1a202c', name: 'Obs_Telescope' },
    ],
  },
  {
    id: 'lighthouse',
    name: 'Coastal Lighthouse',
    icon: '🚨',
    category: 'civic',
    width: 2.5,
    height: 2.5,
    objects: [
      { geometry: 'cylinder', position: {x:0,y:1.5,z:0},   scale: {x:1.2,y:3.0,z:1.2},   rotation: {x:0,y:0,z:0}, color: '#e53e3e', name: 'Light_Tower' },
      { geometry: 'torus',    position: {x:0,y:3.0,z:0},   scale: {x:1.5,y:1.5,z:0.15},  rotation: {x:Math.PI/2,y:0,z:0}, color: '#2d3748', name: 'Light_Gallery' },
      { geometry: 'cylinder', position: {x:0,y:3.4,z:0},   scale: {x:0.8,y:0.8,z:0.8},   rotation: {x:0,y:0,z:0}, color: '#ecc94b', name: 'Light_Lantern' },
      { geometry: 'cone',     position: {x:0,y:3.95,z:0},  scale: {x:0.9,y:0.4,z:0.9},   rotation: {x:0,y:0,z:0}, color: '#1a202c', name: 'Light_Roof' },
    ],
  },
  {
    id: 'windmill_trad',
    name: 'Traditional Windmill',
    icon: '🌾',
    category: 'industrial',
    width: 2.5,
    height: 2.5,
    objects: [
      { geometry: 'cylinder', position: {x:0,y:1.5,z:0},   scale: {x:1.4,y:3.0,z:1.4},   rotation: {x:0,y:0,z:0}, color: '#8a5a3a', name: 'Wind_Tower' },
      { geometry: 'sphere',   position: {x:0,y:3.0,z:0},   scale: {x:1.5,y:1.2,z:1.5},   rotation: {x:0,y:0,z:0}, color: '#4a2f1b', name: 'Wind_Cap' },
      { geometry: 'cylinder', position: {x:0,y:3.0,z:0.7}, scale: {x:0.25,y:0.4,z:0.25}, rotation: {x:Math.PI/2,y:0,z:0}, color: '#d69e2e', name: 'Wind_Nose' },
      { geometry: 'box',      position: {x:0,y:3.6,z:0.8}, scale: {x:0.2,y:1.5,z:0.05},  rotation: {x:0,y:0,z:0}, color: '#eceff4', name: 'Wind_Sail1' },
      { geometry: 'box',      position: {x:0,y:2.4,z:0.8}, scale: {x:0.2,y:1.5,z:0.05},  rotation: {x:0,y:0,z:0}, color: '#eceff4', name: 'Wind_Sail2' },
      { geometry: 'box',      position: {x:0.6,y:3.0,z:0.8}, scale: {x:1.5,y:0.2,z:0.05}, rotation: {x:0,y:0,z:0}, color: '#eceff4', name: 'Wind_Sail3' },
      { geometry: 'box',      position: {x:-0.6,y:3.0,z:0.8}, scale: {x:1.5,y:0.2,z:0.05}, rotation: {x:0,y:0,z:0}, color: '#eceff4', name: 'Wind_Sail4' },
    ],
  },
  {
    id: 'stadium',
    name: 'Sports Stadium',
    icon: '🏟️',
    category: 'commercial',
    width: 5.0,
    height: 5.0,
    objects: [
      { geometry: 'cylinder', position: {x:0,y:0.4,z:0},   scale: {x:4.8,y:0.8,z:4.8},   rotation: {x:0,y:0,z:0}, color: '#718096', name: 'Stad_Walls' },
      { geometry: 'torus',    position: {x:0,y:0.9,z:0},   scale: {x:4.4,y:4.4,z:0.8},   rotation: {x:Math.PI/2,y:0,z:0}, color: '#3182ce', name: 'Stad_Seating' },
      { geometry: 'cylinder', position: {x:0,y:0.45,z:0},  scale: {x:3.0,y:0.1,z:3.0},   rotation: {x:0,y:0,z:0}, color: '#48bb78', name: 'Stad_Field' },
      { geometry: 'cylinder', position: {x:-2.2,y:1.2,z:-2.2}, scale: {x:0.1,y:2.4,z:0.1}, rotation: {x:0,y:0,z:0}, color: '#a0aec0', name: 'Stad_Light1' },
      { geometry: 'box',      position: {x:-2.2,y:2.4,z:-2.2}, scale: {x:0.5,y:0.3,z:0.2}, rotation: {x:0,y:0,z:0}, color: '#ffffff', name: 'Stad_Lamp1' },
      { geometry: 'cylinder', position: {x:2.2,y:1.2,z:2.2}, scale: {x:0.1,y:2.4,z:0.1}, rotation: {x:0,y:0,z:0}, color: '#a0aec0', name: 'Stad_Light2' },
      { geometry: 'box',      position: {x:2.2,y:2.4,z:2.2}, scale: {x:0.5,y:0.3,z:0.2}, rotation: {x:0,y:0,z:0}, color: '#ffffff', name: 'Stad_Lamp2' },
    ],
  },
  {
    id: 'museum',
    name: 'Modern Art Museum',
    icon: '🏛️',
    category: 'civic',
    width: 4.5,
    height: 4.5,
    objects: [
      { geometry: 'cone',     position: {x:0,y:1.0,z:0},   scale: {x:3.0,y:2.0,z:3.0},   rotation: {x:0,y:0,z:0}, color: '#319795', name: 'Mus_Pyramid' },
      { geometry: 'box',      position: {x:1.5,y:0.8,z:0}, scale: {x:2.0,y:1.6,z:2.0},   rotation: {x:0,y:Math.PI/6,z:Math.PI/12}, color: '#a0aec0', name: 'Mus_Wing1' },
      { geometry: 'cylinder', position: {x:-1.5,y:0.6,z:0}, scale: {x:2.2,y:1.2,z:2.2},   rotation: {x:0,y:0,z:0}, color: '#edf2f7', name: 'Mus_Wing2' },
    ],
  },
  {
    id: 'aquarium',
    name: 'Ocean Aquarium',
    icon: '🐟',
    category: 'commercial',
    width: 4.0,
    height: 4.0,
    objects: [
      { geometry: 'wedge',    position: {x:0,y:0.8,z:0},   scale: {x:3.0,y:1.6,z:2.5},   rotation: {x:0,y:Math.PI/4,z:0}, color: '#3182ce', name: 'Aqua_Wave' },
      { geometry: 'torus',    position: {x:0,y:0.4,z:0},   scale: {x:2.0,y:2.0,z:0.4},   rotation: {x:0,y:Math.PI/2,z:0}, color: '#cbd5e0', name: 'Aqua_Tunnel' },
      { geometry: 'box',      position: {x:0,y:0.5,z:1.2}, scale: {x:1.5,y:1.0,z:1.0},   rotation: {x:0,y:0,z:0}, color: '#2d3748', name: 'Aqua_Entry' },
    ],
  },
  {
    id: 'castle_tower',
    name: 'Castle Watchtower',
    icon: '🏰',
    category: 'civic',
    width: 3.0,
    height: 3.0,
    objects: [
      { geometry: 'cylinder', position: {x:0,y:1.8,z:0},   scale: {x:1.8,y:3.6,z:1.8},   rotation: {x:0,y:0,z:0}, color: '#718096', name: 'Castle_Base' },
      { geometry: 'box',      position: {x:0,y:3.7,z:0},   scale: {x:2.0,y:0.3,z:2.0},   rotation: {x:0,y:0,z:0}, color: '#4a5568', name: 'Castle_Top' },
      { geometry: 'cylinder', position: {x:0,y:4.2,z:0},   scale: {x:0.08,y:1.0,z:0.08}, rotation: {x:0,y:0,z:0}, color: '#744210', name: 'Castle_Pole' },
      { geometry: 'box',      position: {x:0.3,y:4.5,z:0}, scale: {x:0.6,y:0.3,z:0.05},  rotation: {x:0,y:0,z:0}, color: '#e53e3e', name: 'Castle_Flag' },
    ],
  },
  {
    id: 'hotel_preset',
    name: 'Luxury Hotel',
    icon: '🏨',
    category: 'residential',
    width: 4.5,
    height: 4.0,
    objects: [
      { geometry: 'box', position: {x:0,y:1.5,z:0},     scale: {x:3.0,y:3.0,z:2.0},  rotation: {x:0,y:0,z:0}, color: '#dd6b20', name: 'Hotel_Body' },
      { geometry: 'box', position: {x:-0.5,y:3.05,z:0}, scale: {x:1.5,y:0.1,z:1.2},  rotation: {x:0,y:0,z:0}, color: '#3182ce', name: 'Hotel_Pool' },
      { geometry: 'box', position: {x:0.8,y:3.5,z:0},   scale: {x:1.0,y:1.0,z:1.4},  rotation: {x:0,y:0,z:0}, color: '#2d3748', name: 'Hotel_Pent' },
      { geometry: 'box', position: {x:0,y:1.0,z:1.02},  scale: {x:2.2,y:0.15,z:0.1}, rotation: {x:0,y:0,z:0}, color: '#edf2f7', name: 'Hotel_Balcony1' },
      { geometry: 'box', position: {x:0,y:2.0,z:1.02},  scale: {x:2.2,y:0.15,z:0.1}, rotation: {x:0,y:0,z:0}, color: '#edf2f7', name: 'Hotel_Balcony2' },
    ],
  },
  {
    id: 'biodome_mars',
    name: 'Mars Bio-Dome',
    icon: '👨‍🚀',
    category: 'green',
    width: 5.0,
    height: 5.0,
    objects: [
      { geometry: 'cylinder', position: {x:0,y:0.05,z:0},  scale: {x:4.6,y:0.1,z:4.6},   rotation: {x:0,y:0,z:0}, color: '#c05621', name: 'Mars_Base' },
      { geometry: 'sphere',   position: {x:0,y:0.8,z:0},   scale: {x:3.2,y:1.6,z:3.2},   rotation: {x:0,y:0,z:0}, color: '#63b3ed', name: 'Mars_Dome' },
      { geometry: 'box',      position: {x:1.5,y:0.3,z:0}, scale: {x:1.2,y:0.6,z:0.6},   rotation: {x:0,y:0,z:0}, color: '#edf2f7', name: 'Mars_Corridor' },
      { geometry: 'sphere',   position: {x:2.2,y:0.4,z:0},   scale: {x:0.8,y:0.8,z:0.8},   rotation: {x:0,y:0,z:0}, color: '#edf2f7', name: 'Mars_Airlock' },
    ],
  },
  {
    id: 'shrine_pagoda',
    name: 'Pagoda Shrine',
    icon: '⛩️',
    category: 'civic',
    width: 4.0,
    height: 4.0,
    objects: [
      { geometry: 'box',      position: {x:0,y:0.2,z:0},   scale: {x:3.6,y:0.4,z:3.6},   rotation: {x:0,y:0,z:0}, color: '#2d3748', name: 'Pagoda_Platform' },
      { geometry: 'box',      position: {x:0,y:0.8,z:0},   scale: {x:2.6,y:0.8,z:2.6},   rotation: {x:0,y:0,z:0}, color: '#e53e3e', name: 'Pagoda_Wall1' },
      { geometry: 'wedge',    position: {x:0,y:1.4,z:0},   scale: {x:3.0,y:0.4,z:3.0},   rotation: {x:0,y:0,z:0}, color: '#319795', name: 'Pagoda_Roof1' },
      { geometry: 'box',      position: {x:0,y:1.8,z:0},   scale: {x:1.8,y:0.6,z:1.8},   rotation: {x:0,y:0,z:0}, color: '#e53e3e', name: 'Pagoda_Wall2' },
      { geometry: 'wedge',    position: {x:0,y:2.3,z:0},   scale: {x:2.2,y:0.4,z:2.2},   rotation: {x:0,y:0,z:0}, color: '#319795', name: 'Pagoda_Roof2' },
      { geometry: 'cylinder', position: {x:0,y:2.9,z:0},   scale: {x:0.15,y:0.8,z:0.15}, rotation: {x:0,y:0,z:0}, color: '#ecc94b', name: 'Pagoda_Spire' },
    ],
  },
  {
    id: 'ferris_wheel',
    name: 'Amusement Ferris Wheel',
    icon: '🎡',
    category: 'commercial',
    width: 4.5,
    height: 4.5,
    objects: [
      { geometry: 'cylinder', position: {x:0.4,y:1.5,z:0}, scale: {x:0.12,y:3.0,z:0.12}, rotation: {x:0,y:0,z:Math.PI/12}, color: '#718096', name: 'Wheel_StandL' },
      { geometry: 'cylinder', position: {x:-0.4,y:1.5,z:0}, scale: {x:0.12,y:3.0,z:0.12}, rotation: {x:0,y:0,z:-Math.PI/12}, color: '#718096', name: 'Wheel_StandR' },
      { geometry: 'torus',    position: {x:0,y:3.0,z:0},   scale: {x:2.8,y:2.8,z:0.15},  rotation: {x:0,y:0,z:0}, color: '#edf2f7', name: 'Wheel_Rim' },
      { geometry: 'cylinder', position: {x:0,y:3.0,z:0},   scale: {x:0.3,y:0.3,z:0.4},   rotation: {x:Math.PI/2,y:0,z:0}, color: '#cbd5e0', name: 'Wheel_Axle' },
      { geometry: 'sphere',   position: {x:0,y:4.4,z:0.1}, scale: {x:0.3,y:0.3,z:0.3},   color: '#e53e3e', name: 'Wheel_CabinRed' },
      { geometry: 'sphere',   position: {x:0,y:1.6,z:0.1}, scale: {x:0.3,y:0.3,z:0.3},   color: '#ecc94b', name: 'Wheel_CabinYellow' },
      { geometry: 'sphere',   position: {x:1.4,y:3.0,z:0.1}, scale: {x:0.3,y:0.3,z:0.3},   color: '#48bb78', name: 'Wheel_CabinGreen' },
      { geometry: 'sphere',   position: {x:-1.4,y:3.0,z:0.1}, scale: {x:0.3,y:0.3,z:0.3},   color: '#3182ce', name: 'Wheel_CabinBlue' },
    ],
  },
  {
    id: 'cottage_preset',
    name: 'Thatch Cottage',
    icon: '🏡',
    category: 'residential',
    width: 2.5,
    height: 2.5,
    objects: [
      { geometry: 'box',   position: {x:0,y:0.45,z:0},   scale: {x:2.2,y:0.9,z:1.6},  rotation: {x:0,y:0,z:0}, color: '#f7fafc', name: 'Cot_Walls' },
      { geometry: 'wedge', position: {x:0,y:1.1,z:0},    scale: {x:2.4,y:0.6,z:1.8},  rotation: {x:0,y:0,z:0}, color: '#b7791f', name: 'Cot_Roof' },
      { geometry: 'box',   position: {x:0,y:0.3,z:0.81}, scale: {x:0.4,y:0.6,z:0.05}, rotation: {x:0,y:0,z:0}, color: '#744210', name: 'Cot_Door' },
      { geometry: 'cylinder', position: {x:-0.8,y:1.0,z:0}, scale: {x:0.2,y:0.8,z:0.2}, rotation: {x:0,y:0,z:0}, color: '#718096', name: 'Cot_Chimney' },
    ],
  },
  {
    id: 'tree_redwood',
    name: 'Giant Redwood Tree',
    icon: '🌲',
    category: 'green',
    width: 1.5,
    height: 1.5,
    objects: [
      { geometry: 'cylinder', position: {x:0,y:1.5,z:0},   scale: {x:0.35,y:3.0,z:0.35}, rotation: {x:0,y:0,z:0}, color: '#5a2010', name: 'Red_Trunk' },
      { geometry: 'cone',     position: {x:0,y:2.5,z:0},   scale: {x:1.6,y:1.2,z:1.6},   rotation: {x:0,y:0,z:0}, color: '#22543d', name: 'Red_Leaves1' },
      { geometry: 'cone',     position: {x:0,y:3.4,z:0},   scale: {x:1.2,y:1.0,z:1.2},   rotation: {x:0,y:0,z:0}, color: '#22543d', name: 'Red_Leaves2' },
      { geometry: 'cone',     position: {x:0,y:4.1,z:0},   scale: {x:0.8,y:0.8,z:0.8},   rotation: {x:0,y:0,z:0}, color: '#22543d', name: 'Red_Leaves3' },
    ],
  },
  {
    id: 'tree_cactus',
    name: 'Desert Saguaro Cactus',
    icon: '🌵',
    category: 'green',
    width: 1.5,
    height: 1.5,
    objects: [
      { geometry: 'cylinder', position: {x:0,y:1.0,z:0},   scale: {x:0.22,y:2.0,z:0.22}, rotation: {x:0,y:0,z:0}, color: '#2f855a', name: 'Cac_Stem' },
      { geometry: 'torus',    position: {x:-0.4,y:1.2,z:0}, scale: {x:0.5,y:0.5,z:0.18},  rotation: {x:0,y:Math.PI/2,z:0}, color: '#2f855a', name: 'Cac_ArmL' },
      { geometry: 'torus',    position: {x:0.4,y:1.5,z:0},  scale: {x:0.5,y:0.5,z:0.18},  rotation: {x:0,y:Math.PI/2,z:0}, color: '#2f855a', name: 'Cac_ArmR' },
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
