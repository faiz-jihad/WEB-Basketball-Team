import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Procedural texture generator for a realistic basketball
const createBasketballTextures = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { map: null, bumpMap: null };

  // Fill with base basketball orange
  ctx.fillStyle = '#FF5A00';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw leather dimples (bump map texture)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 1024;
  bumpCanvas.height = 512;
  const bumpCtx = bumpCanvas.getContext('2d');
  if (bumpCtx) {
    bumpCtx.fillStyle = '#808080'; // neutral bump grey
    bumpCtx.fillRect(0, 0, bumpCanvas.width, bumpCanvas.height);
    
    // Draw fine leather grain dots
    for (let x = 0; x < bumpCanvas.width; x += 4) {
      for (let y = 0; y < bumpCanvas.height; y += 4) {
        const jitterX = (Math.random() - 0.5) * 1.5;
        const jitterY = (Math.random() - 0.5) * 1.5;
        
        bumpCtx.fillStyle = '#ffffff'; // bump up
        bumpCtx.beginPath();
        bumpCtx.arc(x + jitterX, y + jitterY, 0.8, 0, Math.PI * 2);
        bumpCtx.fill();

        bumpCtx.fillStyle = '#000000'; // bump down shadow
        bumpCtx.beginPath();
        bumpCtx.arc(x + jitterX + 0.5, y + jitterY + 0.5, 0.8, 0, Math.PI * 2);
        bumpCtx.fill();
        
        // Add subtle color noise to the main map
        ctx.fillStyle = Math.random() > 0.5 ? '#E04F00' : '#FF6611';
        ctx.fillRect(x + jitterX, y + jitterY, 1.5, 1.5);
      }
    }
  }

  // Draw black rubber channels (lines) on main map
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#0e0e0e';
  
  // Outer border lines / horizontal / vertical center lines
  // Horizontal center seam
  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();

  // Vertical center seam (wraps around)
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, canvas.height);
  ctx.moveTo(canvas.width, 0);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.stroke();

  // Curved basketball panel seams (ellipses mapping onto sphere)
  ctx.lineWidth = 8;
  const drawPanelSeam = (offset: number) => {
    ctx.beginPath();
    ctx.arc(canvas.width * offset, canvas.height / 2, canvas.height / 2.2, 0, Math.PI * 2);
    ctx.stroke();
  };
  drawPanelSeam(0.25);
  drawPanelSeam(0.75);

  // Sync bump map channels
  if (bumpCtx) {
    bumpCtx.lineWidth = 12;
    bumpCtx.strokeStyle = '#000000'; // deep recess for lines
    
    bumpCtx.beginPath();
    bumpCtx.moveTo(0, bumpCanvas.height / 2);
    bumpCtx.lineTo(bumpCanvas.width, bumpCanvas.height / 2);
    bumpCtx.stroke();

    bumpCtx.beginPath();
    bumpCtx.moveTo(bumpCanvas.width / 2, 0);
    bumpCtx.lineTo(bumpCanvas.width / 2, bumpCanvas.height);
    bumpCtx.stroke();

    bumpCtx.beginPath();
    bumpCtx.arc(bumpCanvas.width * 0.25, bumpCanvas.height / 2, bumpCanvas.height / 2.2, 0, Math.PI * 2);
    bumpCtx.stroke();
    bumpCtx.beginPath();
    bumpCtx.arc(bumpCanvas.width * 0.75, bumpCanvas.height / 2, bumpCanvas.height / 2.2, 0, Math.PI * 2);
    bumpCtx.stroke();
  }

  const mapTex = new THREE.CanvasTexture(canvas);
  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  
  mapTex.wrapS = THREE.RepeatWrapping;
  mapTex.wrapT = THREE.ClampToEdgeWrapping;
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.ClampToEdgeWrapping;

  return { map: mapTex, bumpMap: bumpTex };
};

// 3D Fire Particles Component
const FireParticles = ({ count = 150, active = false }) => {
  const pointsRef = useRef<THREE.Points | null>(null);
  
  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      // Position particles on/near a sphere shell
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.0 + Math.random() * 0.3; // slightly outside ball (radius 2)
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Velocity vectors (expanding slightly outwards + floating upwards)
      vel[i * 3] = pos[i * 3] * 0.4 + (Math.random() - 0.5) * 0.5;
      vel[i * 3 + 1] = Math.random() * 2 + 1; // rise up
      vel[i * 3 + 2] = pos[i * 3 + 2] * 0.4 + (Math.random() - 0.5) * 0.5;

      // Colors: Fire gradient (Red -> Orange -> Gold)
      const rColor = 1.0;
      const gColor = Math.random() * 0.5 + 0.2; // 0.2 to 0.7
      const bColor = 0.0;
      col[i * 3] = rColor;
      col[i * 3 + 1] = gColor;
      col[i * 3 + 2] = bColor;
    }

    return [pos, vel, col];
  }, [count]);

  const pGeom = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geom;
  }, [positions, colors]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < count; i++) {
      let x = posAttr.getX(i);
      let y = posAttr.getY(i);
      let z = posAttr.getZ(i);

      if (active) {
        // Move particle
        x += velocities[i * 3] * 0.015;
        y += velocities[i * 3 + 1] * 0.015;
        z += velocities[i * 3 + 2] * 0.015;

        // Reset if too far or died out
        const dist = Math.sqrt(x*x + y*y + z*z);
        if (y > 4.5 || dist > 4.0) {
          const u = Math.random();
          const v = Math.random();
          const theta = u * 2.0 * Math.PI;
          const phi = Math.acos(2.0 * v - 1.0);
          const r = 2.0;
          x = r * Math.sin(phi) * Math.cos(theta);
          y = r * Math.sin(phi) * Math.sin(theta);
          z = r * Math.cos(phi);
        }
      } else {
        // Fade particles inwards when not active
        x = x * 0.95;
        y = y * 0.95;
        z = z * 0.95;
      }

      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={pGeom}>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={active ? 0.8 : 0.0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// Basketball Mesh
const Basketball = ({ isHovered, setHovered }: { isHovered: boolean; setHovered: (h: boolean) => void }) => {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const textures = useMemo(() => createBasketballTextures(), []);
  
  // Track mouse coordinates for interactive tilt
  const mouse = useRef({ x: 0, y: 0 });
  const scrollOffset = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    
    const handleScroll = () => {
      scrollOffset.current = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    
    // Slow auto rotation
    meshRef.current.rotation.y += 0.005;
    
    // Lerp follow mouse tilt
    const targetRotX = mouse.current.y * 0.4;
    const targetRotY = mouse.current.x * 0.4;
    meshRef.current.rotation.x += (targetRotX - meshRef.current.rotation.x) * 0.05;
    meshRef.current.rotation.y += (targetRotY - meshRef.current.rotation.y) * 0.05;

    // Additional spin on scroll
    meshRef.current.rotation.y += scrollOffset.current * 0.05;
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        scale={[2, 2, 2]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1, 64, 64]} />
        {textures.map && textures.bumpMap ? (
          <meshStandardMaterial
            map={textures.map}
            bumpMap={textures.bumpMap}
            bumpScale={0.06}
            roughness={0.7}
            metalness={0.1}
          />
        ) : (
          <meshStandardMaterial color="#FF5A00" roughness={0.5} />
        )}
      </mesh>
      <FireParticles active={isHovered} />
    </group>
  );
};

// Scene Lights
const SceneElements = ({ isHovered }: { isHovered: boolean }) => {
  const lightRef = useRef<THREE.DirectionalLight | null>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    if (!lightRef.current) return;
    // Move lighting based on mouse for dynamic highlights
    lightRef.current.position.x = mouse.current.x * 5;
    lightRef.current.position.y = mouse.current.y * 5 + 4;
  });

  return (
    <>
      <ambientLight intensity={0.15} />
      
      {/* Dynamic spot keylight */}
      <directionalLight
        ref={lightRef}
        position={[3, 5, 4]}
        intensity={isHovered ? 2.5 : 1.8}
        color={isHovered ? '#FF7A00' : '#ffffff'}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      
      {/* Rim light */}
      <directionalLight
        position={[-5, -2, -5]}
        intensity={1.5}
        color="#8B0000"
      />

      {/* Gold backlight accent */}
      <pointLight
        position={[0, 0, -3]}
        intensity={2.0}
        color="#D4AF37"
        distance={6}
      />
    </>
  );
};

interface Basketball3DProps {
  className?: string;
  interactive?: boolean;
}

export const Basketball3D: React.FC<Basketball3DProps> = ({ className = "h-[400px] w-full", interactive = true }) => {
  const [isHovered, setHovered] = useState(false);

  return (
    <div className={`relative ${className} select-none cursor-pointer overflow-hidden`}>
      {/* Glowing arena ring backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-orange/15 rounded-full filter blur-[80px] pointer-events-none transition-all duration-700" style={{ transform: `translate(-50%, -50%) scale(${isHovered ? 1.4 : 1.0})` }} />
      
      <Canvas shadows gl={{ antialias: true }} dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 5.5]} fov={50} />
        <SceneElements isHovered={isHovered} />
        <Basketball isHovered={isHovered} setHovered={setHovered} />
        {interactive && <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 2} />}
      </Canvas>

      {/* Interactive hints */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center">
        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-display transition-opacity duration-300">
          {isHovered ? '⚡ UNLEASHING HEAT PARTICLE EFFECT' : '🖱️ DRAG TO ROTATE • HOVER TO FLAME'}
        </span>
      </div>
    </div>
  );
};

export default Basketball3D;
