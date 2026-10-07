/**
 * Almara Comfort Lab — escena Three.js del colchón.
 *
 * El modelo es procedural: no hay GLB. Se construye con cuatro capas reales (base, núcleo,
 * acogida y tapa acolchada), vivos de terracota, etiqueta bordada y un acolchado con relieve
 * geométrico (displacement) generado desde un mapa de alturas en canvas.
 *
 * Es Three.js directo y no React Three Fiber a propósito: R3F 9 exige `react < 19.3` y el
 * proyecto corre sobre React 19.3, así que su reconciliador sería una dependencia frágil.
 *
 * Reglas de convivencia con la página:
 *  - El arrastre solo usa el eje horizontal en táctil (`touch-action: pan-y` en el canvas),
 *    de modo que el gesto vertical sigue desplazando la página.
 *  - No hay zoom con rueda: la rueda pertenece a Lenis/scroll.
 *  - El bucle de render solo corre mientras la sección está en pantalla.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { esperarScrollQuieto } from "@/lib/scrollQuieto";

export type ViewId = "perspective" | "front" | "top";
export type HotspotId = "confort" | "materiales" | "soporte";

export type HotspotFrame = { id: HotspotId; x: number; y: number; visible: boolean };

export type MattressScene = {
  setView: (view: ViewId) => void;
  focusHotspot: (id: HotspotId | null) => void;
  setExplode: (open: boolean) => void;
  /** Gira el modelo un paso en horizontal (controles de teclado y botones). */
  rotateBy: (radians: number) => void;
  /** Progreso 0–1 de la entrada ligada al scroll. */
  setEntrance: (progress: number) => void;
  setActive: (active: boolean) => void;
  dispose: () => void;
};

type Options = {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  reducedMotion: boolean;
  onFrame: (hotspots: HotspotFrame[]) => void;
  onInteract?: () => void;
};

/* ---------- Dimensiones (metros) ---------- */
const L = 2.0; // largo (x)
const W = 1.5; // ancho (z)
const LAYERS = [
  { id: "base", h: 0.05, side: "#b7a48b", top: "#a8957c" },
  { id: "core", h: 0.14, side: "#dccdb6", top: "#cdb892" },
  { id: "comfort", h: 0.07, side: "#eadfcf", top: "#efe2c8" },
  { id: "top", h: 0.05, side: "#ece2d3", top: "#ece2d3" },
] as const;
const TOTAL_H = LAYERS.reduce((a, l) => a + l.h, 0);
const GAP = 0.2; // separación entre capas con el despiece abierto

const VIEWS: Record<ViewId, { yaw: number; pitch: number }> = {
  perspective: { yaw: -0.62, pitch: 0.42 },
  front: { yaw: 0, pitch: 0.1 },
  top: { yaw: 0, pitch: 1.42 },
};
const HOTSPOT_VIEWS: Record<HotspotId, { yaw: number; pitch: number; explode: boolean }> = {
  confort: { yaw: -0.45, pitch: 0.92, explode: false },
  materiales: { yaw: 0.28, pitch: 0.2, explode: false },
  soporte: { yaw: 0.95, pitch: 0.34, explode: true },
};

/* ---------- Texturas generadas en canvas ---------- */

/** Mapa de alturas del acolchado: almohadillas en rombo que se apagan hacia el borde. */
function quiltHeightMap(): THREE.CanvasTexture {
  // 256×192 en lugar de 512×384: como mapa de relieve la diferencia no se ve y cuesta
  // cuatro veces menos construirlo, que es tiempo de hilo principal bloqueado.
  const w = 256;
  const h = 192;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  const nx = 7;
  const nz = 5.25;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      // Coordenadas giradas 45°: las costuras forman rombos.
      const a = (u * nx + v * nz) * Math.PI;
      const b = (u * nx - v * nz) * Math.PI;
      // `sqrt` en vez de `pow(x, 0.42)`: misma curva a ojo, sin 50.000 llamadas a pow.
      const puff = Math.sqrt(Math.abs(Math.sin(a) * Math.sin(b)));
      // Caída suave hacia el perímetro para fundirse con la tapa.
      const edge = Math.min(u, 1 - u, v * (w / h), (1 - v) * (w / h));
      const fall = Math.min(1, edge / 0.06);
      const val = Math.round(255 * puff * fall * fall * (3 - 2 * fall));
      const i = (y * w + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = val;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/** Trama de tejido: ruido fino con hilos cruzados, usada como relieve. */
function weaveMap(): THREE.CanvasTexture {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(s, s);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const warp = Math.sin(x * 0.9) * 0.5 + 0.5;
      const weft = Math.sin(y * 0.9) * 0.5 + 0.5;
      const over = (Math.floor(x / 3.5) + Math.floor(y / 3.5)) % 2 === 0 ? warp : weft;
      const val = Math.round(120 + over * 90 + (Math.random() - 0.5) * 50);
      const i = (y * s + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = val;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

/** Cara superior del núcleo: siete zonas de apoyo con cortes ondulados. */
function coreTopMap(): THREE.CanvasTexture {
  const w = 256;
  const h = 192;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  const zones = ["#cdb892", "#c4ad84", "#d3c09c", "#bfa679", "#d3c09c", "#c4ad84", "#cdb892"];
  zones.forEach((col, i) => {
    ctx.fillStyle = col;
    ctx.fillRect((i * w) / zones.length, 0, w / zones.length + 1, h);
  });
  ctx.strokeStyle = "rgba(90, 66, 40, 0.28)";
  ctx.lineWidth = 2;
  for (let x = 5; x < w; x += 7) {
    ctx.beginPath();
    for (let y = 0; y <= h; y += 6) {
      const px = x + Math.sin(y * 0.09 + x) * 2.2;
      if (y === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Cara superior de la acogida: espuma perforada. */
function comfortTopMap(): THREE.CanvasTexture {
  const w = 256;
  const h = 192;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#efe2c8";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(120, 92, 58, 0.34)";
  for (let y = 6; y < h; y += 9) {
    for (let x = 6 + ((y / 9) % 2) * 4.5; x < w; x += 9) {
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Etiqueta bordada del lateral. */
function labelMap(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 384;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#b66f57";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = "rgba(255, 252, 248, 0.55)";
  ctx.lineWidth = 3;
  ctx.setLineDash([7, 5]);
  ctx.strokeRect(9, 9, c.width - 18, c.height - 18);
  ctx.fillStyle = "#fffcf8";
  ctx.font = "62px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Almara", c.width / 2, c.height / 2 + 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Vivo perimetral: tubo que recorre un rectángulo de esquinas redondeadas. */
function pipingGeometry(length: number, width: number, radius: number, thickness: number) {
  const shape = new THREE.Shape();
  const x = -length / 2;
  const z = -width / 2;
  shape.moveTo(x + radius, z);
  shape.lineTo(x + length - radius, z);
  shape.absarc(x + length - radius, z + radius, radius, -Math.PI / 2, 0, false);
  shape.lineTo(x + length, z + width - radius);
  shape.absarc(x + length - radius, z + width - radius, radius, 0, Math.PI / 2, false);
  shape.lineTo(x + radius, z + width);
  shape.absarc(x + radius, z + width - radius, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(x, z + radius);
  shape.absarc(x + radius, z + radius, radius, Math.PI, Math.PI * 1.5, false);
  const pts = shape.getSpacedPoints(110).map((p) => new THREE.Vector3(p.x, 0, p.y));
  const curve = new THREE.CatmullRomCurve3(pts, true, "centripetal");
  return new THREE.TubeGeometry(curve, 130, thickness, 6, true);
}

/* ---------- Escena ---------- */

/**
 * Cede el hilo entre fases del arranque: parte lo que antes era un bloque único que congelaba
 * la página en trozos que el navegador puede intercalar, y además espera a que el scroll pare.
 *
 * Se probó `requestIdleCallback` y salió peor: agrupaba fases en una sola tarea larga.
 */
const cederHilo = async () => {
  await esperarScrollQuieto(120, 500);
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
};

/** Amortiguador crítico (SmoothDamp): devuelve el nuevo valor y actualiza la velocidad. */
function amortiguar<K extends string>(
  actual: number,
  destino: number,
  vel: Record<K, number>,
  k: K,
  tiempo: number,
  dt: number
): number {
  const omega = 2 / Math.max(0.0001, tiempo);
  const x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const cambio = actual - destino;
  const temp = (vel[k] + omega * cambio) * dt;
  vel[k] = (vel[k] - omega * temp) * exp;
  return destino + (cambio + temp) * exp;
}

/**
 * Ángulo equivalente a `destino` más cercano a `actual`. Tras varias vueltas arrastrando, el yaw
 * acumula múltiplos de 2π: sin esto, pedir «Frontal» deshacía todas las vueltas de golpe.
 */
function girocorto(actual: number, destino: number): number {
  const TAU = Math.PI * 2;
  let d = (destino - actual) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return actual + d;
}

export async function createMattressScene({
  canvas,
  container,
  reducedMotion,
  onFrame,
  onInteract,
}: Options): Promise<MattressScene> {
  const disposables: { dispose: () => void }[] = [];
  const track = <T extends { dispose: () => void }>(o: T) => {
    disposables.push(o);
    return o;
  };

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  // Un objeto de estudio no necesita 2x: a 1.5 se ve igual y se pintan la mitad de píxeles.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.94;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);

  /* Luz cálida: clave lateral alta + relleno frío muy bajo + hemisferio. */
  const key = new THREE.DirectionalLight("#ffdcb8", 2.35);
  key.position.set(3.2, 4.6, 2.6);
  key.castShadow = true;
  key.shadow.mapSize.set(coarse ? 512 : 1024, coarse ? 512 : 1024);
  key.shadow.camera.left = -2.4;
  key.shadow.camera.right = 2.4;
  key.shadow.camera.top = 2.4;
  key.shadow.camera.bottom = -2.4;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 14;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  scene.add(key);
  const fill = new THREE.DirectionalLight("#d8e2ee", 0.55);
  fill.position.set(-3.5, 2, -2.5);
  scene.add(fill);
  // Sustituye al rebote del entorno, que se retiró por coste de arranque. El cielo va casi
  // neutro: con el tono cálido del original el tejido se iba a tostado.
  scene.add(new THREE.HemisphereLight("#fff9f2", "#b3a795", 0.95));

  /* Suelo que solo recoge la sombra: el fondo lo pone el CSS de la sección. */
  const ground = new THREE.Mesh(track(new THREE.PlaneGeometry(14, 14)), track(new THREE.ShadowMaterial({ opacity: 0.2 })));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -TOTAL_H / 2 - 0.012;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ----- Colchón ----- */
  const rig = new THREE.Group(); // entrada ligada al scroll
  const mattress = new THREE.Group();
  rig.add(mattress);
  scene.add(rig);

  const weave = track(weaveMap());
  const quiltMap = track(quiltHeightMap());
  const coreMap = track(coreTopMap());
  const comfortMap = track(comfortTopMap());
  const label = track(labelMap());

  await cederHilo();

  const layerGroups: THREE.Group[] = [];
  const baseY: number[] = [];
  let cursor = -TOTAL_H / 2;

  LAYERS.forEach((layer, i) => {
    const g = new THREE.Group();
    const geo = track(new RoundedBoxGeometry(L, layer.h, W, 3, Math.min(0.03, layer.h * 0.45)));
    const sideTex = weave.clone();
    sideTex.repeat.set(10, 1.2);
    sideTex.needsUpdate = true;
    disposables.push(sideTex);
    const side = track(
      new THREE.MeshStandardMaterial({ color: layer.side, roughness: 0.94, metalness: 0, bumpMap: sideTex, bumpScale: 0.55 })
    );
    const topMat = track(
      new THREE.MeshStandardMaterial({
        color: layer.id === "core" || layer.id === "comfort" ? "#ffffff" : layer.top,
        map: layer.id === "core" ? coreMap : layer.id === "comfort" ? comfortMap : null,
        roughness: 0.97,
      })
    );
    // Grupos de BoxGeometry: +x, -x, +y, -y, +z, -z
    const mesh = new THREE.Mesh(geo, [side, side, topMat, side, side, side]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);

    const y = cursor + layer.h / 2;
    g.position.y = y;
    baseY[i] = y;
    cursor += layer.h;
    mattress.add(g);
    layerGroups.push(g);
  });

  const [, coreGroup, , topGroup] = layerGroups;
  const topH = LAYERS[3].h;

  await cederHilo();

  /* Acolchado con relieve real sobre la tapa. */
  // 80×60 segmentos bastan para el relieve del acolchado y son un tercio de vértices.
  const quiltGeo = track(new THREE.PlaneGeometry(L - 0.07, W - 0.07, 80, 60));
  quiltGeo.rotateX(-Math.PI / 2);
  const quiltWeave = weave.clone();
  quiltWeave.repeat.set(9, 7);
  quiltWeave.needsUpdate = true;
  disposables.push(quiltWeave);
  const quiltMat = track(
    new THREE.MeshStandardMaterial({
      color: "#ebe1d2",
      roughness: 0.9,
      displacementMap: quiltMap,
      displacementScale: 0.042,
      bumpMap: quiltMap,
      bumpScale: 4.2,
      roughnessMap: quiltWeave,
    })
  );
  const quilt = new THREE.Mesh(quiltGeo, quiltMat);
  quilt.position.y = topH / 2 - 0.004;
  quilt.castShadow = true;
  quilt.receiveShadow = true;
  topGroup.add(quilt);

  /* Vivos de terracota: marcan la tapa y el canto inferior del núcleo. */
  const pipingMat = track(new THREE.MeshStandardMaterial({ color: "#b66f57", roughness: 0.78 }));
  const pipingGeo = track(pipingGeometry(L + 0.004, W + 0.004, 0.034, 0.0085));
  const pipeTop = new THREE.Mesh(pipingGeo, pipingMat);
  pipeTop.position.y = -topH / 2;
  pipeTop.castShadow = true;
  topGroup.add(pipeTop);
  const pipeLow = new THREE.Mesh(pipingGeo, pipingMat);
  pipeLow.position.y = -LAYERS[1].h / 2;
  coreGroup.add(pipeLow);

  /* Etiqueta bordada en el lateral frontal. */
  const tag = new THREE.Mesh(
    track(new THREE.PlaneGeometry(0.27, 0.09)),
    track(new THREE.MeshStandardMaterial({ map: label, roughness: 0.85 }))
  );
  tag.position.set(-L / 2 + 0.34, 0, W / 2 + 0.0015);
  coreGroup.add(tag);

  /* Asas laterales. */
  const handleMat = track(new THREE.MeshStandardMaterial({ color: "#c9b79c", roughness: 0.9 }));
  const handleGeo = track(new RoundedBoxGeometry(0.2, 0.034, 0.012, 3, 0.005));
  [-0.45, 0.45].forEach((x) => {
    [1, -1].forEach((s) => {
      const hnd = new THREE.Mesh(handleGeo, handleMat);
      hnd.position.set(x, 0.005, s * (W / 2 + 0.007));
      hnd.castShadow = true;
      coreGroup.add(hnd);
    });
  });

  await cederHilo();

  /* ----- Hotspots: anclas en espacio local de su capa ----- */
  const anchors: { id: HotspotId; parent: THREE.Object3D; pos: THREE.Vector3; normal: THREE.Vector3 }[] = [
    { id: "confort", parent: topGroup, pos: new THREE.Vector3(-0.38, topH / 2 + 0.03, 0.18), normal: new THREE.Vector3(0, 1, 0) },
    { id: "materiales", parent: coreGroup, pos: new THREE.Vector3(0.42, 0.0, W / 2 + 0.01), normal: new THREE.Vector3(0, 0, 1) },
    { id: "soporte", parent: coreGroup, pos: new THREE.Vector3(L / 2 + 0.01, 0, -0.12), normal: new THREE.Vector3(1, 0, 0) },
  ];

  /* ----- Estado animado ----- */
  const state = { yaw: VIEWS.perspective.yaw, pitch: VIEWS.perspective.pitch, explode: 0, entrance: reducedMotion ? 1 : 0 };
  const target = { yaw: state.yaw, pitch: state.pitch, explode: 0, entrance: state.entrance };
  // Velocidades del amortiguador: la cámara arranca y frena suave en lugar de salir disparada.
  const vel = { yaw: 0, pitch: 0, explode: 0 };
  // Tiempo de asentado: corto mientras se arrastra (la mano manda), largo al cambiar de vista.
  let camTime = 0.5;
  const T_DRAG = 0.09;
  const T_VIEW = 0.5;
  const T_EXPLODE = 0.55;
  let radius = 5.4;
  let active = false;
  let raf = 0;
  let dragging = false;
  let touched = false; // tras la primera interacción se apaga el vaivén de reposo
  let lastX = 0;
  let lastY = 0;
  let width = 1;
  let height = 1;

  /* Calidad adaptativa: no sabemos en qué GPU cae esto (un portátil puede estar usando la
     integrada). Si los fotogramas se alargan, se baja un escalón y no se vuelve a subir, para
     que la imagen no oscile. Alto → menos densidad de píxeles → sin sombras. */
  let calidad = 2;
  let acumulado = 0;
  let muestras = 0;
  const bajarCalidad = () => {
    calidad--;
    // Solo se tocan parámetros que no obligan a recompilar los shaders: apagar las sombras
    // marcaría todos los materiales como sucios y el parón sería peor que el problema.
    if (calidad === 1) {
      renderer.setPixelRatio(1);
    } else {
      renderer.setPixelRatio(0.75);
      key.shadow.map?.dispose();
      key.shadow.map = null;
      key.shadow.mapSize.set(512, 512);
    }
    resize();
  };
  let prev = performance.now();
  let elapsed = 0;

  const resize = () => {
    const r = container.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // En formatos estrechos la cámara retrocede para que el colchón quepa entero.
    radius = 3.95 * Math.max(1, 1.5 / camera.aspect);
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  /* ----- Arrastre ----- */
  const onDown = (e: PointerEvent) => {
    dragging = true;
    touched = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.dataset.dragging = "true";
    onInteract?.();
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* puntero no capturable: el arrastre sigue funcionando mientras no salga del canvas */
    }
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    camTime = T_DRAG;
    target.yaw -= dx * 0.0062;
    // En táctil el eje vertical pertenece al scroll de la página.
    if (e.pointerType !== "touch") target.pitch = THREE.MathUtils.clamp(target.pitch + dy * 0.004, 0.04, 1.45);
  };
  const onUp = (e: PointerEvent) => {
    dragging = false;
    delete canvas.dataset.dragging;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);

  /* ----- Bucle ----- */
  const world = new THREE.Vector3();
  const normalW = new THREE.Vector3();
  const toCam = new THREE.Vector3();
  const frames: HotspotFrame[] = anchors.map((a) => ({ id: a.id, x: 0, y: 0, visible: false }));

  /* El vaivén de reposo es una invitación, no un salvapantallas: se apaga a los 9 s para que
     la escena pueda quedarse quieta y dejar de pintar. */
  const SWAY_S = 9;
  const EPS = 0.0005;
  const cerca = (a: number, b: number) => Math.abs(a - b) < EPS;

  const tick = () => {
    raf = requestAnimationFrame(tick);
    const now = performance.now();
    const dt = Math.min((now - prev) / 1000, 0.05);
    prev = now;
    elapsed += dt;
    // Amortiguador crítico (independiente del framerate): aceleración y frenado continuos, sin
    // el tirón inicial de una interpolación exponencial. Con reduced motion, inmediato.
    if (reducedMotion) {
      state.yaw = target.yaw;
      state.pitch = target.pitch;
      state.explode = target.explode;
      state.entrance = target.entrance;
    } else {
      state.yaw = amortiguar(state.yaw, target.yaw, vel, "yaw", camTime, dt);
      state.pitch = amortiguar(state.pitch, target.pitch, vel, "pitch", camTime, dt);
      state.explode = amortiguar(state.explode, target.explode, vel, "explode", T_EXPLODE, dt);
      state.entrance += (target.entrance - state.entrance) * (1 - Math.exp(-dt * 6));
    }

    // Amplitud que se desvanece al final para que no haya corte brusco.
    const swayOn = !reducedMotion && !touched && elapsed < SWAY_S;
    const sway = swayOn ? Math.sin(elapsed * 0.35) * 0.09 * Math.min(1, (SWAY_S - elapsed) / 1.5) : 0;

    // Si nada se mueve, no se vuelve a pintar: el frame anterior sigue siendo válido y la GPU
    // queda libre mientras el usuario lee el panel o sigue bajando.
    const quieto =
      !swayOn &&
      cerca(state.yaw, target.yaw) &&
      cerca(state.pitch, target.pitch) &&
      cerca(state.explode, target.explode) &&
      cerca(state.entrance, target.entrance) &&
      Math.abs(vel.yaw) + Math.abs(vel.pitch) + Math.abs(vel.explode) < 0.002;
    if (quieto) {
      vel.yaw = vel.pitch = vel.explode = 0;
      state.yaw = target.yaw;
      state.pitch = target.pitch;
      state.explode = target.explode;
      state.entrance = target.entrance;
      return;
    }
    const yaw = state.yaw + sway + (1 - state.entrance) * 0.95;
    const lift = state.explode * GAP * 1.5 * 0.5;
    const r = radius * (1 + state.explode * 0.16);
    camera.position.set(
      Math.sin(yaw) * Math.cos(state.pitch) * r,
      Math.sin(state.pitch) * r + lift * 0.4,
      Math.cos(yaw) * Math.cos(state.pitch) * r
    );
    camera.lookAt(0, lift, 0);

    layerGroups.forEach((g, i) => {
      g.position.y = baseY[i] + state.explode * GAP * i;
    });
    const e = state.entrance;
    rig.position.y = (1 - e) * -0.55;
    rig.scale.setScalar(0.86 + 0.14 * e);

    renderer.render(scene, camera);

    // Se mide solo mientras hay movimiento: es cuando la fluidez se nota.
    if (calidad > 0) {
      acumulado += dt;
      muestras++;
      if (muestras >= 45) {
        if (acumulado / muestras > 0.024) bajarCalidad();
        acumulado = 0;
        muestras = 0;
      }
    }

    anchors.forEach((a, i) => {
      world.copy(a.pos);
      a.parent.localToWorld(world);
      normalW.copy(a.normal).transformDirection(a.parent.matrixWorld);
      toCam.copy(camera.position).sub(world).normalize();
      const facing = normalW.dot(toCam) > 0.12;
      world.project(camera);
      frames[i].x = (world.x * 0.5 + 0.5) * width;
      frames[i].y = (-world.y * 0.5 + 0.5) * height;
      frames[i].visible = facing && e > 0.9;
    });
    onFrame(frames);
  };

  // Compila los programas GLSL sin bloquear (usa KHR_parallel_shader_compile si existe).
  camera.position.set(0, 2, 5);
  camera.lookAt(0, 0, 0);
  await renderer.compileAsync(scene, camera);

  const setActive = (next: boolean) => {
    if (next === active) return;
    active = next;
    cancelAnimationFrame(raf);
    if (active) {
      prev = performance.now();
      tick();
    }
  };

  return {
    setView(view) {
      touched = true;
      camTime = T_VIEW;
      target.yaw = girocorto(state.yaw, VIEWS[view].yaw);
      target.pitch = VIEWS[view].pitch;
    },
    rotateBy(radians) {
      touched = true;
      camTime = T_VIEW;
      target.yaw += radians;
    },
    focusHotspot(id) {
      if (!id) return;
      touched = true;
      const v = HOTSPOT_VIEWS[id];
      camTime = T_VIEW;
      target.yaw = girocorto(state.yaw, v.yaw);
      target.pitch = v.pitch;
      target.explode = v.explode ? 1 : 0;
    },
    setExplode(open) {
      touched = true;
      target.explode = open ? 1 : 0;
    },
    setEntrance(progress) {
      target.entrance = reducedMotion ? 1 : THREE.MathUtils.clamp(progress, 0, 1);
    },
    setActive,
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    },
  };
}

/** Comprueba soporte WebGL sin dejar un contexto colgado. */
export function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    return !!gl;
  } catch {
    return false;
  }
}
