import { MouseController } from './MouseController.js';
import { XRInputHandler } from './XRInputHandler.js';

/**
 * Ponto único de entrada para "o jogador mirou e atirou", não importa
 * se foi com mouse ou com um dos dois controles VR. O Game (e os
 * painéis de UI 3D) só conversam com este manager — nunca diretamente
 * com MouseController ou XRInputHandler.
 *
 * Quando uma sessão XR está ativa, os raios dos controles VR são
 * usados; caso contrário, o raio do mouse. O evento de disparo
 * ('select') funciona nos dois modos ao mesmo tempo, então destravar
 * uma sessão VR no meio do jogo não perde nenhum handler já registrado.
 */
export class InputManager {
  constructor({ renderer, camera, playerRig, domElement }) {
    this.mouse = new MouseController(domElement, camera);
    this.xr = new XRInputHandler(renderer, playerRig);

    this._onSelect = null;
    this.mouse.onSelect((ray) => this._handleSelect(ray));
    this.xr.onSelect((ray) => this._handleSelect(ray));
  }

  /** Registra o callback único chamado ao "atirar", venha de onde vier. */
  onSelect(callback) {
    this._onSelect = callback;
  }

  _handleSelect(ray) {
    if (this._onSelect) this._onSelect(ray);
  }

  /** Habilita/desabilita a captura de disparos (ex: durante o menu). */
  setEnabled(enabled) {
    this.mouse.enabled = enabled;
    this.xr.enabled = enabled;
  }

  /**
   * Raios atualmente "ativos" para fins de destaque visual (hover) em
   * botões dos painéis 3D. Em VR, retorna os dois controles; fora de
   * VR, o raio atual do mouse.
   */
  getActiveRays(isPresenting) {
    return isPresenting ? this.xr.getActiveRays() : [this.mouse.getRay()];
  }
}
