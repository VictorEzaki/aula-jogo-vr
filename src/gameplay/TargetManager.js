import * as THREE from 'three';
import { Target } from './Target.js';

// Posição estimada da prateleira de latas dentro do modelo GLB da
// barraca (carnival-shooting-gallery.glb), calculada a partir do
// bounding box do arquivo (ver ShootingStandModel.js) — mas SEM
// renderização real para conferir visualmente. Trate como ponto de
// partida: abra o jogo no navegador e ajuste estes três números até
// as latas encostarem na prateleira do modelo.
const TARGET_BASE_Y = 1.4; // altura da fileira de baixo da pirâmide
const TARGET_BASE_Z = 0.3; // profundidade (em frente ao fundo da barraca)
const TARGET_SPACING = 0.4; // as latas originais foram desenhadas para uma barraca mais larga

/**
 * Cria e gerencia todas as latas da barraca: a pilha inicial,
 * a atualização de animações e as pequenas variações (respawn,
 * lata especial) descritas no prompt.
 */
export class TargetManager {
  constructor(parent) {
    this.group = new THREE.Group();
    parent.add(this.group);

    this.targets = [];
    this._specialCycleTimer = 0;
    this._specialCycleInterval = 4;

    this._buildPyramid();
  }

  _buildPyramid() {
    // Pilha estilo "pirâmide": 4 - 3 - 2 - 1, apoiada na prateleira do modelo GLB.
    const rows = [4, 3, 2, 1];
    const spacing = TARGET_SPACING;
    const rowHeight = 0.4;
    const baseY = TARGET_BASE_Y;
    const baseZ = TARGET_BASE_Z;

    rows.forEach((count, rowIndex) => {
      const rowWidth = (count - 1) * spacing;
      for (let i = 0; i < count; i++) {
        const x = -rowWidth / 2 + i * spacing;
        const y = baseY + rowIndex * rowHeight;
        const position = new THREE.Vector3(x, y, baseZ);
        const target = new Target(position);
        this.targets.push(target);
        this.group.add(target.mesh);
      }
    });

    // Uma lata especial aleatória para começar a partida com variedade
    this._promoteRandomToSpecial();
  }

  _promoteRandomToSpecial() {
    const candidates = this.targets.filter((t) => t.active && !t.isSpecial);
    if (candidates.length === 0) return;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    chosen.isSpecial = true;
    chosen.scoreValue = 250;
    this.group.remove(chosen.mesh);
    chosen.mesh = chosen._buildMesh();
    chosen.mesh.position.copy(chosen.basePosition);
    chosen.mesh.userData.target = chosen;
    this.group.add(chosen.mesh);
  }

  /** Retorna todos os meshes filhos usados para o raycaster. */
  getHittableMeshes() {
    const meshes = [];
    this.targets.forEach((t) => {
      if (t.active) {
        t.mesh.traverse((child) => {
          if (child.isMesh) meshes.push(child);
        });
      }
    });
    return meshes;
  }

  /** Dado um mesh atingido pelo raycaster, encontra o Target correspondente. */
  resolveTarget(mesh) {
    let obj = mesh;
    while (obj) {
      if (obj.userData && obj.userData.target) return obj.userData.target;
      obj = obj.parent;
    }
    return null;
  }

  update(dt) {
    this.targets.forEach((t) => t.update(dt));

    this._specialCycleTimer += dt;
    if (this._specialCycleTimer >= this._specialCycleInterval) {
      this._specialCycleTimer = 0;
      if (Math.random() < 0.5) {
        this._promoteRandomToSpecial();
      }
    }
  }

  reset() {
    this.targets.forEach((t) => {
      this.group.remove(t.mesh);
    });
    this.targets = [];
    this._buildPyramid();
  }
}
