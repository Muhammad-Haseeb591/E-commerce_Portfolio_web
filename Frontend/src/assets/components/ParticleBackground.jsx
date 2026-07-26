import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Particles() {
  const particlesRef = useRef(null);
  const particleCount = 1000;

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      temp.push(x, y, z);
    }
    return new Float32Array(temp);
  }, []);

  useFrame(() => {
    if (particlesRef.current) {
      particlesRef.current.rotation.x += 0.0001;
      particlesRef.current.rotation.y += 0.0002;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={particles} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={2} sizeAttenuation color="#00ffff" fog={false} />
    </points>
  );
}

function AnimatedLines() {
  const linesRef = useRef(null);

  useFrame(() => {
    if (linesRef.current) {
      linesRef.current.rotation.y += 0.0005;
      linesRef.current.rotation.x += 0.00025;
    }
  });

  const points = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(angle) * 200, Math.sin(angle) * 200, 0));
  }
  points.push(points[0]); // Close the loop

  return (
    <group ref={linesRef}>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={points.length} array={new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]))} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color="#ff00ff" linewidth={2} fog={false} />
      </line>
    </group>
  );
}

export default function ParticleBackground() {
  return (
    <div className="w-full h-[300px] bg-gradient-to-b from-black via-slate-900 to-slate-800 overflow-hidden border-b border-[#333333]">
      <Canvas
        camera={{ position: [0, 0, 600], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.3} />
        <Particles />
        <AnimatedLines />
      </Canvas>
    </div>
  );
}
