import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = 'assets/models/carnival-prize-booth.glb';

// Bounding box original: ~1.90 x 1.46 x 1.04 (sem unidade real).
// Escala calibrada para uma altura total de ~2.2m (um balcão/vitrine
// de prêmios costuma ser mais baixo que a marquise de uma barraca de
// tiro) — ajuste olhando o resultado no navegador.
const MODEL_SCALE = 1.5;
const GROUND_Y_OFFSET = 1.09; // abs(min.y) * MODEL_SCALE, para a base encostar no chão

// Posição dentro do ambiente do circo (já reancorado na origem por
// CircusEnvironmentModel.js). Alguns metros à frente de onde o
// jogador começa — mas, como não renderizamos a cena aqui, não temos
// como confirmar visualmente que esse ponto está numa área livre do
// cenário. Se o balcão aparecer dentro de uma parede/tenda, mude
// BOOTH_POSITION.
const BOOTH_POSITION = { x: 0, z: -4 };

/**
 * Carrega o balcão de prêmios e o adiciona ao `parent` (worldGroup),
 * já posicionado dentro do ambiente do circo.
 */
export async function loadPrizeBoothModel(parent) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(MODEL_URL);
  const model = gltf.scene;

  model.scale.setScalar(MODEL_SCALE);
  model.position.set(BOOTH_POSITION.x, GROUND_Y_OFFSET, BOOTH_POSITION.z);

  // No modelo anterior (barraca de tiro), rotation.y = 0 foi o valor
  // que ficou correto (confirmado no navegador) — mantendo o mesmo
  // padrão como ponto de partida aqui. Se aparecer de costas, troque
  // para Math.PI.
  model.rotation.y = 0;

  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;

    if (child.material) {
      child.material.metalness = 0;
      child.material.roughness = 0.85;
    }
  });

  parent.add(model);
  return model;
}
