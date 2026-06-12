import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 3D Gold Trophy Mesh
const GoldTrophy: React.FC = () => {
  const groupRef = useRef<THREE.Group | null>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.012; // slow spin
    }
  });

  return (
    <group ref={groupRef}>
      {/* Trophy Base (Dark Marble) */}
      <mesh position={[0, -1.8, 0]}>
        <cylinderGeometry args={[0.9, 1.1, 0.8, 32]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.1} />
      </mesh>
      
      {/* Gold Pedestal Stem */}
      <mesh position={[0, -1.1, 0]}>
        <cylinderGeometry args={[0.2, 0.4, 0.6, 32]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.1} metalness={0.95} />
      </mesh>

      {/* Main Bowl Ring Connector */}
      <mesh position={[0, -0.7, 0]}>
        <torusGeometry args={[0.5, 0.08, 16, 100]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.15} metalness={0.95} />
      </mesh>

      {/* Main Cup Body */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.9, 0.2, 1.4, 32, 1, true]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.1} metalness={0.95} side={THREE.DoubleSide} />
      </mesh>

      {/* Bowl Bottom Sphere */}
      <mesh position={[0, -0.6, 0]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.1} metalness={0.95} />
      </mesh>

      {/* Trophy Handles (Left and Right Toruses) */}
      <mesh position={[-0.8, 0.25, 0]} rotation={[0, 0, Math.PI / 6]}>
        <torusGeometry args={[0.4, 0.07, 16, 100, Math.PI * 1.5]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.1} metalness={0.95} />
      </mesh>
      <mesh position={[0.8, 0.25, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <torusGeometry args={[0.4, 0.07, 16, 100, Math.PI * 1.5]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.1} metalness={0.95} />
      </mesh>

      {/* Floating Crown / Basketball on Top */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Crown Rim Ring */}
      <mesh position={[0, 0.8, 0]}>
        <torusGeometry args={[0.5, 0.05, 16, 100]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.1} metalness={0.95} />
      </mesh>
    </group>
  );
};

// 3D Championship Ring Mesh
const ChampionshipRing: React.FC = () => {
  const groupRef = useRef<THREE.Group | null>(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
      groupRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Outer Ring Band (Thick Gold Torus) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.0, 0.35, 32, 100]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.1} metalness={0.95} />
      </mesh>

      {/* Ring Face Shield (Flat Cylinder) */}
      <mesh position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.3, 32]} />
        <meshStandardMaterial color="#D4AF37" roughness={0.15} metalness={0.9} />
      </mesh>

      {/* Center Gemstone (Orange Brilliant Hexagonal Prism) */}
      <mesh position={[0, 0, 0.4]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.55, 0.45, 0.2, 6]} />
        <meshStandardMaterial
          color="#FF5A00"
          roughness={0.05}
          metalness={0.9}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Mini Diamonds Around the Shield (Point instances) */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 0.75;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        return (
          <mesh key={i} position={[x, y, 0.32]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#ffffff" roughness={0.01} metalness={0.99} />
          </mesh>
        );
      })}

      {/* Star / Crest Emblem in Center */}
      <mesh position={[0, 0, 0.51]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.15, 0.2, 4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.95} />
      </mesh>
    </group>
  );
};

interface Trophy3DProps {
  type: 'trophy' | 'ring';
  className?: string;
}

export const Trophy3D: React.FC<Trophy3DProps> = ({ type, className = "h-[250px] w-full" }) => {
  return (
    <div className={`relative ${className} select-none overflow-hidden`}>
      <Canvas gl={{ antialias: true }} dpr={[1, 2]}>
        {/* Lights */}
        <ambientLight intensity={0.25} />
        
        {/* Directional Keylight */}
        <directionalLight position={[5, 5, 5]} intensity={2.5} color="#ffffff" />
        <directionalLight position={[-5, 3, -2]} intensity={1.0} color="#D4AF37" />
        
        {/* Orange glow backlight */}
        <pointLight position={[0, 0, -2]} intensity={3.0} color="#FF5A00" distance={5} />
        
        {/* Soft fill */}
        <directionalLight position={[0, -5, 0]} intensity={0.5} color="#8B0000" />

        {type === 'trophy' ? <GoldTrophy /> : <ChampionshipRing />}
      </Canvas>
    </div>
  );
};

export default Trophy3D;
