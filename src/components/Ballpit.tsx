import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

interface BallpitProps {
  count?: number;
  gravity?: number;
  friction?: number;
  wallBounce?: number;
  followCursor?: boolean;
  colors?: number[];
}

const Ballpit = ({ count = 50, gravity = 0.5, friction = 0.9, wallBounce = 0.8, followCursor = false, colors = [0xff0000, 0x00ff00, 0x0000ff] }: BallpitProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const cameraRef = useRef<THREE.PerspectiveCamera>(new THREE.PerspectiveCamera(75, 1, 0.1, 1000));
  const rendererRef = useRef<THREE.WebGLRenderer>(new THREE.WebGLRenderer({ alpha: true }));
  const ballsRef = useRef<
    {
      mesh: THREE.Mesh;
      velocity: THREE.Vector2;
    }[]
  >([]);
  const mousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    camera.aspect = containerWidth / containerHeight;
    camera.updateProjectionMatrix();
    camera.position.z = 10;

    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent background
    containerRef.current.appendChild(renderer.domElement);

    // Ball creation
    const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);

    for (let i = 0; i < count; i++) {
      const material = new THREE.MeshBasicMaterial({ color: colors[i % colors.length] });
      const ballMesh = new THREE.Mesh(ballGeometry, material);

      // Random position
      ballMesh.position.x = Math.random() * containerWidth / 50 - containerWidth / 100;
      ballMesh.position.y = Math.random() * containerHeight / 50 - containerHeight / 100;

      scene.add(ballMesh);

      // Initial velocity
      const velocity = new THREE.Vector2(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );

      ballsRef.current.push({ mesh: ballMesh, velocity: velocity });
    }

    // Animation loop
    const animate = () => {
      ballsRef.current.forEach((ball) => {
        // Apply gravity
        ball.velocity.y -= gravity / 60;

        // Apply mouse attraction
        if (followCursor) {
          const mouseForce = new THREE.Vector2(
            mousePosition.current.x - (ball.mesh.position.x * 50),
            mousePosition.current.y - (ball.mesh.position.y * 50)
          ).normalize().multiplyScalar(0.1);
          ball.velocity.add(mouseForce);
        }

        ball.mesh.position.x += ball.velocity.x / 60;
        ball.mesh.position.y += ball.velocity.y / 60;

        // Wall collisions
        if (ball.mesh.position.x > containerWidth / 100 - 0.5) {
          ball.mesh.position.x = containerWidth / 100 - 0.5;
          ball.velocity.x *= -wallBounce;
          ball.velocity.multiplyScalar(friction);
        }
        if (ball.mesh.position.x < -containerWidth / 100 + 0.5) {
          ball.mesh.position.x = -containerWidth / 100 + 0.5;
          ball.velocity.x *= -wallBounce;
          ball.velocity.multiplyScalar(friction);
        }
        if (ball.mesh.position.y > containerHeight / 100 - 0.5) {
          ball.mesh.position.y = containerHeight / 100 - 0.5;
          ball.velocity.y *= -wallBounce;
          ball.velocity.multiplyScalar(friction);
        }
        if (ball.mesh.position.y < -containerHeight / 100 + 0.5) {
          ball.mesh.position.y = -containerHeight / 100 + 0.5;
          ball.velocity.y *= -wallBounce;
          ball.velocity.multiplyScalar(friction);
        }

        ball.velocity.multiplyScalar(friction);
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;

      camera.aspect = containerWidth / containerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(containerWidth, containerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      ballsRef.current = [];
      scene.children.forEach(child => scene.remove(child));
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [count, gravity, friction, wallBounce, colors, followCursor]);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    if (containerRef.current && followCursor) {
      const rect = containerRef.current.getBoundingClientRect();
      mousePosition.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
  }, [followCursor]);

  useEffect(() => {
    if (followCursor && containerRef.current) {
      containerRef.current.addEventListener('pointermove', handlePointerMove);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('pointermove', handlePointerMove);
      }
    };
  }, [followCursor, handlePointerMove]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }} />
  );
};

export default Ballpit;
