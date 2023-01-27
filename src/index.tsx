import * as THREE from "three";
import { useRef, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import React from "react";
import { unmountComponentAtNode } from "react-dom";

import { MeshTransmissionMaterial, OrbitControls } from "@react-three/drei";

import vertexShader from "./vertexShader.glsl";
import fragmentShader from "./fragmentShader.glsl";

export function Start() {
  createRoot(document.getElementById("root") as HTMLElement).render(
    <Canvas camera={{ position: [0, 5, 20] }} dpr={[1, 2]}>
      <color attach="background" args={["black"]} />
      <ambientLight intensity={1.0} />
      <Floor />
      <OrbitControls autoRotateSpeed={0.3} autoRotate={true} />
    </Canvas>
  );
}

export function Stop() {
  unmountComponentAtNode(document.getElementById("root") as HTMLElement);
}

const Floor = () => {
  const mesh = useRef<THREE.Mesh>(null!);
  const [renderTarget] = useState(
    new THREE.WebGLCubeRenderTarget(256, {
      format: THREE.RGBAFormat,
      generateMipmaps: true,
    })
  );
  const cubeCamera = useRef<THREE.CubeCamera>(null!);

  useFrame(({ mouse, gl, scene }) => {
    cubeCamera.current.update(gl, scene);
  });

  return (
    <>
      <cubeCamera
        name="cubeCamera"
        ref={cubeCamera}
        position={[0, 0, 0]}
        args={[0.1, 100, renderTarget]}
      />

      <mesh ref={mesh} position={[0, 0, 0]}>
        <icosahedronGeometry args={[3, 8]} />
        <meshPhysicalMaterial
          color="#ffffff"
          envMap={renderTarget.texture}
          metalness={1}
          roughness={0}
        />
      </mesh>
      <Stars />
      <CustomGeometryParticles count={5000} />
    </>
  );
};

const CustomGeometryParticles = (props) => {
  const { count, shape } = props;
  const points = useRef<THREE.Points>(null!);

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);

    //golden angle in radians
    let phi = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      let y = 1 - (i / (count - 1.0)) * 2; // y goes from 1 to -1
      let radius = Math.sqrt(200 - y * y); //# radius at y

      let theta = phi * i; // # golden angle increment

      let x = Math.cos(theta) * radius;
      let z = Math.sin(theta) * radius;
      positions.set([x, y, z], i * 3);
    }

    return positions;
  }, [count, shape]);

  const uniforms = useMemo(
    () => ({
      uTime: {
        value: 0.0,
      },
    }),
    []
  );

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        attach="material"
        blending={THREE.NormalBlending}
        depthWrite={false}
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
      />
    </points>
  );
};

function Stars() {
  let positions = useMemo(() => {
    let positions: number[] = [];
    for (let i = 0; i < 500; i++) {
      const x = 50 + THREE.MathUtils.randFloatSpread(500);
      const y = 50 + THREE.MathUtils.randFloatSpread(500);
      const z = 50 + THREE.MathUtils.randFloatSpread(500);
      positions.push(x, y, z);
    }
    return new Float32Array(positions);
  }, []);
  return (
    <points>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        sizeAttenuation
        transparent={false}
        alphaTest={0.5}
        opacity={1.0}
      />
    </points>
  );
}
