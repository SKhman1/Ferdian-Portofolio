import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './styles.css';

const canvas = document.querySelector('#camera-canvas');
const status = document.querySelector('.scene-status');
const progress = document.querySelector('.scroll-progress span');
const menuButton = document.querySelector('.menu-button');
const header = document.querySelector('.site-header');
const workSection = document.querySelector('#work');
const aboutSection = document.querySelector('#about');
const mediaSection = document.querySelector('.media-section');
const cameraStage = document.querySelector('.camera-stage');
const heroFigure = document.querySelector('.hero-figure');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.01, 100);
camera.position.set(0.8, 0.35, 3.2);

const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

scene.add(new THREE.HemisphereLight(0xc9d2db, 0x080808, 2.2));
const keyLight = new THREE.DirectionalLight(0xffffff, 4.4);
keyLight.position.set(-3, 4, 5);
scene.add(keyLight);
const rimLight = new THREE.DirectionalLight(0x8c9da4, 3);
rimLight.position.set(4, 1, -3);
scene.add(rimLight);

let cameraModel;
let modelTargetRotation = 0;
let modelTargetY = -0.18;
let modelTargetX = 1.35;
let modelBaseScale = 1;
let modelCurrentScale = 1;
let modelTargetScale = 1;

new GLTFLoader().load('/Camera-3D-Model/scene.gltf', (gltf) => {
  cameraModel = gltf.scene;
  const bounds = new THREE.Box3().setFromObject(cameraModel);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  modelBaseScale = 1.15 / Math.max(size.x, size.y, size.z);
  cameraModel.scale.setScalar(modelBaseScale);
  cameraModel.position.sub(center.multiplyScalar(modelBaseScale));
  cameraModel.position.y = -0.18;
  cameraModel.rotation.set(0.02, modelTargetRotation, 0.02);
  cameraModel.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(cameraModel);
  status.classList.add('is-ready');
  window.setTimeout(() => status.remove(), 800);
}, undefined, () => {
  status.textContent = 'Camera study unavailable';
  status.classList.add('is-error');
});

function setRendererSize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function updateSceneFromScroll() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  progress.style.transform = `scaleX(${scrollProgress})`;
  const heroScrollProgress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, window.innerHeight)));
  heroFigure.style.setProperty('--hero-scroll-blur', `${reduceMotion ? 0 : heroScrollProgress * 12}px`);
  const cameraStoryVisible = window.scrollY + window.innerHeight > workSection.offsetTop && window.scrollY < mediaSection.offsetTop;
  cameraStage.classList.toggle('is-contained', cameraStoryVisible);
  if (!cameraModel) return;
  const desktop = window.innerWidth > 720;
  const workTop = workSection.getBoundingClientRect().top + window.scrollY;
  const aboutTop = aboutSection.getBoundingClientRect().top + window.scrollY;
  const sectionTwoProgress = Math.min(1, Math.max(0, (window.scrollY - workTop) / Math.max(1, aboutTop - workTop)));
  const sectionThreeEnd = aboutTop + Math.max(1, aboutSection.offsetHeight - window.innerHeight);
  const transitionStart = workTop + (aboutTop - workTop) * 0.5;
  const transitionEnd = aboutTop + (sectionThreeEnd - aboutTop) * 0.5;
  const sectionThreeProgress = Math.min(1, Math.max(0, (window.scrollY - transitionStart) / Math.max(1, transitionEnd - transitionStart)));
  const sectionTwoMotion = 1 - Math.pow(1 - sectionTwoProgress, 3);
  const sectionThreeMotion = 1 - Math.pow(1 - sectionThreeProgress, 0.65);
  modelTargetRotation = sectionTwoMotion * 1.05 + sectionThreeMotion * (Math.PI - -0.5);
  modelTargetX = desktop ? 1.65 - sectionTwoMotion * 0.42 - sectionThreeMotion * 1 : 0.08;
  modelTargetY = desktop ? 0.02 - sectionThreeProgress * 0.06 : 0;
  modelTargetScale = desktop ? 1 + sectionTwoMotion * 0.1 : 1;
}

function animate() {
  requestAnimationFrame(animate);
  if (cameraModel) {
    const easing = reduceMotion ? 1 : 0.095;
    cameraModel.rotation.y += (modelTargetRotation - cameraModel.rotation.y) * easing;
    cameraModel.position.x += (modelTargetX - cameraModel.position.x) * easing;
    cameraModel.position.y += (modelTargetY - cameraModel.position.y) * easing;
    modelCurrentScale += (modelTargetScale - modelCurrentScale) * easing;
    cameraModel.scale.setScalar(modelBaseScale * modelCurrentScale);
  }
  renderer.render(scene, camera);
}

function revealSections() {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  }), { threshold: 0.16 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
}

window.addEventListener('scroll', updateSceneFromScroll, { passive: true });
window.addEventListener('resize', setRendererSize);
menuButton.addEventListener('click', () => {
  const expanded = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!expanded));
  header.classList.toggle('menu-open', !expanded);
});
document.querySelectorAll('nav a').forEach((link) => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  header.classList.remove('menu-open');
}));

setRendererSize();
updateSceneFromScroll();
revealSections();
animate();