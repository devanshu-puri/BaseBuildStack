"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import gsap from "gsap";

export interface AnimatedLogoProps {
  size?: number;
  className?: string;
  showBorder?: boolean;
}

/**
 * AnimatedLogo
 * Native Three.js WebGL canvas rendering the Seamless Aurora Pyramid.
 * Zero iframes, zero external CDNs, completely compliant with CSP.
 */
export function AnimatedLogo({
  size = 34,
  className = "",
  showBorder = true,
}: AnimatedLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, 1.0, 0.1, 100);
    camera.position.set(0, 2.2, 11.5);
    camera.lookAt(0, 0.3, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const internalRes = 180;
    renderer.setSize(internalRes, internalRes, false);
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.innerHTML = "";
    container.appendChild(canvas);

    // --- Post-Processing (Soft Bloom for Aurora) ---
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(internalRes, internalRes),
      0.55,
      0.5,
      0.4
    );

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    const pyramidGroup = new THREE.Group();
    pyramidGroup.position.y = 0;
    scene.add(pyramidGroup);

    // --- Custom Seamless Aurora Shader ---
    const auroraUniforms = {
      u_time: { value: 0 },
      u_c1: { value: new THREE.Color("#272545") },
      u_c2: { value: new THREE.Color("#32304a") },
      u_c3: { value: new THREE.Color("#5840cc") },
      u_c4: { value: new THREE.Color("#be99e3") },
    };

    const vertexShader = `
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vWorldPosition;
      varying vec3 vNormal;
      uniform float u_time;
      uniform vec3 u_c1;
      uniform vec3 u_c2;
      uniform vec3 u_c3;
      uniform vec3 u_c4;

      void main() {
        float normalizedY = (vWorldPosition.y + 1.5) / 3.5;
        float wave = sin(vWorldPosition.x * 2.5 + u_time * 1.5) * 0.1 
                   + cos(vWorldPosition.z * 2.0 - u_time * 1.0) * 0.1;
        float t = clamp(normalizedY + wave, 0.0, 1.0);

        vec3 baseColor;
        if (t < 0.33) {
          baseColor = mix(u_c1, u_c2, t / 0.33);
        } else if (t < 0.66) {
          baseColor = mix(u_c2, u_c3, (t - 0.33) / 0.33);
        } else {
          baseColor = mix(u_c3, u_c4, (t - 0.66) / 0.34);
        }

        vec3 lightDir = normalize(vec3(1.0, 1.5, 1.0));
        float diff = max(dot(vNormal, lightDir), 0.0);
        float ambient = 0.35;
        baseColor *= (ambient + diff * 0.65);

        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float fresnel = 1.0 - max(dot(viewDir, vNormal), 0.0);
        fresnel = pow(fresnel, 2.4);
        baseColor += fresnel * u_c4 * 0.35;

        gl_FragColor = vec4(baseColor, 1.0);
      }
    `;

    const auroraMaterial = new THREE.ShaderMaterial({
      uniforms: auroraUniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });

    // --- Geometric Architecture (Curved Edges & Tapering) ---
    const layersData = [
      { h: 0.8, wB: 5.0, wT: 3.6 },
      { h: 0.8, wB: 3.6, wT: 2.2 },
      { h: 0.8, wB: 2.2, wT: 0.8 },
      { h: 0.6, wB: 0.8, wT: 0.1 },
    ];

    const gap = 0.02;
    let currentY = -1.2;
    const layers: THREE.Mesh[] = [];

    layersData.forEach((data) => {
      const segments = 6;
      const edgeRadius = 0.08;
      const geometry = new RoundedBoxGeometry(1, data.h, 1, segments, edgeRadius);

      const posAttr = geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const y = posAttr.getY(i);
        const normalizedLocalY = (y + data.h / 2) / data.h;
        const scaleXZ = THREE.MathUtils.lerp(data.wB, data.wT, normalizedLocalY);
        posAttr.setX(i, posAttr.getX(i) * scaleXZ);
        posAttr.setZ(i, posAttr.getZ(i) * scaleXZ);
      }

      geometry.computeVertexNormals();
      geometry.rotateY(Math.PI / 4);

      const mesh = new THREE.Mesh(geometry, auroraMaterial);
      const targetY = currentY + data.h / 2;
      mesh.userData = { targetY };

      mesh.position.set(0, targetY + 8, 0);
      mesh.rotation.y = Math.PI * 0.5;

      pyramidGroup.add(mesh);
      layers.push(mesh);

      currentY += data.h + gap;
    });

    // --- Stacking Animation Sequence with 3.5s Rest Interval ---
    const masterTl = gsap.timeline({
      repeat: -1,
      repeatDelay: 0.2,
    });

    // 1. Reset
    masterTl.add(() => {
      layers.forEach((layer) => {
        layer.position.y = (layer.userData.targetY as number) + 8;
        layer.rotation.y = Math.PI * 0.5;
      });
    });

    // 2. Cascade Drop-in (Base -> L1 -> L2 -> Beak)
    layers.forEach((layer, index) => {
      masterTl.to(
        layer.position,
        {
          y: layer.userData.targetY as number,
          duration: 1.35,
          ease: "power3.out",
        },
        index * 0.22
      );

      masterTl.to(
        layer.rotation,
        {
          y: 0,
          duration: 1.35,
          ease: "power3.out",
        },
        index * 0.22
      );
    });

    // 3. Stays fully stacked together and rotating for 3.5s
    masterTl.to({}, { duration: 3.5 });

    // 4. Reverse Peel: layers smoothly lift back up into the air
    const reversed = [...layers].reverse();
    reversed.forEach((layer, revIdx) => {
      masterTl.to(
        layer.position,
        {
          y: (layer.userData.targetY as number) + 8,
          duration: 0.75,
          ease: "power2.in",
        },
        "-=" + (revIdx === 0 ? "0" : "0.6")
      );

      masterTl.to(
        layer.rotation,
        {
          y: Math.PI * 0.5,
          duration: 0.75,
          ease: "power2.in",
        },
        "<"
      );
    });

    masterTl.to({}, { duration: 0.3 });

    // --- Render Loop ---
    const clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      auroraUniforms.u_time.value = elapsedTime;
      pyramidGroup.rotation.y = elapsedTime * 0.28;
      composer.render();
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      masterTl.kill();
      renderer.dispose();
      composer.dispose();
      if (container.contains(canvas)) {
        container.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative shrink-0 rounded-[11px] overflow-hidden select-none transition-all ${
        showBorder
          ? "border border-purple-500/30 bg-[#0d0a17] shadow-[0_0_18px_rgba(88,64,204,0.45)] hover:border-purple-400/50 hover:shadow-[0_0_24px_rgba(190,153,227,0.5)]"
          : "bg-transparent"
      } ${className}`}
    />
  );
}
