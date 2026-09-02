import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = 'assets/models/bizarre-circus-environment.glb';

// O arquivo original não está centralizado na origem — o plano de
// chão (meshes "ground_*") fica em torno de x:[-1, 22], z:[-10, 25],
// y:[-10.8]. Deslocamos o modelo inteiro para que o CENTRO do chão
// caia em (0, 0, 0), assim o jogador (que fica perto da origem,
// ver SceneManager) começa em pé sobre o piso do circo, não flutuando
// nem enterrado nele.
const GROUND_CENTER = { x: 10.5, y: -10.8, z: 7.45 };

/**
 * Carrega o ambiente completo (tenda, chão, cenário do "bizarre
 * circus") e o adiciona ao `parent` (worldGroup). Como é um asset
 * grande (~850 nós / 323 meshes), o carregamento é assíncrono — ver
 * Game.js, que espera esta Promise antes de liberar "Jogar".
 */
export async function loadCircusEnvironment(parent) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(MODEL_URL);
  const model = gltf.scene;

  model.position.set(-GROUND_CENTER.x, -GROUND_CENTER.y, -GROUND_CENTER.z);

  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;

    // Assets convertidos de FBX/Sketchfab às vezes também saem com
    // metalness alto por padrão nos materiais PBR gerados automaticamente.
    // Como não temos um environment map de reflexo nesta cena, isso
    // pode deixar partes do cenário escuras demais — o mesmo ajuste
    // de segurança que aplicamos no modelo da barraca.
    if (child.material && 'metalness' in child.material) {
      child.material.metalness = Math.min(child.material.metalness, 0.2);
    }
  });

  parent.add(model);
  return model;
}
