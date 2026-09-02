import { createBalloonMesh } from './BalloonModelLoader.js';
import { BALLOON_TYPES } from './BalloonTypes.js';

const POP_ANIMATION_SECONDS = 0.18;

/**
 * Um balão ativo na cena. Segue o mesmo contrato usado pelo Target.js
 * original (mesh + scoreValue + update(dt)), só que com dois motivos
 * de remoção em vez de um: "estourado" (o jogador acertou) e
 * "expirado" (o tempo de vida acabou sem ser acertado).
 *
 * Estados: 'alive' (pode ser acertado) -> 'removing' (tocando a
 * animação de saída) -> 'done' (o BalloonSpawner pode descartar).
 */
export class Balloon {
  constructor(typeId, position, lifetimeSeconds) {
    this.typeId = typeId;
    this.scoreValue = BALLOON_TYPES[typeId].scoreValue;
    this._baseScale = BALLOON_TYPES[typeId].scale;

    this.mesh = createBalloonMesh(typeId);
    this.mesh.position.copy(position);
    this.mesh.traverse((child) => {
      if (child.isMesh) child.userData.balloonRef = this;
    });

    this.status = 'alive';
    this._age = 0;
    this._removeTimer = 0;
    this._lifetime = lifetimeSeconds;
    this._wasPopped = false;
    this.slotIndex = null; // preenchido pelo BalloonSpawner
  }

  /** Chamado pelo BalloonSpawner quando um raio acerta o balão. Retorna true se valeu o acerto. */
  pop() {
    if (this.status !== 'alive') return false;
    this.status = 'removing';
    this._wasPopped = true;
    return true;
  }

  get done() {
    return this.status === 'done';
  }

  update(dt) {
    if (this.status === 'alive') {
      this._age += dt;
      // leve flutuação vertical, só para não parecer estático
      this.mesh.position.y += Math.sin(this._age * 3) * 0.0006;

      if (this._age >= this._lifetime) {
        this.status = 'removing';
        this._wasPopped = false;
      }
      return;
    }

    if (this.status === 'removing') {
      this._removeTimer += dt;
      const t = Math.min(this._removeTimer / POP_ANIMATION_SECONDS, 1);

      const scaleT = this._wasPopped
        ? t < 0.4
          ? 1 + t // estourado: incha rapidamente...
          : Math.max(0, 1.4 - (t - 0.4) * 2.33) // ...e some
        : 1 - t; // expirado: só encolhe suavemente

      this.mesh.scale.setScalar(this._baseScale * Math.max(scaleT, 0));

      if (t >= 1) this.status = 'done';
    }
  }
}
