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

// Prebuilt building templates — collections of primitives
export const TEMPLATES = [
  {
    id: 'metro_station',
    name: 'Metro Station',
    category: 'metro',
    isMetroStation: true,
    width: 6.0,
    height: 3.0,
    objects: [
      { geometry: 'box', position: {x:0, y:0.1, z:0}, scale: {x:6, y:0.2, z:3}, color: '#334155', name: 'Platform' },
      { geometry: 'box', position: {x:0, y:0.8, z:-1.35}, scale: {x:5.8, y:1.4, z:0.2}, color: '#475569', name: 'BackWall' },
      { geometry: 'box', position: {x:0, y:1.6, z:0}, scale: {x:6, y:0.1, z:3}, color: '#0f172a', name: 'Roof' },
      { geometry: 'cylinder', position: {x:-2.8, y:0.8, z:1.3}, scale: {x:0.15, y:1.4, z:0.15}, color: '#94a3b8', name: 'PillarLeft' },
      { geometry: 'cylinder', position: {x:2.8, y:0.8, z:1.3}, scale: {x:0.15, y:1.4, z:0.15}, color: '#94a3b8', name: 'PillarRight' },
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
    id: 'tree_oak',
    name: 'Oak Tree',
    icon: '🌳',
    category: 'green',
    width: 1.5,
    height: 1.5,
    objects: makeOakTree(),
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
    id: 'tree_baobab',
    name: 'Baobab Tree',
    icon: '🌳',
    category: 'green',
    width: 1.5,
    height: 1.5,
    objects: makeBaobabTree(),
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
