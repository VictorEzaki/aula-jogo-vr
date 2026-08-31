import * as THREE from 'three';

/**
 * Loop de animação baseado em renderer.setAnimationLoop, que funciona
 * de forma transparente tanto em modo normal (rAF por baixo dos panos)
 * quanto durante uma sessão WebXR (sincronizado com o refresh do
 * headset). É por isso que NUNCA usamos requestAnimationFrame direto
 * neste projeto: setAnimationLoop é a única API que funciona nos dois
 * contextos sem precisar de código condicional.
 *
 * Esta classe só conhece "chame updateCallback(dt) a cada frame" —
 * não sabe nada sobre menu, pontuação ou estado de jogo.
 */
export class GameLoop {
  constructor(renderer, updateCallback) {
    this.renderer = renderer;
    this.updateCallback = updateCallback;
    this.clock = new THREE.Clock();
  }

  start() {
    this.clock.start();
    this.renderer.setAnimationLoop(() => {
      const dt = Math.min(this.clock.getDelta(), 0.05);
      this.updateCallback(dt);
    });
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }
}
