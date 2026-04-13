<template>
  <div ref="wrapRef" class="hole-bg-root" aria-hidden="true" />
</template>

<script setup lang="ts">
const wrapRef = ref<HTMLDivElement | null>(null);
const colorMode = useColorMode();

let mounted = true;
let frameId = 0;
let resizeObserver: ResizeObserver | null = null;

let THREERef: any = null;
let renderer: any = null;
let scene: any = null;
let camera: any = null;
let coreAiGroup: any = null;
let glowMesh: any = null;
let ringGroup: any = null;
let binaryGroup: any = null;
let coreCenterSprite: any = null;
let coreAIMaterialA: any = null;
let coreAIMaterialI: any = null;
let coreAICenterMaterial: any = null;
let ringMaterialA: any = null;
let ringMaterialB: any = null;
let coreAIParticles: Array<{
  sprite: any;
  radius: number;
  theta: number;
  phi: number;
  speedTheta: number;
  speedPhi: number;
}> = [];
let binaryParticles: Array<{
  sprite: any;
  baseRadius: number;
  angle: number;
  speed: number;
  y: number;
  drift: number;
}> = [];
let digitMaterial0: any = null;
let digitMaterial1: any = null;

function themeColors() {
  if (colorMode.value === "light") {
    return {
      core: 0xf6f7fb,
      glow: 0xc9d7ef,
      ringA: 0x9cb5d9,
      ringB: 0xd2bc9a,
      particle: 0x8aa5ca,
      aiGlyph: 0x2c4a72,
    };
  }
  return {
    core: 0x050607,
    glow: 0x31507a,
    ringA: 0x6b93c9,
    ringB: 0xc2873a,
    particle: 0x7aa0cf,
    aiGlyph: 0xcfe0ff,
  };
}

function applyTheme() {
  if (!THREERef) return;
  const c = themeColors();
  glowMesh?.material?.color?.setHex(c.glow);
  coreAIMaterialA?.color?.setHex(c.aiGlyph);
  coreAIMaterialI?.color?.setHex(c.aiGlyph);
  coreAICenterMaterial?.color?.setHex(c.aiGlyph);
  ringMaterialA?.color?.setHex(c.ringA);
  ringMaterialB?.color?.setHex(c.ringB);
  digitMaterial0?.color?.setHex(c.particle);
  digitMaterial1?.color?.setHex(c.particle);
}

function createDigitTexture(digit: "0" | "1") {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, 128, 128);
  ctx.font = "900 92px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText(digit, 64, 68);
  const tex = new THREERef.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.minFilter = THREERef.LinearFilter;
  tex.magFilter = THREERef.LinearFilter;
  return tex;
}

function createLetterTexture(letter: "A" | "I") {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, 128, 128);
  ctx.font = "900 96px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText(letter, 64, 68);
  const tex = new THREERef.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.minFilter = THREERef.LinearFilter;
  tex.magFilter = THREERef.LinearFilter;
  return tex;
}

function createWordTexture(word: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.clearRect(0, 0, 512, 256);
  ctx.font = "900 190px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.98)";
  ctx.fillText(word, 256, 136);
  const tex = new THREERef.CanvasTexture(canvas);
  tex.needsUpdate = true;
  tex.minFilter = THREERef.LinearFilter;
  tex.magFilter = THREERef.LinearFilter;
  return tex;
}

function initScene() {
  if (!wrapRef.value || !THREERef) return;
  const w = wrapRef.value.clientWidth;
  const h = wrapRef.value.clientHeight;
  if (w < 10 || h < 10) return;

  scene = new THREERef.Scene();
  camera = new THREERef.PerspectiveCamera(48, w / h, 0.1, 1200);
  camera.position.set(0, 4, 210);

  renderer = new THREERef.WebGLRenderer({ antialias: true, alpha: true });
  // Keep desktop crisp but cap DPR for smoother long sessions.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);
  wrapRef.value.appendChild(renderer.domElement);

  scene.add(new THREERef.AmbientLight(0xffffff, 0.55));
  const key = new THREERef.PointLight(0x9ab8dc, 1.2, 800);
  key.position.set(120, 80, 220);
  scene.add(key);
  const fill = new THREERef.PointLight(0xd09f64, 0.65, 600);
  fill.position.set(-140, -80, 120);
  scene.add(fill);

  const c = themeColors();
  // Center sphere formed by A / I sprites.
  const texA = createLetterTexture("A");
  const texI = createLetterTexture("I");
  coreAIMaterialA = new THREERef.SpriteMaterial({
    map: texA,
    color: c.aiGlyph,
    transparent: true,
    opacity: 0.78,
    blending: THREERef.AdditiveBlending,
    depthWrite: false,
  });
  coreAIMaterialI = new THREERef.SpriteMaterial({
    map: texI,
    color: c.aiGlyph,
    transparent: true,
    opacity: 0.78,
    blending: THREERef.AdditiveBlending,
    depthWrite: false,
  });
  const texAI = createWordTexture("AI");
  coreAICenterMaterial = new THREERef.SpriteMaterial({
    map: texAI,
    color: c.aiGlyph,
    transparent: true,
    opacity: 0.92,
    blending: THREERef.AdditiveBlending,
    depthWrite: false,
  });
  coreAiGroup = new THREERef.Group();
  coreAIParticles = [];
  const coreCount = 240;
  for (let i = 0; i < coreCount; i++) {
    const useA = Math.random() > 0.5;
    const sprite = new THREERef.Sprite(useA ? coreAIMaterialA : coreAIMaterialI);
    const radius = 14.5 + (Math.random() - 0.5) * 2.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const size = 1.45 + Math.random() * 0.9;
    sprite.scale.set(size, size, 1);
    sprite.position.set(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    );
    coreAiGroup.add(sprite);
    coreAIParticles.push({
      sprite,
      radius,
      theta,
      phi,
      speedTheta: 0.0008 + Math.random() * 0.002,
      speedPhi: (Math.random() - 0.5) * 0.0005,
    });
  }
  scene.add(coreAiGroup);
  coreCenterSprite = new THREERef.Sprite(coreAICenterMaterial);
  coreCenterSprite.scale.set(21, 10.5, 1);
  coreCenterSprite.position.set(0, 0, 0);
  scene.add(coreCenterSprite);

  glowMesh = new THREERef.Mesh(
    new THREERef.SphereGeometry(32, 42, 42),
    new THREERef.MeshBasicMaterial({
      color: c.glow,
      transparent: true,
      opacity: 0.2,
    }),
  );
  scene.add(glowMesh);

  ringGroup = new THREERef.Group();
  ringGroup.position.y = 0;
  ringMaterialA = new THREERef.MeshPhongMaterial({
    color: c.ringA,
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  ringMaterialB = new THREERef.MeshPhongMaterial({
    color: c.ringB,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });

  const ring1 = new THREERef.Mesh(
    new THREERef.TorusGeometry(62, 6.2, 22, 140),
    ringMaterialA,
  );
  const ring2 = new THREERef.Mesh(
    new THREERef.TorusGeometry(78, 4.1, 18, 140),
    ringMaterialB,
  );
  ring1.rotation.x = Math.PI * 0.58;
  ring1.rotation.y = Math.PI * 0.12;
  ring2.rotation.x = Math.PI * 0.53;
  ring2.rotation.y = -Math.PI * 0.16;
  ringGroup.add(ring1);
  ringGroup.add(ring2);
  scene.add(ringGroup);

  // 0/1 floating particles around the hole.
  const tex0 = createDigitTexture("0");
  const tex1 = createDigitTexture("1");
  digitMaterial0 = new THREERef.SpriteMaterial({
    map: tex0,
    color: c.particle,
    transparent: true,
    opacity: 0.62,
    blending: THREERef.AdditiveBlending,
    depthWrite: false,
  });
  digitMaterial1 = new THREERef.SpriteMaterial({
    map: tex1,
    color: c.particle,
    transparent: true,
    opacity: 0.62,
    blending: THREERef.AdditiveBlending,
    depthWrite: false,
  });
  binaryGroup = new THREERef.Group();
  binaryParticles = [];
  const count = 210;
  for (let i = 0; i < count; i++) {
    const isOne = Math.random() > 0.5;
    const sprite = new THREERef.Sprite(isOne ? digitMaterial1 : digitMaterial0);
    const radius = 58 + Math.random() * 130;
    const angle = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 40;
    sprite.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    const size = 2.2 + Math.random() * 2.8;
    sprite.scale.set(size, size, 1);
    binaryGroup.add(sprite);
    binaryParticles.push({
      sprite,
      baseRadius: radius,
      angle,
      speed: 0.001 + Math.random() * 0.0032,
      y,
      drift: (Math.random() - 0.5) * 0.003,
    });
  }
  scene.add(binaryGroup);
}

function animate() {
  if (!mounted || !renderer || !scene || !camera) return;
  const t = performance.now() * 0.001;

  if (ringGroup) {
    ringGroup.rotation.y = t * 0.2;
    ringGroup.rotation.z = Math.sin(t * 0.45) * 0.05;
  }
  if (coreAiGroup && coreAIParticles.length) {
    coreAiGroup.rotation.y = t * 0.12;
    coreAiGroup.rotation.x = Math.sin(t * 0.3) * 0.05;
    for (const p of coreAIParticles) {
      p.theta += p.speedTheta;
      p.phi += p.speedPhi;
      if (p.phi < 0.18 || p.phi > Math.PI - 0.18) p.speedPhi *= -1;
      const breathe = p.radius + Math.sin(t * 1.2 + p.theta * 2.6) * 0.28;
      p.sprite.position.set(
        breathe * Math.sin(p.phi) * Math.cos(p.theta),
        breathe * Math.cos(p.phi),
        breathe * Math.sin(p.phi) * Math.sin(p.theta),
      );
      p.sprite.material.opacity = 0.68 + Math.sin(t * 2 + p.theta * 3) * 0.2;
    }
  }
  if (coreCenterSprite) {
    coreCenterSprite.scale.setScalar(10.5 + Math.sin(t * 1.35) * 0.45);
    coreCenterSprite.scale.x *= 2;
    coreCenterSprite.material.opacity = 0.82 + Math.sin(t * 1.8) * 0.12;
  }
  if (glowMesh) glowMesh.scale.setScalar(1 + Math.sin(t * 0.9) * 0.04);
  if (binaryParticles.length) {
    for (const p of binaryParticles) {
      p.angle += p.speed;
      p.y += p.drift;
      if (p.y > 24 || p.y < -24) p.drift *= -1;
      const rr = p.baseRadius + Math.sin(t * 0.8 + p.angle * 2.2) * 1.6;
      p.sprite.position.set(Math.cos(p.angle) * rr, p.y, Math.sin(p.angle) * rr);
      p.sprite.material.opacity = 0.45 + Math.sin(t * 1.8 + p.angle * 3.1) * 0.17;
    }
  }

  camera.position.x = Math.sin(t * 0.18) * 7;
  camera.position.y = 4 + Math.cos(t * 0.13) * 2;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  frameId = requestAnimationFrame(animate);
}

function setupResize() {
  if (!wrapRef.value || !camera || !renderer) return;
  const resize = () => {
    if (!wrapRef.value || !camera || !renderer) return;
    const w = wrapRef.value.clientWidth;
    const h = wrapRef.value.clientHeight;
    if (w < 10 || h < 10) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener("resize", resize);
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(wrapRef.value);
  onBeforeUnmount(() => window.removeEventListener("resize", resize));
}

onMounted(async () => {
  mounted = true;
  const threeMod = await import("three");
  THREERef = threeMod;
  initScene();
  applyTheme();
  setupResize();
  animate();
});

watch(() => colorMode.value, () => applyTheme());

onBeforeUnmount(() => {
  mounted = false;
  cancelAnimationFrame(frameId);
  resizeObserver?.disconnect();
  resizeObserver = null;
  renderer?.dispose?.();
  coreAIMaterialA?.map?.dispose?.();
  coreAIMaterialI?.map?.dispose?.();
  coreAICenterMaterial?.map?.dispose?.();
  coreAIMaterialA?.dispose?.();
  coreAIMaterialI?.dispose?.();
  coreAICenterMaterial?.dispose?.();
  digitMaterial0?.map?.dispose?.();
  digitMaterial1?.map?.dispose?.();
  digitMaterial0?.dispose?.();
  digitMaterial1?.dispose?.();
});
</script>

<style scoped>
.hole-bg-root {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
</style>

