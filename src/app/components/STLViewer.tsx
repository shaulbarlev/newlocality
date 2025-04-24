"use client";

import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

interface STLViewerProps {
  url: string;
  width?: number;
  height?: number;
  backgroundColor?: string;
  modelColor?: string;
}

const STLViewer: React.FC<STLViewerProps> = ({
  url,
  width = 400,
  height = 400,
  backgroundColor = "#f5f5f5",
  modelColor = "#00bcd4",
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create refs for renderer and controls for cleanup
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Clear any existing content
    if (rendererRef.current) {
      mountRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
    }

    // Cancel any ongoing animation frames
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-1, -1, -1);
    scene.add(backLight);

    // Loading the STL file
    const loader = new STLLoader();

    loader.load(
      url,
      (geometry) => {
        const material = new THREE.MeshPhongMaterial({
          color: modelColor,
          specular: 0x111111,
          shininess: 200,
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Center the model
        geometry.computeBoundingBox();
        const boundingBox = geometry.boundingBox!;
        const center = new THREE.Vector3();
        boundingBox.getCenter(center);
        mesh.position.set(-center.x, -center.y, -center.z);

        // Adjust scale and camera position based on model size
        const size = new THREE.Vector3();
        boundingBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / Math.sin(fov / 2));

        // Position camera to fit model
        camera.position.z = cameraZ * 1.5;

        // Adjust camera clipping planes
        // Set near plane relative to the model size to avoid clipping too early/late
        const nearPlaneFactor = 0.01; // Adjust this factor based on model scale (smaller for smaller models)
        const nearPlane = Math.max(maxDim * nearPlaneFactor, 0.1); // Ensure near is at least 0.1

        // Calculate the distance from camera to the furthest point of the bounding box
        const cameraToFarPoint = cameraZ + maxDim / 2; // Distance to center + half max dimension
        const farPlaneFactor = 2; // Multiplier to ensure far plane is beyond the model

        const farPlane = cameraToFarPoint * farPlaneFactor;

        camera.near = nearPlane;
        camera.far = farPlane;

        camera.updateProjectionMatrix();

        scene.add(mesh);
        setLoading(false);
      },
      // Progress callback
      (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      // Error callback
      (error) => {
        console.error("Error loading STL file:", error);
        setError("Failed to load the 3D model.");
        setLoading(false);
      }
    );

    // Animation loop
    const animate = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup on unmount or when dependencies change
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      scene.clear();

      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();

        // Only try to remove if it's actually a child
        if (
          mountRef.current &&
          mountRef.current.contains(rendererRef.current.domElement)
        ) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }

        rendererRef.current = null;
      }
    };
  }, [url, width, height, backgroundColor, modelColor]);

  return (
    <div>
      <div
        ref={mountRef}
        style={{
          width,
          height,
          position: "relative",
        }}
      >
        {loading && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1,
            }}
          >
            Loading model...
          </div>
        )}
        {error && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              color: "red",
              zIndex: 1,
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default STLViewer;
