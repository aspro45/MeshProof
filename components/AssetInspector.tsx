"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCube, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import type { RiskTone } from "@/lib/types";

/** Color + intensity per risk tone (drives the scan shader). */
const TONE_CFG: Record<RiskTone, { base: string; scan: string; risk: number; label: string }> = {
  verified: { base: "#38BDF8", scan: "#22C55E", risk: 0.18, label: "verified" },
  review: { base: "#38BDF8", scan: "#F59E0B", risk: 0.55, label: "needs review" },
  risk: { base: "#7F1D1D", scan: "#EF4444", risk: 0.95, label: "high risk" },
  neutral: { base: "#1E3A4A", scan: "#38BDF8", risk: 0.3, label: "unscanned" },
};

const VERT = `
  varying vec3 vNormal; varying vec3 vView; varying vec3 vPos;
  void main() {
    vPos = position;
    vNormal = normalMatrix * normal;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = -mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;
const FRAG = `
  uniform float uTime; uniform vec3 uColor; uniform vec3 uScan; uniform float uRisk;
  varying vec3 vNormal; varying vec3 vView; varying vec3 vPos;
  void main() {
    vec3 N = normalize(vNormal); vec3 V = normalize(vView);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 2.2);
    float band = sin(vPos.y * 7.0 - uTime * 2.2);
    float scan = smoothstep(0.55, 1.0, band);
    vec3 base = mix(uColor * 0.18, uColor, 0.45 + 0.55 * fres);
    vec3 col = mix(base, uScan, scan * (0.35 + 0.65 * uRisk));
    col += fres * uScan * 0.7;
    gl_FragColor = vec4(col, 1.0);
  }
`;

function webglAvailable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

function AssetMesh({ tone }: { tone: RiskTone }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const cfg = TONE_CFG[tone];
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(cfg.base) },
      uScan: { value: new THREE.Color(cfg.scan) },
      uRisk: { value: cfg.risk },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    uniforms.uColor.value.set(cfg.base);
    uniforms.uScan.value.set(cfg.scan);
    uniforms.uRisk.value = cfg.risk;
  }, [cfg, uniforms]);

  useFrame((_, dt) => {
    uniforms.uTime.value += dt;
    if (groupRef.current) { groupRef.current.rotation.y += dt * 0.35; groupRef.current.rotation.x += dt * 0.08; }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <icosahedronGeometry args={[1.35, 1]} />
        <shaderMaterial ref={matRef} vertexShader={VERT} fragmentShader={FRAG} uniforms={uniforms} />
      </mesh>
      <mesh scale={1.355}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial color={cfg.scan} wireframe transparent opacity={0.18} />
      </mesh>
    </group>
  );
}

function Fallback({ tone, reason }: { tone: RiskTone; reason: string }) {
  const cfg = TONE_CFG[tone];
  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden rounded-md border border-line bg-[#0a0f16]">
      <div className="absolute inset-0 animate-scan opacity-30" style={{ background: `linear-gradient(180deg, transparent, ${cfg.scan}33, transparent)` }} />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="grid h-20 w-20 place-items-center rounded-xl border-2" style={{ borderColor: cfg.scan, color: cfg.scan, boxShadow: `0 0 40px -8px ${cfg.scan}` }}>
          <FontAwesomeIcon icon={faCube} className="h-9 w-9" />
        </div>
        <div className="text-sm font-semibold text-text">3D inspection · {cfg.label}</div>
        <div className="flex items-center gap-1.5 text-xs text-muted"><FontAwesomeIcon icon={faTriangleExclamation} className="h-3 w-3 text-warning" /> {reason}</div>
      </div>
    </div>
  );
}

export function AssetInspector({ tone = "neutral", height = 380 }: { tone?: RiskTone; height?: number }) {
  const [ok, setOk] = useState<boolean | null>(null);
  const [crashed, setCrashed] = useState(false);
  useEffect(() => { setOk(webglAvailable()); }, []);
  const cfg = TONE_CFG[tone];

  return (
    <div className="relative" style={{ height }}>
      {ok === false || crashed ? (
        <Fallback tone={tone} reason={crashed ? "WebGL context lost — showing fallback." : "WebGL unavailable — showing fallback."} />
      ) : ok === null ? (
        <div className="grid h-full w-full place-items-center rounded-md border border-line bg-[#0a0f16] text-sm text-muted">Initializing inspector…</div>
      ) : (
        <div className="h-full w-full overflow-hidden rounded-md border border-line bg-[#0a0f16]">
          <Canvas
            camera={{ position: [0, 0, 4], fov: 50 }}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: false }}
            onCreated={({ gl }) => {
              gl.setClearColor(new THREE.Color("#070b11"));
              gl.domElement.addEventListener("webglcontextlost", () => setCrashed(true));
            }}
          >
            <ambientLight intensity={0.5} />
            <pointLight position={[4, 5, 5]} intensity={40} color={cfg.scan} />
            <pointLight position={[-4, -3, 2]} intensity={18} color={cfg.base} />
            <AssetMesh tone={tone} />
            <OrbitControls enablePan={false} enableZoom={false} autoRotate={false} />
          </Canvas>
        </div>
      )}
      <div className="pointer-events-none absolute left-3 top-3 chip border-line bg-bg/70 text-muted">
        <span className="h-2 w-2 rounded-full" style={{ background: cfg.scan }} /> risk scan · {cfg.label}
      </div>
    </div>
  );
}
