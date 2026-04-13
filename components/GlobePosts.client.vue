<template>
  <div class="relative w-full" :class="fullScreen ? 'h-[calc(100vh-5rem)] min-h-[560px]' : 'h-[560px]'">
    <div
      ref="containerRef"
      :class="[
        'relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_50%_45%,rgba(107,147,201,0.12),transparent_55%),var(--color-bg)]',
        fullScreen ? 'rounded-none border-0' : 'rounded-[var(--radius-lg)] border border-edge',
      ]"
    />
    <aside
      v-if="selectedPosts.length > 0"
      class="absolute right-4 top-4 z-10 max-h-[calc(100%-2rem)] w-[min(360px,calc(100%-2rem))] overflow-auto rounded-2xl border border-edge bg-[#0b1018]/92 p-4 backdrop-blur-md"
    >
      <div class="space-y-2">
        <h2 class="text-xl font-bold tracking-tight text-fg">{{ selectedLocation }}</h2>
        <p class="text-xs text-fg-soft">{{ selectedLatLng }}</p>
        <ul class="mt-3 space-y-3">
          <li v-for="post in selectedPosts" :key="post._path">
            <NuxtLink :to="post._path" class="block rounded-xl border border-edge bg-fg/[0.03] p-3 transition-all hover:border-white/10 hover:bg-fg/[0.06]">
              <p class="font-semibold text-fg">{{ post.title }}</p>
              <p v-if="post.description" class="mt-1 text-sm text-fg-soft">{{ post.description }}</p>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
type GlobePost = {
  _path: string;
  title: string;
  description?: string;
  location: string;
  latitude: number;
  longitude: number;
  tags?: string[];
};
type GeoDetail = {
  province: string;
  prefecture: string;
  county: string;
  township: string;
  village: string;
};

const props = withDefaults(
  defineProps<{ posts: GlobePost[]; fullScreen?: boolean }>(),
  { fullScreen: false },
);
const colorMode = useColorMode();
const containerRef = ref<HTMLDivElement | null>(null);
const selectedLocation = ref("");
const selectedPosts = ref<GlobePost[]>([]);
const selectedLatLng = ref("");
const geoCache = new Map<string, GeoDetail>();

let renderer: any = null;
let scene: any = null;
let camera: any = null;
let controls: any = null;
let globe: any = null;
let frameId = 0;
let mounted = true;
let isDragging = false;
let resizeObserver: ResizeObserver | null = null;
let THREERef: any = null;
let OrbitControlsRef: any = null;
let ThreeGlobeRef: any = null;
let EffectComposerRef: any = null;
let RenderPassRef: any = null;
let UnrealBloomPassRef: any = null;
let composer: any = null;
let fallbackSphere: any = null;
let blackHoleGroup: any = null;
let whiteHoleGroup: any = null;
let lensPlane: any = null;
let holeMix = 1;

const config = {
  diskParticleCount: 8000,
  whiteJetParticleCount: 2800,
  bloomStrength: 1.45,
  bloomRadius: 0.62,
  bloomThreshold: 0.08,
  holeTransitionSeconds: 2,
  lensStrength: 0.085,
};

const grouped = computed(() => {
  const map = new Map<string, GlobePost[]>();
  for (const p of props.posts) {
    const key = `${p.location}|${p.latitude.toFixed(4)}|${p.longitude.toFixed(4)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  return [...map.entries()].map(([key, posts]) => {
    const [location, lat, lng] = key.split("|");
    return { key, location, lat: Number(lat), lng: Number(lng), posts, size: 0.6 };
  });
});

function pointColor(tags?: string[]) {
  return tags?.some((t) => /设计|排版|界面/.test(t)) ? "#c2873a" : "#6b93c9";
}

function createBlackHole() {
  const group = new THREERef.Group();

  // Event horizon: physically "dark" center
  const core = new THREERef.Mesh(
    new THREERef.SphereGeometry(26, 128, 128),
    new THREERef.MeshStandardMaterial({
      color: 0x020202,
      roughness: 1,
      metalness: 0,
    }),
  );
  group.add(core);

  // Accretion ring shell: semi-transparent hot plasma glow
  const ring = new THREERef.Mesh(
    new THREERef.TorusGeometry(72, 8, 48, 360),
    new THREERef.MeshBasicMaterial({
      color: 0x87b8ff,
      transparent: true,
      opacity: 0.4,
      blending: THREERef.AdditiveBlending,
      depthWrite: false,
    }),
  );
  (ring.material as any).userData = { baseOpacity: 0.4 };
  ring.rotation.x = Math.PI * 0.56;
  group.add(ring);

  // Particle accretion disk (5000+) with Doppler-like warm/cold split
  const particleCount = config.diskParticleCount;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const speeds = new Float32Array(particleCount);
  for (let i = 0; i < particleCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 48 + Math.random() * 120;
    const y = (Math.random() - 0.5) * 9;
    positions[i * 3] = Math.cos(a) * r;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(a) * r;
    // simple Doppler proxy: approaching side cooler/blue, receding side hotter/orange
    const doppler = (Math.sin(a) + 1) * 0.5;
    colors[i * 3] = 0.55 + doppler * 0.45;
    colors[i * 3 + 1] = 0.45 + doppler * 0.35;
    colors[i * 3 + 2] = 0.8 - doppler * 0.55;
    speeds[i] = 0.001 + (1 / Math.max(r, 1)) * 0.14;
  }
  const geo = new THREERef.BufferGeometry();
  geo.setAttribute("position", new THREERef.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREERef.BufferAttribute(colors, 3));
  const points = new THREERef.Points(
    geo,
    new THREERef.PointsMaterial({
      size: 1.65,
      vertexColors: true,
      transparent: true,
      opacity: 0.66,
      sizeAttenuation: true,
      blending: THREERef.AdditiveBlending,
      depthWrite: false,
    }),
  );
  (points.material as any).userData = { baseOpacity: 0.66 };
  (points as any).userData.speeds = speeds;
  group.add(points);

  // Bright hotspots inside accretion disk (friction flashes)
  for (let i = 0; i < 7; i++) {
    const flash = new THREERef.Mesh(
      new THREERef.SphereGeometry(2 + Math.random() * 2, 20, 20),
      new THREERef.MeshBasicMaterial({
        color: i % 2 ? 0xffd9a8 : 0xbad6ff,
        transparent: true,
        opacity: 0.72,
        blending: THREERef.AdditiveBlending,
      }),
    );
    (flash.material as any).userData = { baseOpacity: 0.72 };
    const rr = 46 + Math.random() * 34;
    const aa = (i / 7) * Math.PI * 2;
    flash.position.set(Math.cos(aa) * rr, (Math.random() - 0.5) * 4, Math.sin(aa) * rr);
    (flash as any).userData.phase = Math.random() * Math.PI * 2;
    group.add(flash);
  }

  group.position.set(0, 0, -460);
  group.userData = { ring, points, core };
  return group;
}

function createWhiteHole() {
  const group = new THREERef.Group();

  const whiteCore = new THREERef.Mesh(
    new THREERef.SphereGeometry(25, 128, 128),
    new THREERef.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        uniform float uTime;
        void main() {
          // boiling turbulence for white-hole core
          float n = sin(vPos.x * 0.21 + uTime * 2.2) * sin(vPos.y * 0.27 - uTime * 1.8) * sin(vPos.z * 0.23 + uTime * 2.4);
          float glow = 0.82 + n * 0.18;
          vec3 col = mix(vec3(1.0, 0.96, 0.86), vec3(0.84, 0.91, 1.0), clamp(vPos.y * 0.02 + 0.5, 0.0, 1.0));
          gl_FragColor = vec4(col * glow, 0.98);
        }
      `,
    }),
  );
  group.add(whiteCore);

  // Radial volumetric-light-like beams
  const beamCount = 56;
  for (let i = 0; i < beamCount; i++) {
    const beam = new THREERef.Mesh(
      new THREERef.CylinderGeometry(0.38, 1.8, 150, 10, 1, true),
      new THREERef.MeshBasicMaterial({
        color: i % 3 === 0 ? 0xfff4d6 : 0xc9dcff,
        transparent: true,
        opacity: 0.12,
        blending: THREERef.AdditiveBlending,
        depthWrite: false,
      }),
    );
    (beam.material as any).userData = { baseOpacity: 0.12 };
    beam.position.set(0, 0, 0);
    beam.rotation.z = Math.PI / 2;
    beam.rotation.y = (i / beamCount) * Math.PI * 2;
    beam.rotation.x = (Math.random() - 0.5) * 0.4;
    group.add(beam);
  }

  // Outward particle jets (2000+)
  const pCount = config.whiteJetParticleCount;
  const pos = new Float32Array(pCount * 3);
  const vel = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const b = Math.random() * Math.PI;
    const r = 24 + Math.random() * 10;
    const x = Math.sin(b) * Math.cos(a);
    const y = Math.cos(b);
    const z = Math.sin(b) * Math.sin(a);
    pos[i * 3] = x * r;
    pos[i * 3 + 1] = y * r;
    pos[i * 3 + 2] = z * r;
    const speed = 0.12 + Math.random() * 0.22;
    vel[i * 3] = x * speed;
    vel[i * 3 + 1] = y * speed;
    vel[i * 3 + 2] = z * speed;
  }
  const g = new THREERef.BufferGeometry();
  g.setAttribute("position", new THREERef.BufferAttribute(pos, 3));
  const jet = new THREERef.Points(
    g,
    new THREERef.PointsMaterial({
      color: 0xe6f0ff,
      size: 1.75,
      transparent: true,
      opacity: 0.72,
      sizeAttenuation: true,
      blending: THREERef.AdditiveBlending,
      depthWrite: false,
    }),
  );
  (jet.material as any).userData = { baseOpacity: 0.72 };
  (jet as any).userData.vel = vel;
  group.add(jet);

  group.position.set(0, 0, -460);
  group.userData = { whiteCore, jet };
  return group;
}

function createLensDistortionPlane() {
  const plane = new THREERef.Mesh(
    new THREERef.PlaneGeometry(1600, 900, 1, 1),
    new THREERef.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uMix: { value: 1.0 },
        uStrength: { value: config.lensStrength },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform float uMix;
        uniform float uStrength;
        void main() {
          vec2 c = vUv - vec2(0.5);
          float r = length(c);
          // simplistic gravitational lensing: stronger near event horizon band
          float horizonBand = smoothstep(0.06, 0.24, r) * (1.0 - smoothstep(0.24, 0.45, r));
          float bend = horizonBand * uStrength * (0.6 + 0.4 * sin(uTime * 0.8));
          vec2 warped = c / (1.0 + bend * 18.0);
          float ray = smoothstep(0.42, 0.0, r) * (0.5 + 0.5 * sin(atan(warped.y, warped.x) * 14.0 + uTime * 2.5));
          vec3 col = mix(vec3(0.16, 0.24, 0.4), vec3(0.95, 0.95, 1.0), ray);
          float alpha = horizonBand * 0.34 * uMix;
          gl_FragColor = vec4(col, alpha);
        }
      `,
    }),
  );
  plane.position.set(0, 0, -500);
  return plane;
}

function buildFallbackEarthTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, "#25384f");
  bg.addColorStop(1, "#0f2236");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // rough landmass blobs
  ctx.fillStyle = "rgba(90, 140, 95, 0.58)";
  for (let i = 0; i < 22; i++) {
    const x = (i * 89) % canvas.width;
    const y = (i * 41) % canvas.height;
    const w = 90 + ((i * 23) % 70);
    const h = 36 + ((i * 19) % 40);
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, (i % 6) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // boundary-like line grid
  ctx.strokeStyle = "rgba(220,235,255,0.25)";
  ctx.lineWidth = 1;
  for (let y = 24; y < canvas.height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  for (let x = 32; x < canvas.width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  return canvas.toDataURL("image/png");
}

function tryApplySatelliteTexture() {
  if (!globe || !THREERef) return;
  const material = globe.globeMaterial?.();
  if (!material) return;
  const loader = new THREERef.TextureLoader();
  loader.load(
    "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg",
    (tex: any) => {
      material.map = tex;
      material.needsUpdate = true;
      if (fallbackSphere) fallbackSphere.visible = false;
    },
    undefined,
    () => {},
  );
  loader.load(
    "https://cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png",
    (bump: any) => {
      material.bumpMap = bump;
      material.bumpScale = 0.6;
      material.needsUpdate = true;
    },
    undefined,
    () => {},
  );
}

async function loadGeoDetail(lat: number, lng: number) {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geoCache.has(key)) {
    return;
  }
  try {
    const res = await $fetch<any>("https://nominatim.openstreetmap.org/reverse", {
      query: { format: "jsonv2", lat, lon: lng, "accept-language": "zh-CN" },
      headers: { "User-Agent": "PersonalBlog/1.0" },
    });
    const address = res?.address ?? {};
    const detail: GeoDetail = {
      province: String(address.state ?? ""),
      prefecture: String(address.city ?? address.state_district ?? address.region ?? ""),
      county: String(address.county ?? address.city_district ?? address.district ?? ""),
      township: String(address.town ?? address.township ?? address.suburb ?? address.borough ?? ""),
      village: String(address.village ?? address.hamlet ?? address.neighbourhood ?? address.quarter ?? ""),
    };
    geoCache.set(key, detail);
  } catch {
    // ignore reverse geocode failures for globe interaction
  }
}

function initGlobe() {
  if (
    !containerRef.value ||
    !THREERef ||
    !OrbitControlsRef ||
    !ThreeGlobeRef ||
    !EffectComposerRef ||
    !RenderPassRef ||
    !UnrealBloomPassRef
  ) return;
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  if (width < 10 || height < 10) {
    requestAnimationFrame(() => {
      if (mounted) initGlobe();
    });
    return;
  }
  scene = new THREERef.Scene();
  camera = new THREERef.PerspectiveCamera(45, width / height, 0.1, 2000);
  camera.position.z = 300;
  renderer = new THREERef.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  containerRef.value.appendChild(renderer.domElement);
  scene.add(new THREERef.AmbientLight(0xffffff, 0.9));
  const dir = new THREERef.DirectionalLight(0x9bb8dd, 1.2);
  dir.position.set(-240, 180, 280);
  scene.add(dir);

  blackHoleGroup = createBlackHole();
  whiteHoleGroup = createWhiteHole();
  whiteHoleGroup.traverse((obj: any) => {
    if (obj.material) obj.material.opacity = 0;
  });
  lensPlane = createLensDistortionPlane();
  scene.add(blackHoleGroup);
  scene.add(whiteHoleGroup);
  scene.add(lensPlane);

  // Always render a basic sphere first so users can see a globe immediately.
  fallbackSphere = new THREERef.Mesh(
    new THREERef.SphereGeometry(96, 64, 64),
    new THREERef.MeshPhongMaterial({
      color: 0x7ea4cf,
      transparent: true,
      opacity: 0.82,
      shininess: 16,
    }),
  );
  scene.add(fallbackSphere);

  globe = new ThreeGlobeRef()
    .globeImageUrl(buildFallbackEarthTexture())
    .showAtmosphere(true)
    .atmosphereColor("#6b93c9")
    .atmosphereAltitude(0.18)
    .showGraticules(true)
    .pointsData(grouped.value)
    .pointAltitude("size")
    .pointRadius(0.9)
    .pointResolution(14)
    .pointColor((d: any) => pointColor(d.posts?.[0]?.tags))
    .onPointClick((d: any) => {
      selectedLocation.value = String(d.location ?? "");
      selectedPosts.value = (d.posts ?? []) as GlobePost[];
      selectedLatLng.value = `${Number(d.lat).toFixed(4)}, ${Number(d.lng).toFixed(4)}`;
      loadGeoDetail(Number(d.lat), Number(d.lng));
    });
  scene.add(globe);
  tryApplySatelliteTexture();
  // Center initial view near China longitude.
  globe.rotation.y = -1.85;

  composer = new EffectComposerRef(renderer);
  composer.setSize(width, height);
  const renderPass = new RenderPassRef(scene, camera);
  const bloomPass = new UnrealBloomPassRef(
    new THREERef.Vector2(width, height),
    config.bloomStrength,
    config.bloomRadius,
    config.bloomThreshold,
  );
  composer.addPass(renderPass);
  composer.addPass(bloomPass);

  controls = new OrbitControlsRef(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 160;
  controls.maxDistance = 420;
  controls.addEventListener("start", () => (isDragging = true));
  controls.addEventListener("end", () => (isDragging = false));

  const clock = new THREERef.Clock();
  const animate = () => {
    if (!mounted || !renderer || !scene || !camera) return;
    const elapsed = clock.getElapsedTime();
    const dt = Math.min(clock.getDelta(), 0.05);

    // Smooth theme crossfade over ~2s
    const target = colorMode.value === "light" ? 0 : 1;
    const speed = dt / config.holeTransitionSeconds;
    holeMix += (target - holeMix) * Math.min(speed * 8, 1);

    if (blackHoleGroup) {
      blackHoleGroup.rotation.z += dt * 0.08;
      const ring = blackHoleGroup.userData?.ring;
      if (ring) ring.rotation.y += dt * 1.25;
      const points = blackHoleGroup.userData?.points;
      if (points?.geometry?.attributes?.position) {
        const arr = points.geometry.attributes.position.array as Float32Array;
        const speeds = points.userData.speeds as Float32Array;
        for (let i = 0, j = 0; i < arr.length; i += 3, j++) {
          const x = arr[i];
          const z = arr[i + 2];
          const rr = Math.sqrt(x * x + z * z);
          const ang = Math.atan2(z, x) + speeds[j];
          arr[i] = Math.cos(ang) * rr;
          arr[i + 2] = Math.sin(ang) * rr;
        }
        points.geometry.attributes.position.needsUpdate = true;
      }
      blackHoleGroup.traverse((obj: any) => {
        if (obj.material && typeof obj.material.opacity === "number") {
          const baseOpacity = Number(obj.material.userData?.baseOpacity ?? 1);
          obj.material.opacity = Math.max(0, Math.min(1, holeMix)) * baseOpacity;
        }
      });
    }

    if (whiteHoleGroup) {
      const core = whiteHoleGroup.userData?.whiteCore;
      if (core?.material?.uniforms?.uTime) core.material.uniforms.uTime.value = elapsed;
      const jet = whiteHoleGroup.userData?.jet;
      if (jet?.geometry?.attributes?.position) {
        const arr = jet.geometry.attributes.position.array as Float32Array;
        const vel = jet.userData.vel as Float32Array;
        for (let i = 0; i < arr.length; i += 3) {
          arr[i] += vel[i];
          arr[i + 1] += vel[i + 1];
          arr[i + 2] += vel[i + 2];
          const rr = Math.sqrt(arr[i] * arr[i] + arr[i + 1] * arr[i + 1] + arr[i + 2] * arr[i + 2]);
          if (rr > 260) {
            const inv = 1 / rr;
            arr[i] = arr[i] * inv * 26;
            arr[i + 1] = arr[i + 1] * inv * 26;
            arr[i + 2] = arr[i + 2] * inv * 26;
          }
        }
        jet.geometry.attributes.position.needsUpdate = true;
      }
      const whiteAlpha = 1 - holeMix;
      whiteHoleGroup.traverse((obj: any) => {
        if (obj.material && typeof obj.material.opacity === "number") {
          const baseOpacity = Number(obj.material.userData?.baseOpacity ?? 0.8);
          obj.material.opacity = whiteAlpha * baseOpacity;
        }
      });
    }

    if (lensPlane?.material?.uniforms) {
      lensPlane.material.uniforms.uTime.value = elapsed;
      lensPlane.material.uniforms.uMix.value = holeMix;
    }

    if (!isDragging && globe) globe.rotation.y = -1.85 + clock.getElapsedTime() * 0.025;
    controls?.update();
    if (composer) composer.render();
    else renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  };
  animate();

  const onResize = () => {
    if (!containerRef.value || !camera || !renderer) return;
    const w = containerRef.value.clientWidth;
    const h = containerRef.value.clientHeight;
    if (w < 10 || h < 10) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer?.setSize?.(w, h);
  };
  window.addEventListener("resize", onResize);
  resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(containerRef.value);
  onBeforeUnmount(() => window.removeEventListener("resize", onResize));
}

watch(grouped, (list) => {
  if (globe) globe.pointsData(list);
}, { deep: true });

onMounted(() => {
  mounted = true;
  Promise.all([
    import("three"),
    import("three-globe"),
    import("three/examples/jsm/controls/OrbitControls.js"),
    import("three/examples/jsm/postprocessing/EffectComposer.js"),
    import("three/examples/jsm/postprocessing/RenderPass.js"),
    import("three/examples/jsm/postprocessing/UnrealBloomPass.js"),
  ])
    .then(([threeMod, globeMod, controlsMod, composerMod, renderPassMod, bloomMod]) => {
      THREERef = threeMod;
      ThreeGlobeRef = (globeMod as any).default ?? globeMod;
      OrbitControlsRef = (controlsMod as any).OrbitControls;
      EffectComposerRef = (composerMod as any).EffectComposer;
      RenderPassRef = (renderPassMod as any).RenderPass;
      UnrealBloomPassRef = (bloomMod as any).UnrealBloomPass;
      initGlobe();
    })
    .catch(() => {
      // keep page stable on failed module load
    });
});
onBeforeUnmount(() => {
  mounted = false;
  cancelAnimationFrame(frameId);
  resizeObserver?.disconnect();
  resizeObserver = null;
  controls?.dispose();
  renderer?.dispose();
  composer?.dispose?.();
  if (scene && globe) scene.remove(globe);
  if (scene && fallbackSphere) scene.remove(fallbackSphere);
  if (scene && blackHoleGroup) scene.remove(blackHoleGroup);
  if (scene && whiteHoleGroup) scene.remove(whiteHoleGroup);
  if (scene && lensPlane) scene.remove(lensPlane);
});
</script>
