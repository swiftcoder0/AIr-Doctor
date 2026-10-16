import * as THREE from 'three';

export interface ModelPartRef {
  id: string;
  name: string;
  meshGroup: THREE.Group;
  defaultPosition: THREE.Vector3;
  explodedOffset: THREE.Vector3;
}

export function buildGenericJetModel(): { root: THREE.Group; parts: Map<string, ModelPartRef> } {
  const root = new THREE.Group();
  root.name = 'GenericJetRoot';
  const parts = new Map<string, ModelPartRef>();

  // Aeronautical PBR Materials
  const fuselageMat = new THREE.MeshStandardMaterial({
    color: 0x8a9ba8,
    metalness: 0.35,
    roughness: 0.38,
  });

  const wingMat = new THREE.MeshStandardMaterial({
    color: 0x768796,
    metalness: 0.38,
    roughness: 0.42,
  });

  const canopyMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e3a5f,
    metalness: 0.1,
    roughness: 0.08,
    transmission: 0.6,
    transparent: true,
    opacity: 0.88,
  });

  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0x333b45,
    metalness: 0.75,
    roughness: 0.28,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    metalness: 0.5,
    roughness: 0.3,
  });

  const gearMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.6,
    roughness: 0.5,
  });

  // Helper to register parts
  const registerPart = (id: string, name: string, group: THREE.Group, offset: [number, number, number]) => {
    parts.set(id, {
      id,
      name,
      meshGroup: group,
      defaultPosition: group.position.clone(),
      explodedOffset: new THREE.Vector3(...offset),
    });
    root.add(group);
  };

  // 1. Radome & Nose Section
  const radomeGroup = new THREE.Group();
  radomeGroup.name = 'jet-radome';
  const radomeGeo = new THREE.ConeGeometry(0.55, 1.8, 32);
  radomeGeo.rotateX(Math.PI / 2);
  const radomeMesh = new THREE.Mesh(radomeGeo, titaniumMat);
  radomeMesh.position.set(0, 0, 3.2);
  radomeGroup.add(radomeMesh);
  registerPart('jet-radome', 'Radar & Forward Radome', radomeGroup, [0, 0, 1.2]);

  // 2. Fuselage & Canopy Core
  const fuselageGroup = new THREE.Group();
  fuselageGroup.name = 'jet-ecs';
  const bodyGeo = new THREE.CylinderGeometry(0.65, 0.75, 4.2, 32);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMesh = new THREE.Mesh(bodyGeo, fuselageMat);
  bodyMesh.position.set(0, 0, 0.4);
  fuselageGroup.add(bodyMesh);

  // Canopy
  const canopyGeo = new THREE.SphereGeometry(0.5, 32, 16);
  canopyGeo.scale(0.8, 0.6, 2.0);
  const canopyMesh = new THREE.Mesh(canopyGeo, canopyMat);
  canopyMesh.position.set(0, 0.45, 1.2);
  fuselageGroup.add(canopyMesh);
  registerPart('jet-ecs', 'Fuselage & Environmental Systems', fuselageGroup, [0, 0.5, 0]);

  // 3. Air Intake Ramps
  const intakeGroup = new THREE.Group();
  intakeGroup.name = 'jet-intake';
  const leftIntakeGeo = new THREE.BoxGeometry(0.35, 0.45, 1.6);
  const leftIntake = new THREE.Mesh(leftIntakeGeo, fuselageMat);
  leftIntake.position.set(-0.75, -0.15, 0.8);
  const rightIntake = leftIntake.clone();
  rightIntake.position.set(0.75, -0.15, 0.8);
  intakeGroup.add(leftIntake, rightIntake);
  registerPart('jet-intake', 'Air Intake & Compression Duct', intakeGroup, [0, -0.6, 0.6]);

  // 4. Main Compound Wings
  const wingGroup = new THREE.Group();
  wingGroup.name = 'jet-wings';
  // Left wing
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(-3.2, -1.8);
  wingShape.lineTo(-3.0, -2.4);
  wingShape.lineTo(0, -1.2);
  wingShape.closePath();
  const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  wingGeo.rotateX(-Math.PI / 2);
  const leftWingMesh = new THREE.Mesh(wingGeo, wingMat);
  leftWingMesh.position.set(-0.6, 0.0, 1.0);
  
  // Right wing
  const rightWingMesh = leftWingMesh.clone();
  rightWingMesh.scale.set(-1, 1, 1);
  rightWingMesh.position.set(0.6, 0.0, 1.0);
  wingGroup.add(leftWingMesh, rightWingMesh);
  registerPart('jet-wings', 'Compound Wing & Spar Assembly', wingGroup, [0, 0, -0.8]);

  // 5. Elevons & Flight Control Surfaces
  const controlGroup = new THREE.Group();
  controlGroup.name = 'jet-control-surfaces';
  const aileronGeo = new THREE.BoxGeometry(1.6, 0.06, 0.35);
  const leftAileron = new THREE.Mesh(aileronGeo, accentMat);
  leftAileron.position.set(-2.0, -0.05, -1.6);
  const rightAileron = leftAileron.clone();
  rightAileron.position.set(2.0, -0.05, -1.6);
  controlGroup.add(leftAileron, rightAileron);
  registerPart('jet-control-surfaces', 'Aileron & Elevon Actuators', controlGroup, [0, -0.3, -1.0]);

  // 6. Twin Turbofan Engines & Exhaust
  const engineGroup = new THREE.Group();
  engineGroup.name = 'jet-engine';
  const engineGeo = new THREE.CylinderGeometry(0.42, 0.38, 2.8, 32);
  engineGeo.rotateX(Math.PI / 2);
  const leftEngine = new THREE.Mesh(engineGeo, titaniumMat);
  leftEngine.position.set(-0.45, 0.0, -1.6);
  const rightEngine = leftEngine.clone();
  rightEngine.position.set(0.45, 0.0, -1.6);
  
  // Nozzles
  const nozzleGeo = new THREE.CylinderGeometry(0.35, 0.32, 0.6, 32);
  nozzleGeo.rotateX(Math.PI / 2);
  const leftNozzle = new THREE.Mesh(nozzleGeo, accentMat);
  leftNozzle.position.set(-0.45, 0.0, -3.1);
  const rightNozzle = leftNozzle.clone();
  rightNozzle.position.set(0.45, 0.0, -3.1);

  engineGroup.add(leftEngine, rightEngine, leftNozzle, rightNozzle);
  registerPart('jet-engine', 'Turbofan Propulsion Unit', engineGroup, [0, 0, -1.4]);

  // 7. Vertical Stabilizers (Twin canted fins)
  const tailGroup = new THREE.Group();
  tailGroup.name = 'jet-tail';
  const finGeo = new THREE.BoxGeometry(0.08, 1.6, 1.4);
  const leftFin = new THREE.Mesh(finGeo, fuselageMat);
  leftFin.position.set(-0.75, 1.0, -1.8);
  leftFin.rotation.z = -0.22; // canted
  const rightFin = leftFin.clone();
  rightFin.position.set(0.75, 1.0, -1.8);
  rightFin.rotation.z = 0.22;
  tailGroup.add(leftFin, rightFin);
  registerPart('jet-tail', 'Vertical Stabilizer & Rudder', tailGroup, [0, 1.0, -0.5]);

  // 8. Main Hydraulic Circuit & FCS Avionics Bay
  const hydGroup = new THREE.Group();
  hydGroup.name = 'jet-hydraulics';
  const hydBox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.8), accentMat);
  hydBox.position.set(0, -0.2, -0.6);
  hydGroup.add(hydBox);
  registerPart('jet-hydraulics', 'Main Hydraulic Circuit', hydGroup, [0, -0.8, 0]);

  // 9. Digital FCS Bay
  const fcsGroup = new THREE.Group();
  fcsGroup.name = 'jet-fcs';
  const fcsBox = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.6), accentMat);
  fcsBox.position.set(0, 0.2, 0.1);
  fcsGroup.add(fcsBox);
  registerPart('jet-fcs', 'Digital Flight Control Avionics', fcsGroup, [0, 0.8, 0]);

  // 10. Landing Gear Assembly
  const gearGroup = new THREE.Group();
  gearGroup.name = 'jet-gear';
  const noseStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1), gearMat);
  noseStrut.position.set(0, -0.85, 1.8);
  const noseWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.14), gearMat);
  noseWheel.rotateZ(Math.PI / 2);
  noseWheel.position.set(0, -1.35, 1.8);
  gearGroup.add(noseStrut, noseWheel);
  registerPart('jet-gear', 'Landing Gear & Retract System', gearGroup, [0, -1.0, 0]);

  return { root, parts };
}

export function buildGenericHelicopterModel(): {
  root: THREE.Group;
  parts: Map<string, ModelPartRef>;
  rotorMesh: THREE.Group;
  tailRotorMesh: THREE.Group;
} {
  const root = new THREE.Group();
  root.name = 'GenericHeliRoot';
  const parts = new Map<string, ModelPartRef>();

  // Materials
  const heliBodyMat = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    metalness: 0.35,
    roughness: 0.42,
  });

  const rotorMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.6,
    roughness: 0.3,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e3a5f,
    metalness: 0.15,
    roughness: 0.1,
    transmission: 0.65,
    transparent: true,
    opacity: 0.88,
  });

  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    metalness: 0.7,
    roughness: 0.25,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    metalness: 0.45,
    roughness: 0.35,
  });

  const registerPart = (id: string, name: string, group: THREE.Group, offset: [number, number, number]) => {
    parts.set(id, {
      id,
      name,
      meshGroup: group,
      defaultPosition: group.position.clone(),
      explodedOffset: new THREE.Vector3(...offset),
    });
    root.add(group);
  };

  // 1. Cabin & Cockpit Fuselage
  const cabinGroup = new THREE.Group();
  cabinGroup.name = 'heli-avionics';
  const cabinGeo = new THREE.SphereGeometry(1.0, 32, 16);
  cabinGeo.scale(0.85, 0.9, 2.2);
  const cabinMesh = new THREE.Mesh(cabinGeo, heliBodyMat);
  cabinMesh.position.set(0, 0, 0.4);
  cabinGroup.add(cabinMesh);

  // Cockpit Glass
  const glassGeo = new THREE.SphereGeometry(0.85, 32, 16);
  glassGeo.scale(0.8, 0.75, 1.2);
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.position.set(0, 0.2, 1.6);
  cabinGroup.add(glassMesh);
  registerPart('heli-avionics', 'Cockpit Avionics & Mission Pod', cabinGroup, [0, 0, 1.0]);

  // 2. Engine Cowling & Power Plant
  const engineGroup = new THREE.Group();
  engineGroup.name = 'heli-engine';
  const engineCowling = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.75, 2.2), titaniumMat);
  engineCowling.position.set(0, 0.9, 0.2);
  // Dual Exhaust pipes
  const exhaustGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.6, 16);
  exhaustGeo.rotateZ(Math.PI / 4);
  const leftExhaust = new THREE.Mesh(exhaustGeo, accentMat);
  leftExhaust.position.set(-0.65, 0.95, -0.6);
  const rightExhaust = leftExhaust.clone();
  rightExhaust.rotation.z = -Math.PI / 4;
  rightExhaust.position.set(0.65, 0.95, -0.6);
  engineGroup.add(engineCowling, leftExhaust, rightExhaust);
  registerPart('heli-engine', 'Turboshaft Power Unit', engineGroup, [0, 0.8, 0]);

  // 3. Main Transmission & Gearbox
  const gearboxGroup = new THREE.Group();
  gearboxGroup.name = 'heli-gearbox';
  const gearboxMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.7, 24), titaniumMat);
  gearboxMesh.position.set(0, 1.2, 0.3);
  gearboxGroup.add(gearboxMesh);
  registerPart('heli-gearbox', 'Main Transmission & Gearbox', gearboxGroup, [0, 0.6, 0]);

  // 4. Main Rotor Swashplate & Hub
  const hubGroup = new THREE.Group();
  hubGroup.name = 'heli-main-rotor';
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.9, 16), titaniumMat);
  mast.position.set(0, 1.7, 0.3);
  const swashplate = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.16, 24), accentMat);
  swashplate.position.set(0, 1.8, 0.3);
  hubGroup.add(mast, swashplate);
  registerPart('heli-main-rotor', 'Main Rotor Head & Swashplate', hubGroup, [0, 1.0, 0]);

  // Rotor Blades Group (rotates continuously)
  const rotorGroup = new THREE.Group();
  rotorGroup.position.set(0, 2.15, 0.3);
  for (let b = 0; b < 4; b++) {
    const angle = (b * Math.PI) / 2;
    const bladeGeo = new THREE.BoxGeometry(0.24, 0.04, 3.8);
    bladeGeo.translate(0, 0, 1.9);
    const bladeMesh = new THREE.Mesh(bladeGeo, rotorMat);
    bladeMesh.rotation.y = angle;
    rotorGroup.add(bladeMesh);
  }
  const bladeSubGroup = new THREE.Group();
  bladeSubGroup.name = 'heli-blades';
  bladeSubGroup.add(rotorGroup);
  registerPart('heli-blades', 'Composite Rotor Blade Set', bladeSubGroup, [0, 1.2, 0]);

  // 5. Tail Boom & Fenestron / Tail Rotor
  const tailGroup = new THREE.Group();
  tailGroup.name = 'heli-tail-rotor';
  const tailBoom = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.55, 4.2, 24), heliBodyMat);
  tailBoom.rotateX(Math.PI / 2);
  tailBoom.position.set(0, 0.45, -2.4);
  
  // Vertical tail fin
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.9), heliBodyMat);
  tailFin.position.set(0, 1.1, -4.6);
  
  // Tail rotor
  const tailRotorPivot = new THREE.Group();
  tailRotorPivot.position.set(0.12, 1.4, -4.6);
  for (let tb = 0; tb < 2; tb++) {
    const tblade = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 1.2), accentMat);
    tblade.rotation.x = (tb * Math.PI) / 2;
    tailRotorPivot.add(tblade);
  }

  tailGroup.add(tailBoom, tailFin, tailRotorPivot);
  registerPart('heli-tail-rotor', 'Tail Rotor Drive & Fenestron', tailGroup, [0, 0.5, -1.2]);

  // 6. Dual Hydraulic Booster
  const hydGroup = new THREE.Group();
  hydGroup.name = 'heli-hydraulics';
  const hydCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.6, 16), accentMat);
  hydCyl.position.set(0.4, 0.6, 0.4);
  hydGroup.add(hydCyl);
  registerPart('heli-hydraulics', 'Dual Hydraulic Boost System', hydGroup, [0.8, 0, 0]);

  // 7. Landing Skids / Shock Struts
  const skidGroup = new THREE.Group();
  skidGroup.name = 'heli-skids';
  const skidGeo = new THREE.CylinderGeometry(0.08, 0.08, 4.4, 16);
  skidGeo.rotateX(Math.PI / 2);
  const leftSkid = new THREE.Mesh(skidGeo, titaniumMat);
  leftSkid.position.set(-1.0, -1.15, 0.2);
  const rightSkid = leftSkid.clone();
  rightSkid.position.set(1.0, -1.15, 0.2);
  // Cross tubes
  const crossGeo = new THREE.CylinderGeometry(0.07, 0.07, 2.0, 16);
  crossGeo.rotateZ(Math.PI / 2);
  const frontCross = new THREE.Mesh(crossGeo, titaniumMat);
  frontCross.position.set(0, -0.85, 1.2);
  const rearCross = frontCross.clone();
  rearCross.position.set(0, -0.85, -0.8);
  skidGroup.add(leftSkid, rightSkid, frontCross, rearCross);
  registerPart('heli-skids', 'Landing Gear Shock Struts', skidGroup, [0, -0.8, 0]);

  return {
    root,
    parts,
    rotorMesh: rotorGroup,
    tailRotorMesh: tailRotorPivot,
  };
}
