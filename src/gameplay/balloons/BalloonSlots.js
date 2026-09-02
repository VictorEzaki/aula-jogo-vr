import * as THREE from 'three';

/**
 * Grade de 9 posições (3 colunas x 3 fileiras) representando as
 * aberturas sob as prateleiras do balcão de prêmios
 * (carnival-prize-booth.glb). Calculadas a partir da análise do
 * bounding box do modelo (ver PrizeBoothModel.js: escala 1.5,
 * posição (0, 1.09, -4)) — mas, como não há como renderizar a cena
 * aqui para conferir visualmente, trate como ESTIMATIVA DE PARTIDA e
 * ajuste os três arrays abaixo depois de ver o resultado no
 * navegador (é só abrir o jogo e comparar com onde ficam as
 * prateleiras de verdade).
 */
const COLUMNS_X = [-0.9, 0, 0.9];
const ROWS_Y = [0.72, 1.09, 1.39]; // de baixo para cima, uma por prateleira
const SLOT_Z = -3.75; // um pouco à frente do fundo da vitrine

export const BALLOON_SLOTS = ROWS_Y.flatMap((y) =>
  COLUMNS_X.map((x) => new THREE.Vector3(x, y, SLOT_Z))
);
