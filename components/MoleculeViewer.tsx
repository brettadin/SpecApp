import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { MolecularStructure, SpectralFeature } from '../types';

interface MoleculeViewerProps {
  structure: MolecularStructure | null;
  activeFeature: SpectralFeature | null;
}

// CPK Coloring
const getAtomColor = (symbol: string): number => {
  switch (symbol.toUpperCase()) {
    case 'H': return 0xFFFFFF;
    case 'C': return 0x333333; // Dark Grey
    case 'O': return 0xFF0D0D;
    case 'N': return 0x3050F8;
    case 'S': return 0xFFFF30;
    case 'CL': return 0x1FF01F;
    default: return 0xFF69B4; // Pink for unknown
  }
};

const getAtomRadius = (symbol: string): number => {
    switch (symbol.toUpperCase()) {
      case 'H': return 0.25;
      case 'C': return 0.4;
      default: return 0.4;
    }
};

const MoleculeViewer: React.FC<MoleculeViewerProps> = ({ structure, activeFeature }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const atomsMeshRef = useRef<THREE.Group | null>(null);
  const frameIdRef = useRef<number>(0);

  // Store initial positions to calculate offsets during animation
  const initialPositions = useRef<Map<number, THREE.Vector3>>(new Map());

  // Initialize Three.js
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#131420'); // Matches bg-space-900
    scene.fog = new THREE.FogExp2('#131420', 0.15);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    
    const pointLight = new THREE.PointLight(0x00f0ff, 0.5);
    pointLight.position.set(-5, 0, 5);
    scene.add(pointLight);

    // Group to hold molecule
    const group = new THREE.Group();
    scene.add(group);
    atomsMeshRef.current = group;

    // Animation Loop
    const animate = (time: number) => {
      if (atomsMeshRef.current) {
        atomsMeshRef.current.rotation.y += 0.002;
        
        // Handle Vibrations
        updateVibrations(time * 0.005);
      }
      renderer.render(scene, camera);
      frameIdRef.current = requestAnimationFrame(animate);
    };
    frameIdRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Handle Resize
  useEffect(() => {
     if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
     const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            cameraRef.current!.aspect = width / height;
            cameraRef.current!.updateProjectionMatrix();
            rendererRef.current!.setSize(width, height);
        }
     });
     resizeObserver.observe(mountRef.current);
     return () => resizeObserver.disconnect();
  }, []);

  // Update Molecule Geometry when structure changes
  useEffect(() => {
    if (!structure || !atomsMeshRef.current) return;

    const group = atomsMeshRef.current;
    
    // Clear previous
    while(group.children.length > 0){ 
        const child = group.children[0] as any;
        if(child.geometry) child.geometry.dispose();
        if(child.material) child.material.dispose();
        group.remove(child); 
    }
    initialPositions.current.clear();

    // Center geometry
    const center = new THREE.Vector3();
    structure.atoms.forEach(a => center.add(new THREE.Vector3(a.x, a.y, a.z)));
    center.divideScalar(structure.atoms.length);

    // Add Atoms
    structure.atoms.forEach(atom => {
      const geometry = new THREE.SphereGeometry(getAtomRadius(atom.symbol), 32, 32);
      const material = new THREE.MeshLambertMaterial({ 
          color: getAtomColor(atom.symbol),
          emissive: getAtomColor(atom.symbol),
          emissiveIntensity: 0.1
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      const pos = new THREE.Vector3(atom.x, atom.y, atom.z).sub(center);
      mesh.position.copy(pos);
      mesh.userData = { symbol: atom.symbol, id: atom.id };
      
      group.add(mesh);
      initialPositions.current.set(atom.id, pos.clone());
    });

    // Add Bonds
    structure.bonds.forEach(bond => {
       const atom1 = structure.atoms.find(a => a.id === bond.source);
       const atom2 = structure.atoms.find(a => a.id === bond.target);
       
       if (atom1 && atom2) {
           const p1 = new THREE.Vector3(atom1.x, atom1.y, atom1.z).sub(center);
           const p2 = new THREE.Vector3(atom2.x, atom2.y, atom2.z).sub(center);
           
           const distance = p1.distanceTo(p2);
           const mid = p1.clone().add(p2).multiplyScalar(0.5);
           
           const geometry = new THREE.CylinderGeometry(0.08, 0.08, distance, 8);
           const material = new THREE.MeshLambertMaterial({ color: 0x888888 });
           const mesh = new THREE.Mesh(geometry, material);
           
           mesh.position.copy(mid);
           mesh.lookAt(p2);
           mesh.rotateX(Math.PI / 2); // Cylinder aligns along Y by default
           
           // Tag bond with atom IDs so we can find it later
           mesh.userData = { source: bond.source, target: bond.target, type: 'bond' };
           
           group.add(mesh);
       }
    });

  }, [structure]);

  // Animation Logic
  const updateVibrations = (t: number) => {
      if (!atomsMeshRef.current || !structure || !activeFeature) return;

      const feature = activeFeature;
      const group = atomsMeshRef.current;
      const isStretch = feature.type === 'stretch';
      const isBend = feature.type === 'bend' || feature.type === 'scissoring' || feature.type === 'wag';
      
      // Determine relevant atoms based on activeBonds string from Gemini (e.g. "C-H")
      // This is a heuristic matching.
      const relevantBondTypes = feature.activeBonds || [];
      
      // Reset all atoms first? No, we calculate offsets from initial.
      
      group.children.forEach(child => {
          if (child.userData.type === 'bond') {
             // It's a bond. We might scale it if it's a stretch.
             // But simpler to move atoms and let bonds drift (or re-orient bonds every frame - expensive).
             // Visual hack: Just move atoms.
          } else if (child.userData.id) {
              // It's an atom
              const atomId = child.userData.id;
              const atomData = structure.atoms.find(a => a.id === atomId);
              if (!atomData) return;

              const basePos = initialPositions.current.get(atomId);
              if (!basePos) return;

              // Check if this atom is part of the active vibration
              // Find connected bonds
              const connectedBonds = structure.bonds.filter(b => b.source === atomId || b.target === atomId);
              let isActive = false;
              let connectedAtomSymbol = '';
              let connectedAtomId = -1;

              for (const bond of connectedBonds) {
                  const otherId = bond.source === atomId ? bond.target : bond.source;
                  const otherAtom = structure.atoms.find(a => a.id === otherId);
                  if (otherAtom) {
                      // Check if this pair matches "C-H" or "H-C"
                      const pair = `${atomData.symbol}-${otherAtom.symbol}`;
                      const pairRev = `${otherAtom.symbol}-${atomData.symbol}`;
                      if (relevantBondTypes.some(b => b.includes(pair) || b.includes(pairRev))) {
                          isActive = true;
                          connectedAtomSymbol = otherAtom.symbol;
                          connectedAtomId = otherId;
                          break;
                      }
                  }
              }

              if (isActive) {
                 const offset = new THREE.Vector3();
                 
                 if (isStretch) {
                     // Move along the bond vector
                     const otherPos = initialPositions.current.get(connectedAtomId);
                     if (otherPos) {
                        const direction = basePos.clone().sub(otherPos).normalize();
                        // H atoms move more than C atoms usually
                        const amplitude = atomData.symbol === 'H' ? 0.2 : 0.05; 
                        offset.add(direction.multiplyScalar(Math.sin(t * 10) * amplitude));
                     }
                 } else if (isBend) {
                     // Move perpendicular? Or just jiggle randomly?
                     // Simple implementation: Circular motion around base
                     const amplitude = 0.15;
                     offset.x = Math.sin(t * 8) * amplitude;
                     offset.y = Math.cos(t * 8) * amplitude;
                 }
                 
                 child.position.copy(basePos.clone().add(offset));
                 
                 // Highlight material
                 (child as THREE.Mesh).material = new THREE.MeshLambertMaterial({
                     color: getAtomColor(atomData.symbol),
                     emissive: 0xffffff,
                     emissiveIntensity: 0.5 + Math.sin(t * 10) * 0.2
                 });

              } else {
                  child.position.copy(basePos);
                  // Reset material
                   (child as THREE.Mesh).material = new THREE.MeshLambertMaterial({
                     color: getAtomColor(atomData.symbol),
                     emissive: getAtomColor(atomData.symbol),
                     emissiveIntensity: 0.1
                 });
              }
          }
      });
  };

  if (!structure) {
    return (
        <div className="w-full h-full flex items-center justify-center text-gray-600 bg-space-900 border border-space-800 rounded-lg">
            <span className="text-xs uppercase tracking-widest opacity-50">No Structure Data</span>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-space-800 bg-space-900 group">
       <div ref={mountRef} className="w-full h-full" />
       
       <div className="absolute top-2 left-2 pointer-events-none">
          <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider bg-space-950/80 px-2 py-1 rounded inline-block">
             3D Structure: <span className="text-gray-300 font-bold">{structure.name}</span>
          </div>
       </div>

       {activeFeature && (
           <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
              <div className="inline-block bg-space-950/90 border border-accent-cyan/30 px-4 py-2 rounded-full backdrop-blur-md">
                 <p className="text-accent-cyan text-xs font-bold uppercase tracking-wider animate-pulse">
                    {activeFeature.description}
                 </p>
                 <p className="text-[10px] text-gray-400">
                    {activeFeature.type.toUpperCase()} • {activeFeature.activeBonds.join(', ')}
                 </p>
              </div>
           </div>
       )}
    </div>
  );
};

export default MoleculeViewer;