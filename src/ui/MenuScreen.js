import { ScoreService } from '../services/ScoreService.js';

/**
 * Tela inicial em DOM: campo de nome + botão "Jogar" (desabilitado
 * até haver um nome) e o card de leaderboard. É DOM de propósito —
 * ao contrário do HUD e do Game Over, aqui o jogador precisa digitar
 * texto, e não existe um teclado prático em espaço 3D. Esta tela só
 * fica visível ANTES do jogador entrar em VR / começar a partida.
 */
export class MenuScreen {
  constructor() {
    this.root = document.getElementById('menu-screen');
    this.nameInput = document.getElementById('player-name-input');
    this.playButton = document.getElementById('play-button');
    this.leaderboardList = document.getElementById('leaderboard-list');

    this._onPlay = null;
    this._isBusy = false;

    this.nameInput.addEventListener('input', () => this._updatePlayButtonState());
    this.playButton.addEventListener('click', () => this._handlePlayClick());
    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !this.playButton.disabled) this._handlePlayClick();
    });
  }

  /** @param {(playerName: string) => void} callback */
  onPlay(callback) {
    this._onPlay = callback;
  }

  _updatePlayButtonState() {
    const hasName = this.nameInput.value.trim().length > 0;
    this.playButton.disabled = this._isBusy || !hasName;
  }

  /** Usado enquanto o modelo 3D da barraca ainda está carregando. */
  setBusy(isBusy) {
    this._isBusy = isBusy;
    this.playButton.textContent = isBusy ? 'CARREGANDO...' : 'JOGAR';
    this._updatePlayButtonState();
  }

  _handlePlayClick() {
    const playerName = this.nameInput.value.trim();
    if (!playerName) return;
    if (this._onPlay) this._onPlay(playerName);
  }

  async show() {
    this.root.classList.remove('hidden');
    this._updatePlayButtonState();
    await this._refreshLeaderboard();
  }

  hide() {
    this.root.classList.add('hidden');
  }

  async _refreshLeaderboard() {
    this.leaderboardList.innerHTML = '<li class="leaderboard-loading">Carregando...</li>';
    const top5 = await ScoreService.fetchLeaderboard();

    this.leaderboardList.innerHTML = '';
    top5.forEach((entry, index) => {
      const item = document.createElement('li');
      item.innerHTML = `
        <span><span class="leaderboard-rank">${index + 1}º</span>${entry.playerName}</span>
        <span>${entry.score}</span>
      `;
      this.leaderboardList.appendChild(item);
    });
  }
}
