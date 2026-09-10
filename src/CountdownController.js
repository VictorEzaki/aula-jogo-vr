// CountdownController.js
// Controla o timing da contagem regressiva antes do início da partida.
// Propositalmente livre de Three.js/DOM (mesmo espírito do GameStateMachine):
// só dispara callbacks, e quem chama decide como exibir (ex: atualizando
// um TextPanelFactory) e o que fazer ao terminar (ex: mudar de estado).

const DEFAULT_STEPS = ['3', '2', '1', 'JOGAR!'];
const DEFAULT_STEP_DURATION_MS = 1000;

export class CountdownController {
  /**
   * @param {Object} options
   * @param {(text: string, stepIndex: number) => void} options.onTick
   *   chamado a cada mudança de número/texto exibido
   * @param {() => void} options.onComplete
   *   chamado quando a contagem termina — é aqui que a partida deve
   *   efetivamente começar (transição para PLAYING)
   * @param {string[]} [options.steps] - textos exibidos em sequência
   * @param {number} [options.stepDurationMs] - duração de cada etapa em ms
   */
  constructor({
    onTick,
    onComplete,
    steps = DEFAULT_STEPS,
    stepDurationMs = DEFAULT_STEP_DURATION_MS,
  }) {
    this._onTick = onTick;
    this._onComplete = onComplete;
    this._steps = steps;
    this._stepDurationMs = stepDurationMs;
    this._timeoutId = null;
    this._currentIndex = -1;
  }

  start() {
    this.cancel();
    this._currentIndex = -1;
    this._advance();
  }

  cancel() {
    if (this._timeoutId !== null) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
  }

  _advance() {
    this._currentIndex++;
    if (this._currentIndex >= this._steps.length) {
      this._onComplete();
      return;
    }
    this._onTick(this._steps[this._currentIndex], this._currentIndex);
    this._timeoutId = setTimeout(() => this._advance(), this._stepDurationMs);
  }
}