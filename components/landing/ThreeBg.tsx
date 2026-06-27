"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function ThreeBg() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    
    // Perspective camera with wide view
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Create a glowing particle texture dynamically
    const createParticleTexture = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Draw glowing radial gradient
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
      gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);

      return new THREE.CanvasTexture(canvas);
    };

    const particleTexture = createParticleTexture();

    // 3. Generate Particles
    const particleCount = 120;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Custom speeds and random offsets for wave animation
    const randomOffsets = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);

    // Brand Colors: Magenta (#d9277a), Violet (#7b61ff), Light Blue/Teal (#0e9488)
    const colorChoices = [
      new THREE.Color("#d9277a"), // Magenta
      new THREE.Color("#7b61ff"), // Violet
      new THREE.Color("#0e9488"), // Teal
      new THREE.Color("#e7e2da"), // Cream/Soft Gray
    ];

    for (let i = 0; i < particleCount; i++) {
      // Spread particles in a wide 3D space
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      // Assign random brand color
      const chosenColor = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      colors[i * 3] = chosenColor.r;
      colors[i * 3 + 1] = chosenColor.g;
      colors[i * 3 + 2] = chosenColor.b;

      // Particle sizes
      sizes[i] = 1.0 + Math.random() * 2.5;

      // Dynamic variables
      randomOffsets[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.1 + Math.random() * 0.4;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Points Material using our custom texture
    const material = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      map: particleTexture || undefined,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // 4. Mouse movement interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      // Normalize mouse positions
      mouseX = (event.clientX / window.innerWidth - 0.5) * 8;
      mouseY = (event.clientY / window.innerHeight - 0.5) * 8;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // 5. Animation Loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse inertia (easing)
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      // Rotate particle group gently based on mouse position
      particles.rotation.y = elapsedTime * 0.03 + targetX * 0.1;
      particles.rotation.x = elapsedTime * 0.015 - targetY * 0.1;

      // Animate individual particles (make them wave/float)
      const positionAttr = geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        const yOffset = Math.sin(elapsedTime * speeds[i] + randomOffsets[i]) * 0.015;
        const xOffset = Math.cos(elapsedTime * (speeds[i] * 0.8) + randomOffsets[i]) * 0.012;
        
        positionAttr.setY(i, positionAttr.getY(i) + yOffset);
        positionAttr.setX(i, positionAttr.getX(i) + xOffset);
      }
      positionAttr.needsUpdate = true;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // 6. Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);
  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 -z-30 pointer-events-none overflow-hidden opacity-[0.55]" 
      style={{ mixBlendMode: "multiply" }} 
    />
  );
}
