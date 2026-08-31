export const GameStates = Object.freeze({
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER',
});

const MATCH_DURATION = 60;

/**
 * Estado puro da aplicação: em qual tela estamos, nome do jogador,
 * pontuação e tempo restante da partida atual. Não conhece Three.js
 * nem DOM — apenas dados, para ficar fácil de testar e observar.
 *
 * O loop de renderização (GameLoop) e o gerenciamento de estado
 * ficam propositalmente separados: este arquivo nunca chama
 * requestAnimationFrame / setAnimationLoop, e o GameLoop nunca
 * decide regras de jogo.
 */
export class GameStateMachine {
  constructor() {
    this.state = GameStates.MENU;
    this.playerName = '';
    this.score = 0;
    this.timeLeft = MATCH_DURATION;

    this._onGameOverCallbacks = [];
  }

  /** Chamado quando o jogador confirma o nome e clica em "Jogar". */
  startMatch(playerName) {
    this.playerName = playerName;
    this.score = 0;
    this.timeLeft = MATCH_DURATION;
    this.state = GameStates.PLAYING;
  }

  /** Reinicia a partida mantendo o mesmo jogador (fluxo "Tentar novamente"). */
  restartMatch() {
    this.startMatch(this.playerName);
  }

  /** Volta para a tela inicial de seleção de nome/leaderboard. */
  backToMenu() {
    this.state = GameStates.MENU;
    this.score = 0;
    this.timeLeft = MATCH_DURATION;
  }

  addScore(points) {
    if (this.state !== GameStates.PLAYING) return;
    this.score += points;
  }

  /** Avança o cronômetro. Encerra a partida automaticamente ao zerar. */
  tick(dt) {
    if (this.state !== GameStates.PLAYING) return;
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    if (this.timeLeft <= 0) {
      this._endMatch();
    }
  }

  _endMatch() {
    this.state = GameStates.GAMEOVER;
    const finalScore = this.score;
    const playerName = this.playerName;
    this._onGameOverCallbacks.forEach((cb) => cb({ playerName, score: finalScore }));
  }

  /** Registrado pelo Game para disparar o salvamento de score (ver ScoreService). */
  onGameOver(callback) {
    this._onGameOverCallbacks.push(callback);
  }
}
