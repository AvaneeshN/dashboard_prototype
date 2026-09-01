'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Interactive3DSceneProps {
  variant?: 'auth' | 'admin' | 'client';
  className?: string;
}

export const Interactive3DScene: React.FC<Interactive3DSceneProps> = ({ variant = 'auth', className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    currentMount.appendChild(renderer.domElement);

    // Group for mouse interaction
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // Color palettes (CRED-like metallic obsidian & neon accents)
    const primaryColor = variant === 'admin' ? 0x818cf8 : variant === 'client' ? 0x06b6d4 : 0xa855f7;
    const emissiveColor = variant === 'admin' ? 0x1e1b4b : variant === 'client' ? 0x083344 : 0x2e1065;
    const accentColor = variant === 'admin' ? 0xc084fc : variant === 'client' ? 0x38bdf8 : 0xec4899;

    // 1. Central Complex Geometric Core (Torus Knot + Icosahedron Core)
    const knotGeo = new THREE.TorusKnotGeometry(variant === 'auth' ? 3.8 : 3.2, 0.9, 128, 32, 2, 3);
    const knotMat = new THREE.MeshPhysicalMaterial({
      color: primaryColor,
      emissive: emissiveColor,
      roughness: 0.12,
      metalness: 0.92,
      clearcoat: 1.0,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
      transparent: true,
      opacity: 0.85
    });
    const knotMesh = new THREE.Mesh(knotGeo, knotMat);
    mainGroup.add(knotMesh);

    // 2. Outer Faceted Holographic Cage
    const cageGeo = new THREE.IcosahedronGeometry(variant === 'auth' ? 6.2 : 5.4, 2);
    const cageMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      wireframe: true,
      transparent: true,
      opacity: 0.22
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    mainGroup.add(cageMesh);

    // 3. Orbital Concentric Rings
    const ring1Geo = new THREE.TorusGeometry(8.2, 0.03, 16, 120);
    const ring1Mat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.4
    });
    const ring1Mesh = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1Mesh.rotation.x = Math.PI / 2.8;
    mainGroup.add(ring1Mesh);

    const ring2Geo = new THREE.TorusGeometry(7.0, 0.025, 16, 120);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25
    });
    const ring2Mesh = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2Mesh.rotation.y = Math.PI / 3.2;
    mainGroup.add(ring2Mesh);

    // 4. Stardust Particle System
    const particlesCount = 450;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 45;
      posArray[i + 1] = (Math.random() - 0.5) * 45;
      posArray[i + 2] = (Math.random() - 0.5) * 35;
    }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.09,
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    // Dynamic Multi-Point Lighting
    const ambientLight = new THREE.AmbientLight(0x0f172a, 1.5);
    scene.add(ambientLight);

    const light1 = new THREE.PointLight(primaryColor, 4, 60);
    light1.position.set(12, 12, 12);
    scene.add(light1);

    const light2 = new THREE.PointLight(accentColor, 3, 60);
    light2.position.set(-12, -10, 10);
    scene.add(light2);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.2);
    rimLight.position.set(0, 20, -10);
    scene.add(rimLight);

    // Mouse Tracking with smooth spring damping
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;
      mouseX = (event.clientX - windowHalfX) * 0.0007;
      mouseY = (event.clientY - windowHalfY) * 0.0007;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth interpolation towards mouse
      targetX += (mouseX - targetX) * 0.06;
      targetY += (mouseY - targetY) * 0.06;

      mainGroup.rotation.y = elapsedTime * 0.22 + targetX * 2.2;
      mainGroup.rotation.x = Math.sin(elapsedTime * 0.35) * 0.2 + targetY * 2.2;
      knotMesh.rotation.z = elapsedTime * 0.15;
      cageMesh.rotation.y = -elapsedTime * 0.12;
      ring1Mesh.rotation.z = elapsedTime * 0.18;
      ring2Mesh.rotation.x = -elapsedTime * 0.14;
      particlesMesh.rotation.y = elapsedTime * 0.025;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [variant]);

  return (
    <div
      ref={mountRef}
      className={`pointer-events-none absolute inset-0 w-full h-full overflow-hidden ${className}`}
      aria-hidden="true"
    />
  );
};
