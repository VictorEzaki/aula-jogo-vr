import * as THREE from 'three';
import { BalloonTypeId } from './BalloonTypes.js';
import { Balloon } from './Balloon.js';
import { BALLOON_SLOTS } from './BalloonSlots.js';

// --- Clown Delight: bônus raro, um por vez ---
const CLOWN_SPAWN_INTERVAL = 5; // "a cada 5 segundos"
const CLOWN_LIFETIME = 2; // "some se não estourar em 2 segundos"

// --- Penalidade: aparece a cada N balões positivos estourados ---
const PENALTY_TRIGGER_COUNT = 5; // "a cada 5 balões estourados que somam pontuação"
const PENALTY_MAX_CONCURRENT = 3;
const PENALTY_LIFETIME = 4;

// --- Pool "sem especificação de tempo" -> intervalo aleatório ---
// Não foi pedido um valor específico, então escolhi um intervalo que
// mantém o ritmo do jogo ativo sem exagerar na quantidade de balões
// em tela ao mesmo tempo. Fácil de recalibrar depois de testar.
const RANDOM_POOL_TYPES = [BalloonTypeId.CARNIVAL_20, BalloonTypeId.SKY_ORB];
const RANDOM_POOL_MIN_INTERVAL = 1.5;
const RANDOM_POOL_MAX_INTERVAL = 3.5;
const RANDOM_POOL_LIFETIME = 3.5;
const RANDOM_POOL_MAX_CONCURRENT = 3;

// Tipos que contam para o gatilho da penalidade ("balões... que somam pontuação").
const POSITIVE_TYPES = new Set([
  BalloonTypeId.CLOWN_DELIGHT,
  BalloonTypeId.CARNIVAL_20,
  BalloonTypeId.SKY_ORB,
]);

export class BalloonSpawner {
  constructor(parent) {
    this.group = new THREE.Group();
    parent.add(this.group);

    this.active = [];
    this._occupiedSlots = new Set();

    this._clownTimer = 0;
    this._positivePopCount = 0;
    this._randomPoolTimer = this._rollNextRandomInterval();
  }

  /** Chamado ao iniciar/reiniciar uma partida — limpa todos os balões e timers. */
  reset() {
    this.active.forEach((balloon) => this.group.remove(balloon.mesh));
    this.active = [];
    this._occupiedSlots.clear();
    this._clownTimer = 0;
    this._positivePopCount = 0;
    this._randomPoolTimer = this._rollNextRandomInterval();
  }

  _rollNextRandomInterval() {
    return RANDOM_POOL_MIN_INTERVAL + Math.random() * (RANDOM_POOL_MAX_INTERVAL - RANDOM_POOL_MIN_INTERVAL);
  }

  _countActive(typeId) {
    return this.active.filter((b) => b.typeId === typeId && b.status === 'alive').length;
  }

  _pickFreeSlot() {
    const free = BALLOON_SLOTS.map((_, i) => i).filter((i) => !this._occupiedSlots.has(i));
    if (free.length === 0) return null;
    return free[Math.floor(Math.random() * free.length)];
  }

  _spawn(typeId, lifetimeSeconds) {
    const slotIndex = this._pickFreeSlot();
    if (slotIndex === null) return; // sem vaga livre agora — tenta de novo no próximo ciclo

    const balloon = new Balloon(typeId, BALLOON_SLOTS[slotIndex], lifetimeSeconds);
    balloon.slotIndex = slotIndex;
    this._occupiedSlots.add(slotIndex);
    this.active.push(balloon);
    this.group.add(balloon.mesh);
  }

  /**
   * Chamado pelo Game quando um raio acerta um balão vivo (ver
   * resolveBalloon). Aplica a regra da penalidade e devolve os pontos
   * a somar (pode ser negativo).
   */
  popBalloon(balloon) {
    const wasAlive = balloon.pop();
    if (!wasAlive) return 0;

    if (POSITIVE_TYPES.has(balloon.typeId)) {
      this._positivePopCount += 1;
      if (
        this._positivePopCount % PENALTY_TRIGGER_COUNT === 0 &&
        this._countActive(BalloonTypeId.PENALTY) < PENALTY_MAX_CONCURRENT
      ) {
        this._spawn(BalloonTypeId.PENALTY, PENALTY_LIFETIME);
      }
    }

    return balloon.scoreValue;
  }

  /** Meshes de todos os balões vivos (agrupados por balão), prontos para raycastFromRay. */
  getHittableMeshes() {
    const meshes = [];
    for (const balloon of this.active) {
      if (balloon.status !== 'alive') continue;
      balloon.mesh.traverse((child) => {
        if (child.isMesh) meshes.push(child);
      });
    }
    return meshes;
  }

  /** A partir de uma mesh atingida pelo raycast, devolve a instância de Balloon dona dela. */
  resolveBalloon(hitObject) {
    return hitObject.userData.balloonRef || null;
  }

  update(dt) {
    // Clown Delight: intervalo fixo, só 1 por vez.
    this._clownTimer += dt;
    if (this._clownTimer >= CLOWN_SPAWN_INTERVAL) {
      this._clownTimer = 0;
      if (this._countActive(BalloonTypeId.CLOWN_DELIGHT) === 0) {
        this._spawn(BalloonTypeId.CLOWN_DELIGHT, CLOWN_LIFETIME);
      }
    }

    // Pool aleatório (carnival_20 + sky_orb) — sem especificação de tempo no pedido.
    this._randomPoolTimer -= dt;
    if (this._randomPoolTimer <= 0) {
      this._randomPoolTimer = this._rollNextRandomInterval();
      const poolCount = RANDOM_POOL_TYPES.reduce((sum, t) => sum + this._countActive(t), 0);
      if (poolCount < RANDOM_POOL_MAX_CONCURRENT) {
        const typeId = RANDOM_POOL_TYPES[Math.floor(Math.random() * RANDOM_POOL_TYPES.length)];
        this._spawn(typeId, RANDOM_POOL_LIFETIME);
      }
    }

    // Atualiza balões ativos e descarta os que terminaram (estourados ou expirados).
    for (let i = this.active.length - 1; i >= 0; i--) {
      const balloon = this.active[i];
      balloon.update(dt);
      if (balloon.done) {
        this.group.remove(balloon.mesh);
        this._occupiedSlots.delete(balloon.slotIndex);
        this.active.splice(i, 1);
      }
    }
  }
}
