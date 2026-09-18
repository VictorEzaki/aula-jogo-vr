import { MenuScreen } from './MenuScreen.js';
import { HUDPanel3D } from './panels/HUDPanel3D.js';
import { GameOverPanel3D } from './panels/GameOverPanel3D.js';
import { CountdownPanel3D } from './panels/CountdownPanel3D.js';
import { ScorePopupManager } from './panels/ScorePopupManager.js';

/**
 * Fachada única para as três telas do jogo. O Game nunca manipula
 * DOM ou meshes de UI diretamente — só chama showMenu()/showHUD()/
 * showGameOver() e registra os callbacks de interação. Isso mantém a
 * lógica de estado (GameStateMachine) desacoplada de COMO cada tela é
 * exibida (DOM vs painel 3D), então trocar a implementação de uma
 * tela no futuro não afeta as outras.
 */
export class UIManager {
  constructor({ scene, worldGroup }) {
    this.menu = new MenuScreen();
    this.hud = new HUDPanel3D(worldGroup);
    this.gameOver = new GameOverPanel3D(scene);
    this.countdown = new CountdownPanel3D(scene);
    this.scorePopups = new ScorePopupManager(worldGroup);
  }

  showMenu() {
    this.hud.hide();
    this.gameOver.hide();
    this.countdown.hide();
    this.scorePopups.clear();
    return this.menu.show();
  }

  hideMenu() {
    this.menu.hide();
  }

  showHUD() {
    this.gameOver.hide();
    this.countdown.hide();
    this.scorePopups.clear(); // evita popup "fantasma" sobrando de uma partida anterior
    this.hud.show();
  }

  /** Mostra o painel 3D de contagem regressiva (e esconde o Game Over, no caso do "Tentar novamente"). */
  showCountdown() {
    this.gameOver.hide();
    this.countdown.show();
  }

  updateCountdownText(text) {
    this.countdown.setText(text);
  }

  hideCountdown() {
    this.countdown.hide();
  }

  updateHUD(score, timeLeft) {
    this.hud.update(score, timeLeft);
  }

  /** Dispara o "+50"/"-10" flutuante na posição onde o balão foi estourado. */
  spawnScorePopup(position, points) {
    this.scorePopups.spawn(position, points);
  }

  /** Deve ser chamado todo frame durante PLAYING para animar os popups ativos. */
  updateScorePopups(dt, camera) {
    this.scorePopups.update(dt, camera);
  }

  showGameOver(finalScore, handlers) {
    this.gameOver.show(finalScore, handlers);
  }

  /** Repassa os raios ativos (mouse ou controles VR) para destacar botões mirados. */
  updateInteractionHover(rays) {
    this.gameOver.updateHover(rays);
  }

  /** Tenta resolver um "disparo" contra a UI 3D ativa. Retorna true se algum botão foi clicado. */
  handleSelect(ray) {
    return this.gameOver.handleSelect(ray);
  }
}
