import "../src/style.css";
import * as THREE from "three";
import vertex from "../shaders/vertexShader.glsl";
import fragment from "../shaders/fragmentShader.glsl";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import textVertexShader from "../shaders/textVertexShader.glsl";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Text } from "troika-three-text";
import gsap from "gsap/all";

// Create loader element
const createLoader = () => {
  const loaderContainer = document.createElement("div");
  loaderContainer.id = "loader-container";
  loaderContainer.innerHTML = `
    <style>
      #loader-container {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
        font-family: Arial, sans-serif;
      }
      #loader {
        width: 200px;
        height: 20px;
        background: #333;
        border-radius: 10px;
        overflow: hidden;
        margin-top: 20px;
      }
      #loader-fill {
        width: 0;
        height: 100%;
        background: #4CAF50;
        transition: width 0.5s ease-in-out;
      }
      #loader-text {
        font-size: 24px;
        margin-bottom: 10px;
      }
    </style>
    <div id="loader-text">Loading: 0%</div>
    <div id="loader">
      <div id="loader-fill"></div>
    </div>
  `;
  document.body.appendChild(loaderContainer);
  return loaderContainer;
};

// Update loader progress
const updateLoader = (percentage) => {
  const loaderText = document.getElementById("loader-text");
  const loaderFill = document.getElementById("loader-fill");

  if (loaderText && loaderFill) {
    loaderText.textContent = `Loading: ${Math.round(percentage)}%`;
    loaderFill.style.width = `${percentage}%`;
  }
};

// Animate loader exit
const exitLoader = () => {
  const loaderContainer = document.getElementById("loader-container");
  if (loaderContainer) {
    gsap.to(loaderContainer, {
      opacity: 0,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        loaderContainer.style.display = "none"; // Ensure it's gone
        loaderContainer.remove(); // Remove from DOM
      },
    });
  }
};

// Modify LoadingManager to track progress
const loadingManager = new THREE.LoadingManager();
let totalItems = 0;
let loadedItems = 0;

loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
  totalItems = itemsTotal;
};

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
  loadedItems = itemsLoaded;
  const percentage = (itemsLoaded / itemsTotal) * 100;
  updateLoader(percentage);
};

loadingManager.onLoad = () => {
  // Ensure 100% is visible
  updateLoader(100);

  // Delay exit to let the UI update
  setTimeout(() => {
  }, 1000); // Slight delay to let the UI catch up
};

loadingManager.onError = (url) => {
  console.log(`Error loading ${url}`);
};
createLoader();
exitLoader();

const canvas = document.getElementById("canvas");


const blobs = [
  {
    name: "Color Fusion",
    background: "#9D73F7",
    config: {
      uPositionFrequency: 1.05,
      uPositionStrength: 1.2,
      uSmallWavePositionFrequency: 0.7,
      uSmallWavePositionStrength: 0.2,
      roughness: 1,
      metalness: 0,
      envMapIntensity: 0.5,
      clearcoat: 0,
      clearcoatRoughness: 0,
      transmission: 0,
      flatShading: false,
      wireframe: false,
      map: "hologram",
    },
  },
  {
    name: "Purple Mirror",
    background: "#5300B1",
    config: {
      uPositionFrequency: 0.584,
      uPositionStrength: 0.276,
      uSmallWavePositionFrequency: 0.899,
      uSmallWavePositionStrength: 1.266,
      roughness: 0,
      metalness: 1,
      envMapIntensity: 2,
      clearcoat: 0,
      clearcoatRoughness: 0,
      transmission: 0,
      flatShading: false,
      wireframe: false,
      map: "purple-rain",
    },
  },
  {
    name: "Alien Goo",
    background: "#45ACD8",
    config: {
      uPositionFrequency: 1.022,
      uPositionStrength: 0.99,
      uSmallWavePositionFrequency: 0.378,
      uSmallWavePositionStrength: 0.341,
      roughness: 0.292,
      metalness: 0.73,
      envMapIntensity: 0.86,
      clearcoat: 1,
      clearcoatRoughness: 0,
      transmission: 0,
      flatShading: false,
      wireframe: false,
      map: "lucky-day",
    },
  },
];

let isAnimationRunning = false;
let currentIndex = 0;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
  pixelRatio: window.devicePixelRatio || 1,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.outputEncoding = THREE.sRGBEncoding;

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#333");
const geometry = new THREE.IcosahedronGeometry(2.1, 100, 100);
const uniforms = {
  uTime: { value: 0.0 },
  uPositionFrequency: { value: blobs[currentIndex].config.uPositionFrequency },
  uPositionStrength: { value: blobs[currentIndex].config.uPositionStrength }, // Corrected spelling
  uTimeFrequency: { value: 0.2 },
  uSmallWavePositionFrequency: {
    value: blobs[currentIndex].config.uSmallWavePositionFrequency,
  },
  uSmallWavePositionStrength: {
    value: blobs[currentIndex].config.uSmallWavePositionStrength,
  }, // Corrected spelling
  uSmallWaveTimeFrequency: { value: 0.3 },
};

const material = new CustomShaderMaterial({
  baseMaterial: THREE.MeshPhysicalMaterial,
  metalness: blobs[currentIndex].config.metalness, // Keep high metalness
  roughness: blobs[currentIndex].config.roughness, // Keep low roughness
  vertexShader: vertex,
  envMapIntensity: blobs[currentIndex].config.envMapIntensity,
  clearcoat: blobs[currentIndex].config.clearcoat,
  clearcoatRoughness: blobs[currentIndex].config.clearcoatRoughness,
  transmission: blobs[currentIndex].config.transmission,
  flatShading: blobs[currentIndex].config.flatShading,
  wireframe: blobs[currentIndex].config.wireframe,
  uniforms,
  map: new THREE.TextureLoader(loadingManager).load(
    `./gradients/${blobs[currentIndex].config.map}.png`
  ),
});

const mergeGeometry = new mergeVertices(geometry);
mergeGeometry.computeTangents();
console.log(mergeGeometry);

const sphere = new THREE.Mesh(mergeGeometry, material);
scene.add(sphere);

const clock = new THREE.Clock();

const loader = new RGBELoader(loadingManager);
loader.load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_08_1k.hdr",
  function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  }
);

const textMaterial = new THREE.ShaderMaterial({
  vertexShader: textVertexShader,
  fragmentShader: `void main(){
    gl_FragColor = vec4(1.0);
  }`,
  side: THREE.DoubleSide,
  uniforms: {
    progress: { value: 0.0 },
    direction: { value: 1.0 },
  },
});

const texts = blobs.map((blob, index) => {
  const Mytext = new Text();
  Mytext.text = blob.name;
  Mytext.font = "./aften_screen.woff";
  Mytext.anchorX = "center";
  Mytext.anchorY = "middle";
  Mytext.material = textMaterial;
  Mytext.position.set(0, -0.1, 3);
  if (index !== 0) Mytext.scale.set(0, 0, 0);
  Mytext.fontSize = window.innerHeight / 770;
  Mytext.letterSpacing = -0.08;
  Mytext.glyphGeometryDetail = 20;
  Mytext.sync();
  scene.add(Mytext);
  return Mytext;
});

window.addEventListener("wheel", (event) => {
  if (isAnimationRunning) return;
  isAnimationRunning = true;
  let direction = Math.sign(event.deltaY);
  let next = (currentIndex + direction + blobs.length) % blobs.length;

  texts[next].scale.set(1, 1, 1);
  texts[next].position.x = direction * 6.5;

  gsap.to(textMaterial.uniforms.progress, {
    duration: 1,
    value: 0.5,
    onComplete: () => {
      currentIndex = next;
      isAnimationRunning = false;
      textMaterial.uniforms.progress.value = 0.0;
    },
  });

  gsap.to(texts[currentIndex].position, {
    x: -direction * 6.2,
    duration: 1.3,
    ease: "Power2.InOut",
  });

  gsap.to(sphere.rotation, {
    y: sphere.rotation.y + Math.PI * 4 * -direction,
    duration: 1.3,
    ease: "Power2.InOut",
  });

  gsap.to(texts[next].position, {
    x: direction * 0,
    duration: 1.3,
    ease: "Power2.InOut",
  });

  const bg = new THREE.Color(blobs[next].background);
  gsap.to(scene.background, {
    r: bg.r,
    g: bg.g,
    b: bg.b,
    duration: 1,
    ease: "Power2.InOut",
  });

  updateBlob(blobs[next].config);
});

function updateBlob(config) {
  // Ensure uniforms exist and are properly structured
  if (!material.uniforms) {
    console.error("Material uniforms are not defined");
    return;
  }

  // Shape-modifying uniforms
  const shapeUniforms = [
    "uPositionFrequency",
    "uPositionStrength",
    "uTimeFrequency",
    "uSmallWavePositionFrequency",
    "uSmallWavePositionStrength",
    "uSmallWaveTimeFrequency",
  ];

  shapeUniforms.forEach((uniformKey) => {
    if (config[uniformKey] !== undefined) {
      try {
        gsap.to(material.uniforms[uniformKey], {
          value: config[uniformKey],
          duration: 1,
          ease: "Power2.InOut",
          onUpdate: () => {
            material.uniforms[uniformKey].needsUpdate = true;
            material.needsUpdate = true;
          },
        });
      } catch (error) {
        console.error(`Error updating shape uniform ${uniformKey}:`, error);
      }
    }
  });

  // Texture loading
  if (config.map !== undefined) {
    try {
      const textureLoader = new THREE.TextureLoader(loadingManager);
      textureLoader.load(
        `./gradients/${config.map}.png`,
        (texture) => {
          material.map = texture;
          material.needsUpdate = true;
        },
        undefined,
        (error) => {
          console.error("Error loading texture:", error);
        }
      );
    } catch (error) {
      console.error("Texture loading error:", error);
    }
  }

  // Material property updates
  const materialUpdates = [
    "metalness",
    "roughness",
    "color",
    "envMapIntensity",
    "clearcoat",
    "clearcoatRoughness",
    "transmission",
    "flatShading",
    "wireframe",
  ];

  materialUpdates.forEach((prop) => {
    if (config[prop] !== undefined) {
      try {
        gsap.to(material, {
          [prop]: config[prop],
          duration: 1,
          ease: "Power2.InOut",
          onUpdate: () => {
            material.needsUpdate = true;
          },
        });
      } catch (error) {
        console.error(`Error updating material property ${prop}:`, error);
      }
    }
  });

  // Force material and geometry update
  material.needsUpdate = true;
  sphere.geometry.attributes.position.needsUpdate = true;
}

loadingManager.onLoad = () => {
  function animate() {
    requestAnimationFrame(animate);
    uniforms.uTime.value = clock.getElapsedTime(); // Use clock's elapsed time
    renderer.render(scene, camera);
  }
  const bg = new THREE.Color(blobs[currentIndex].background);
  gsap.to(scene.background, {
    r: bg.r,
    g: bg.g,
    b: bg.b,
    duration: 1,
    ease: "Power2.InOut",
  });

  animate();
  console.log("print");
};
