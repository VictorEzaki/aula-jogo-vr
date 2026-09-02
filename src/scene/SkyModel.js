import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';

const MODEL_URL = 'assets/models/extracted_minecraft_java_editions_stars.glb';

/**
 * Carrega a esfera panorâmica do céu ("PanoSphere", raio ~500
 * unidades) que envolve toda a cena. Diferente dos outros modelos
 * (ambiente do circo, balcão de prêmios), o céu NÃO é adicionado ao
 * `worldGroup` — ele vai direto na `scene`, porque não faz parte do
 * "mundo" posicionado; é um pano de fundo que deve sempre parecer
 * infinitamente distante, não importa para onde o jogador se mova.
 *
 * A textura do arquivo original vem no canal emissive (não no
 * baseColor), então ela aparece sempre no brilho original,
 * independente da iluminação da cena — não precisa de nenhum ajuste
 * de material aqui, diferente do que fizemos com os outros GLBs.
 */
export async function loadSky(scene) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(MODEL_URL);
  const sky = gltf.scene;

  // O asset foi exportado com as normais da esfera viradas para
  // dentro (convenção padrão de "PanoSphere" do Sketchfab), então a
  // textura já deveria aparecer corretamente vista de dentro. SE a
  // esfera aparecer "vazia"/não renderizar quando você olhar ao
  // redor, é sinal de que as normais não estão como esperado — nesse
  // caso, descomente a linha abaixo para forçar a renderização dos
  // dois lados:
  //
  // sky.traverse((child) => {
  //   if (child.isMesh) child.material.side = THREE.DoubleSide;
  // });

  sky.traverse((child) => {
    if (!child.isMesh) return;
    // Esfera gigante: nunca deve ser descartada por frustum culling
    // (o cálculo de bounding sphere às vezes erra em objetos desse
    // tamanho) nem escrever no depth buffer antes de tudo em volta.
    child.frustumCulled = false;
  });

  scene.add(sky);
  return sky;
}

/**
 * Chamado a cada frame (ver Game.update). Mantém o céu centrado na
 * posição da câmera, ignorando a rotação dela — é essa a técnica
 * padrão de skybox: o jogador nunca "alcança" a parede da esfera,
 * porque ela se move junto, sempre parecendo infinitamente distante.
 */
export function followCamera(sky, camera) {
  camera.getWorldPosition(sky.position);
}
