import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BALLOON_TYPES } from '../gameplay/balloons/BalloonTypes.js';

// Resolução interna do render — maior que o tamanho de exibição em
// CSS de propósito, para ficar nítido em telas retina/alta densidade.
const THUMBNAIL_SIZE = 160;

const loader = new GLTFLoader();

/**
 * Gera um PNG (data URL) de cada um dos 4 modelos de balão, para uso
 * como ícone visual no card de instruções do menu (ver MenuScreen.js).
 *
 * Usa um único WebGLRenderer offscreen reaproveitado entre os 4
 * renders, em vez de manter um <canvas> WebGL ao vivo por balão —
 * aqui só precisamos de uma imagem estática por balão (não de uma
 * cena com câmera/animação), e evita esbarrar no limite de contextos
 * WebGL simultâneos que os navegadores impõem por página.
 *
 * Roda de forma independente do preload de gameplay feito em
 * BalloonModelLoader.js: o menu aparece antes desse preload terminar,
 * então os GLBs são carregados de novo aqui (arquivos pequenos após a
 * otimização — ver overview do projeto — e o cache HTTP do navegador
 * já ajuda a partir da segunda visita).
 *
 * @returns {Promise<Record<string, string>>} typeId -> data URL do PNG gerado
 */
export async function generateBalloonThumbnails() {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, false);
  renderer.setPixelRatio(1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 10);
  camera.position.set(0, 0.25, 1.6);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(1.5, 2, 2);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.45);
  fillLight.position.set(-1.5, -0.4, 1.2);
  scene.add(fillLight);

  const thumbnails = {};

  await Promise.all(
    Object.values(BALLOON_TYPES).map(async (type) => {
      const gltf = await loader.loadAsync(type.modelUrl);
      const model = gltf.scene;

      model.traverse((child) => {
        if (!child.isMesh) return;
        // Mesmo ajuste de segurança aplicado em BalloonModelLoader.js:
        // sem isso o material renderiza escuro demais nesta cena
        // minúscula, sem environment map de reflexo.
        child.material.metalness = 0;
        child.material.roughness = 0.6;
      });

      // Os 4 GLBs vêm com bounding boxes ligeiramente diferentes entre
      // si (mesma origem Meshy AI dos outros modelos do projeto, mas
      // sem garantia de tamanho idêntico). Centraliza e normaliza a
      // escala aqui para os 4 thumbnails ficarem consistentes entre
      // si, em vez de depender do `scale` de gameplay em
      // BalloonTypes.js (que é calibrado para o tamanho do alvo em
      // VR, não para preencher um ícone quadrado).
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center);
      const maxDimension = Math.max(size.x, size.y, size.z) || 1;
      model.scale.multiplyScalar(1 / maxDimension);

      scene.add(model);
      renderer.clear();
      renderer.render(scene, camera);
      thumbnails[type.id] = canvas.toDataURL('image/png');

      // Libera o modelo antes do próximo — a cena de thumbnail é
      // reaproveitada uma balão por vez, nunca com os 4 juntos.
      scene.remove(model);
      model.traverse((child) => {
        if (!child.isMesh) return;
        child.geometry.dispose();
        child.material.dispose();
      });
    })
  );

  renderer.dispose();
  return thumbnails;
}
