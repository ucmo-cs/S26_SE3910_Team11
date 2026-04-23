import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import * as THREE from "three";

function CommerceGlobe() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.9;
    }
  });

  // Latitude lines (horizontal rings stacked along Y axis)
  const latitudes = [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75];
  // Longitude lines (vertical great circles rotated around Y axis)
  const longitudes = [0, 1, 2, 3, 4, 5].map((i) => (i * Math.PI) / 6);

  const radius = 1.6;
  const tubeRadius = 0.022;
  const globeColor = "#0a6b4f";

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
      <group ref={groupRef} rotation={[0.25, 0, 0]}>
        {/* Solid inner sphere for the dark green body */}
        <mesh>
          <sphereGeometry args={[radius * 0.985, 64, 64]} />
          <meshStandardMaterial
            color={globeColor}
            metalness={0.4}
            roughness={0.45}
            emissive="#063d2d"
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* Latitude rings (white grid lines) */}
        {latitudes.map((y, i) => {
          const ringRadius = radius * Math.sqrt(1 - y * y);
          return (
            <mesh key={`lat-${i}`} position={[0, y * radius, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[ringRadius, tubeRadius, 12, 96]} />
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={0.35}
                roughness={0.3}
                metalness={0.1}
              />
            </mesh>
          );
        })}

        {/* Longitude rings (white great circles) */}
        {longitudes.map((angle, i) => (
          <mesh key={`lng-${i}`} rotation={[0, angle, 0]}>
            <torusGeometry args={[radius, tubeRadius, 12, 128]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={0.35}
              roughness={0.3}
              metalness={0.1}
            />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

function Particles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 200;

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const radius = 4 + Math.random() * 3;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#7bf0c7"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

export default function IntroAnimation() {
  const [visible, setVisible] = useState(true);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("intro-played") === "true") {
      setVisible(false);
      return;
    }

    const fadeTimer = setTimeout(() => setFadingOut(true), 4400);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("intro-played", "true");
    }, 5000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleSkip = () => {
    setFadingOut(true);
    sessionStorage.setItem("intro-played", "true");
    setTimeout(() => setVisible(false), 400);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[hsl(210,30%,8%)] via-[hsl(162,50%,12%)] to-[hsl(210,30%,8%)] transition-opacity duration-700 ${
        fadingOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <button
        type="button"
        onClick={handleSkip}
        aria-label="Skip intro animation"
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10 px-3 py-1.5 text-xs md:text-sm font-medium text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full transition-colors"
      >
        Skip
      </button>

      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-3, 2, 4]} intensity={1.5} color="#2dd4a8" />
        <pointLight position={[3, -2, 4]} intensity={1} color="#1a8c6d" />
        <Environment preset="city" />

        <CommerceGlobe />
        <Particles />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-24 animate-fade-in">
        <h1 className="font-serif text-3xl md:text-5xl font-bold text-white tracking-wide" style={{ fontFamily: 'Merriweather, serif' }}>
          Commerce Bank
        </h1>
      </div>
    </div>
  );
}
