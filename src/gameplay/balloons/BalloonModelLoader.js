import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { BALLOON_TYPES } from './BalloonTypes.js';

const loader = new GLTFLoader();

/** typeId -> THREE.Object3D "molde", nunca adicionado à cena diretamente. */
const templateCache = new Map();

/**
 * Carrega os 4 GLBs de balão uma única vez (chamado junto com os
 * outros modelos em Game.js). Cada balão spawnado depois é apenas um
 * `.clone()` do molde já carregado — bem mais barato do que buscar o
 * arquivo de novo a cada balão que aparece.
 */
export async function preloadBalloonModels() {
  await Promise.all(
    Object.values(BALLOON_TYPES).map(async (type) => {
      const gltf = await loader.loadAsync(type.modelUrl);
      const template = gltf.scene;

      template.traverse((child) => {
        if (!child.isMesh) return;
        // Mesmo ajuste de segurança aplicado aos outros modelos do
        // Meshy AI: sem isso, o material pode renderizar escuro
        // demais nesta cena (sem environment map de reflexo).
        child.material.metalness = 0;
        child.material.roughness = 0.6;
      });

      templateCache.set(type.id, template);
    })
  );
}

/** Cria uma nova instância (clone) do modelo de um tipo de balão, já na escala configurada. */
export function createBalloonMesh(typeId) {
  const template = templateCache.get(typeId);
  if (!template) {
    throw new Error(
      `Modelo do balão "${typeId}" ainda não foi pré-carregado (chame preloadBalloonModels antes).`
    );
  }
  const mesh = template.clone(true);
  mesh.scale.setScalar(BALLOON_TYPES[typeId].scale);
  return mesh;
}
