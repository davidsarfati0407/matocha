"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, TransformControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { FloorPlanLayout } from "@/lib/map/layout";
import { useMap } from "@/lib/map/store";
import { LIMITS } from "./engine/camera";
import { MapEngine, engineRef, type LabelRefs } from "./engine/engine";
import { spriteCamera } from "./kit/furniture";
import { SNAP, commitTransform } from "./editor/PlanEditor";

function World({ layout, labels, onReady }: { layout: FloorPlanLayout; labels: React.RefObject<LabelRefs>; onReady: (e: MapEngine) => void }) {
  const { scene, camera, gl } = useThree();
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const engine = useRef<MapEngine | null>(null);

  useEffect(() => {
    if (!controls.current || engine.current) return;
    spriteCamera.current = camera;
    const e = new MapEngine(scene, camera as THREE.PerspectiveCamera, controls.current as never, layout, gl);
    e.labels = labels.current;
    engine.current = e;
    engineRef.current = e;
    onReady(e);
    return () => {
      e.dispose();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Picking : clic sans glisser (< 5 px) = sélection ; survol = curseur main
  useEffect(() => {
    const el = gl.domElement;
    let down: { x: number; y: number } | null = null;
    const ndc = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    };
    const onDown = (ev: PointerEvent) => {
      down = { x: ev.clientX, y: ev.clientY };
      stopTour();
    };
    const onUp = (ev: PointerEvent) => {
      const e = engine.current;
      if (!down || !e || ev.button !== 0) return;
      const moved = Math.hypot(ev.clientX - down.x, ev.clientY - down.y);
      down = null;
      if (moved > 5) return;
      if (useMap.getState().editMode) {
        useMap.getState().set({ editTarget: e.pickObject(ndc(ev)) });
        return;
      }
      const p = e.pickAt(ndc(ev));
      e.selectPick(p?.id ?? null, Boolean(p));
    };
    let raf = 0;
    const onMove = (ev: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const e = engine.current;
        if (!e || down) return;
        const p = e.pickAt(ndc(ev));
        e.setHover(p);
        el.style.cursor = p ? "pointer" : "grab";
      });
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", () => engine.current?.setHover(null));
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointermove", onMove);
    };
  }, [gl]);

  useFrame((_, delta) => {
    if (document.hidden || SIMTEST) return; // pause automatique onglet caché
    engine.current?.frame(delta);
  });

  // Mode test (?simtest=1) : simulation à pas fixe (×4), rendu uniquement à la demande
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    if (!SIMTEST) return;
    const timer = setInterval(() => {
      for (let i = 0; i < 4; i++) engine.current?.frame(0.05);
    }, 50);
    (window as unknown as { __render?: () => void }).__render = () => invalidate();
    return () => clearInterval(timer);
  }, [invalidate]);

  return (
    <>
      <EditGizmo />
      <OrbitControls
        ref={controls}
        makeDefault
        enableDamping
        dampingFactor={0.075}
        screenSpacePanning={false}
        minPolarAngle={LIMITS.minPolar}
        maxPolarAngle={LIMITS.maxPolar}
        minDistance={LIMITS.minDist}
        maxDistance={LIMITS.maxDist}
        mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }}
        touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />
      <hemisphereLight args={["#FBF6EA", "#B7AF9C", 1.15]} />
      <directionalLight
        position={[-38, 70, 46]}
        intensity={2.3}
        color="#FFF3DE"
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-radius={3}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-camera-left={-95}
        shadow-camera-right={95}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={10}
        shadow-camera-far={220}
      />
      <directionalLight position={[60, 30, -40]} intensity={0.35} color="#CFE0FF" />
    </>
  );
}

/** Gizmo de déplacement / rotation de l'objet édité (grille 0,5 m, pas de 15°). */
function EditGizmo() {
  const target = useMap((s) => s.editTarget);
  const editMode = useMap((s) => s.editMode);
  const mode = useMap((s) => s.transformMode);
  const obj = editMode && target ? engineRef.current?.world.objects.get(target)?.built.group : undefined;
  if (!obj) return null;
  return (
    <TransformControls
      object={obj}
      mode={mode}
      showY={mode === "rotate"}
      showX={mode === "translate"}
      showZ={mode === "translate"}
      translationSnap={SNAP}
      rotationSnap={Math.PI / 12}
      size={0.8}
      onMouseUp={() => target && commitTransform(target)}
    />
  );
}

function stopTour() {
  const s = useMap.getState();
  if (s.tour.active) s.set({ tour: { ...s.tour, active: false } });
}

/** ?quality=low : sans ombres ni anticrénelage, densité 1 (machines modestes, tests sans GPU). */
const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
const LOW = params?.get("quality") === "low";
/** ?simtest=1 : pour les tests automatisés sans GPU (voir scripts/dev). */
const SIMTEST = params?.get("simtest") === "1";

export default function Scene({ layout, labels, onReady }: { layout: FloorPlanLayout; labels: React.RefObject<LabelRefs>; onReady: (e: MapEngine) => void }) {
  const leaving = useMap((s) => s.leaving);
  return (
    <Canvas
      frameloop={leaving ? "never" : SIMTEST ? "demand" : "always"}
      shadows={LOW ? false : "percentage"}
      dpr={LOW ? 1 : [1, 2]}
      gl={{ antialias: !LOW, toneMapping: THREE.NeutralToneMapping, toneMappingExposure: 1.05, powerPreference: "high-performance" }}
      camera={{ fov: 26, near: 1, far: 900, position: [80, 120, 120] }}
      onContextMenu={(e) => e.preventDefault()}
      style={{ position: "absolute", inset: 0 }}
      aria-label="Vue 3D des locaux"
    >
      <World layout={layout} labels={labels} onReady={onReady} />
    </Canvas>
  );
}
