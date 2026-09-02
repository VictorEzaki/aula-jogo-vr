export const BalloonTypeId = {
  CLOWN_DELIGHT: 'clown_delight',
  PENALTY: 'penalty',
  CARNIVAL_20: 'carnival_20',
  SKY_ORB: 'sky_orb',
};

/**
 * Todos os 4 modelos vêm com a mesma bounding box aproximada
 * (~1 unidade de diâmetro, sem relação com metros reais — mesmo
 * padrão dos outros exports do Meshy AI usados no projeto). A escala
 * abaixo mira num balão de ~35-40cm de diâmetro, um tamanho de alvo
 * razoável para se mirar em VR a alguns metros de distância — ajuste
 * conforme o resultado visual.
 */
export const BALLOON_TYPES = {
  [BalloonTypeId.CLOWN_DELIGHT]: {
    id: BalloonTypeId.CLOWN_DELIGHT,
    modelUrl: 'assets/models/balloon-clown-delight.glb',
    scoreValue: 50,
    scale: 0.32,
  },
  [BalloonTypeId.PENALTY]: {
    id: BalloonTypeId.PENALTY,
    modelUrl: 'assets/models/balloon-carnival-penalty.glb',
    scoreValue: -10,
    scale: 0.38,
  },
  [BalloonTypeId.CARNIVAL_20]: {
    id: BalloonTypeId.CARNIVAL_20,
    modelUrl: 'assets/models/balloon-carnival-20.glb',
    scoreValue: 20,
    scale: 0.38,
  },
  [BalloonTypeId.SKY_ORB]: {
    id: BalloonTypeId.SKY_ORB,
    modelUrl: 'assets/models/balloon-sky-orb.glb',
    scoreValue: 10,
    scale: 0.38,
  },
};
