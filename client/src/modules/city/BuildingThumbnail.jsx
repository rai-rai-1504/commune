import React, { useEffect, useRef } from 'react';

export default function BuildingThumbnail({ asset }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (!asset.objects || asset.objects.length === 0) {
      // Fallback to a clean blueprint icon if no 3D sub-objects are defined
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(W / 4, H / 4, W / 2, H / 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.fillRect(W / 4, H / 4, W / 2, H / 2);
      return;
    }

    // 2D orthographic projection of 3D objects looking from Z+ towards Z-
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    asset.objects.forEach(obj => {
      const px = obj.position?.x !== undefined ? obj.position.x : 0;
      const py = obj.position?.y !== undefined ? obj.position.y : 0;
      const sx = obj.scale?.x !== undefined ? obj.scale.x : 1;
      const sy = obj.scale?.y !== undefined ? obj.scale.y : 1;

      const halfX = sx / 2;
      const halfY = sy / 2;

      if (px - halfX < minX) minX = px - halfX;
      if (px + halfX > maxX) maxX = px + halfX;
      if (py - halfY < minY) minY = py - halfY;
      if (py + halfY > maxY) maxY = py + halfY;
    });

    if (minX === Infinity) { minX = -1; maxX = 1; }
    if (minY === Infinity) { minY = -0.1; maxY = 1.5; }

    // Make sure ground level is in view
    if (minY > 0) minY = 0;

    const width3d = maxX - minX;
    const height3d = maxY - minY;
    
    const padding = 5;
    const scaleX = (W - padding * 2) / (width3d || 1);
    const scaleY = (H - padding * 2) / (height3d || 1);
    const scale = Math.min(scaleX, scaleY, 20); // Keep reasonable scale

    const centerX = W / 2 - ((minX + maxX) / 2) * scale;
    const centerY = H - padding; // anchor ground level at bottom padding

    // Sort objects by their Z coordinate so we render back-to-front
    const sortedObjects = [...asset.objects].sort((a, b) => {
      const az = a.position?.z !== undefined ? a.position.z : 0;
      const bz = b.position?.z !== undefined ? b.position.z : 0;
      return az - bz;
    });

    sortedObjects.forEach(obj => {
      const px = obj.position?.x !== undefined ? obj.position.x : 0;
      const py = obj.position?.y !== undefined ? obj.position.y : 0;
      const sx = obj.scale?.x !== undefined ? obj.scale.x : 1;
      const sy = obj.scale?.y !== undefined ? obj.scale.y : 1;

      const screenX = centerX + px * scale;
      const screenY = centerY - py * scale; // Invert Y axis
      const sw = sx * scale;
      const sh = sy * scale;

      ctx.save();
      ctx.fillStyle = obj.color || asset.color || '#4ECDC4';
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.lineWidth = 1;

      if (obj.geometry === 'box') {
        ctx.beginPath();
        ctx.rect(screenX - sw / 2, screenY - sh / 2, sw, sh);
        ctx.fill();
        ctx.stroke();
      } else if (obj.geometry === 'cylinder') {
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(screenX - sw / 2, screenY - sh / 2, sw, sh, Math.min(sw / 2, sh / 2, 4));
        } else {
          ctx.rect(screenX - sw / 2, screenY - sh / 2, sw, sh);
        }
        ctx.fill();
        ctx.stroke();
      } else if (obj.geometry === 'sphere') {
        ctx.beginPath();
        ctx.arc(screenX, screenY, Math.min(sw, sh) / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });
  }, [asset]);

  return (
    <canvas 
      ref={canvasRef} 
      width={60} 
      height={40} 
      style={{ 
        borderRadius: 6, 
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.2)'
      }} 
    />
  );
}
