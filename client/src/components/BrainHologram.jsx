import { memo, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const cyan = '#22d3ee';

function BrainLobes() {
  const lobes = [
    [-.68, .18, .02, .86, .72, .66], [.68, .18, .02, .86, .72, .66],
    [-.56, .60, .03, .65, .52, .54], [.56, .60, .03, .65, .52, .54],
    [-.68, -.38, .05, .72, .53, .62], [.68, -.38, .05, .72, .53, .62],
    [0, -.72, -.10, .72, .42, .43]
  ];
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1, 2), []);
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: cyan, wireframe: true, transparent: true, opacity: .72, blending: THREE.AdditiveBlending, depthWrite: false }), []);
  return <>{lobes.map(([x, y, z, sx, sy, sz], index) => <mesh key={index} position={[x, y, z]} scale={[sx, sy, sz]} geometry={geometry} material={material} />)}</>;
}

function Neurons() {
  const points = useMemo(() => [
    [-.95,.3,.2],[-.55,.8,.15],[-.2,.55,.55],[.22,.75,.22],[.77,.4,.42],[.93,-.18,.18],
    [.5,-.55,.47],[.02,-.76,.36],[-.48,-.53,.48],[-.9,-.22,.15],[.12,.08,.75],[-.15,.22,.72]
  ], []);
  return <>{points.map((position, index) => <Neuron key={index} position={position} offset={index * .63} />)}</>;
}

function Neuron({ position, offset }) {
  const point = useRef();
  useFrame(({ clock }) => { const pulse = .7 + Math.sin(clock.elapsedTime * 2.2 + offset) * .3; point.current.scale.setScalar(pulse); point.current.material.opacity = .45 + pulse * .45; });
  return <mesh ref={point} position={position}><sphereGeometry args={[.038, 10, 10]} /><meshBasicMaterial color={cyan} transparent opacity={.9} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>;
}

function RotatingBrain() {
  const group = useRef();
  useFrame((_state, delta) => { group.current.rotation.y += delta * (Math.PI * 2 / 22); group.current.rotation.z = Math.sin(performance.now() * .00035) * .035; });
  return <group ref={group} rotation={[-.12, -.35, .08]}><BrainLobes /><Neurons /></group>;
}

function BrainScene() {
  return <Canvas dpr={[1, 1.5]} gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }} camera={{ position: [0, 0, 4.3], fov: 43 }}><RotatingBrain /></Canvas>;
}

export default memo(function BrainHologram() {
  return <div className="brain-hologram" aria-hidden="true"><BrainScene /><div className="brain-fallback" /></div>;
});
