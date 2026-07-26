import React, { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, Box, Torus, Float, Environment } from "@react-three/drei";
import * as THREE from "three";

function AnimatedShape({ position, scale, speed, color, shape = "sphere" }) {
  const ref = useRef(null);
  const startPos = useRef(position);
  const time = useRef(0);

  useFrame(() => {
    if (ref.current) {
      time.current += 0.002 * speed;
      ref.current.position.y = startPos.current[1] + Math.sin(time.current) * 0.5;
      ref.current.rotation.x += 0.001 * speed;
      ref.current.rotation.y += 0.002 * speed;
    }
  });

  const ShapeComponent = shape === "box" ? Box : shape === "torus" ? Torus : Sphere;

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.5}>
      <ShapeComponent ref={ref} scale={scale} position={position}>
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />
      </ShapeComponent>
    </Float>
  );
}

function AnimatedScene() {
  return (
    <>
      <Environment preset="studio" />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, 10]} intensity={0.5} color="#ff00ff" />

      {/* Floating animated shapes */}
      <AnimatedShape position={[-3, 0, -5]} scale={1.5} speed={1} color="#00ffff" shape="sphere" />
      <AnimatedShape position={[3, 2, -5]} scale={1.2} speed={0.8} color="#ff00ff" shape="box" />
      <AnimatedShape position={[0, -2, -6]} scale={1} speed={1.2} color="#00ff88" shape="torus" />
      <AnimatedShape position={[-5, 1, -4]} scale={0.8} speed={0.6} color="#ffff00" shape="sphere" />
      <AnimatedShape position={[5, -1, -5]} scale={1.3} speed={0.9} color="#00ccff" shape="box" />
    </>
  );
}

export default function AnimatedBackground() {
  return (
    <div className="w-full h-[500px] bg-gradient-to-b from-black via-gray-900 to-black overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <AnimatedScene />
      </Canvas>
    </div>
  );
}
