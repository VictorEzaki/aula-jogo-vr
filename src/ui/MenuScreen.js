import { ScoreService } from '../services/ScoreService.js';
import { BalloonTypeId, BALLOON_TYPES } from '../gameplay/balloons/BalloonTypes.js';
import { MATCH_DURATION } from '../core/GameStateMachine.js';

// Ordem de exibição + ícone/nome amigável para cada balão no card de
// instruções. O valor de pontos em si NUNCA é digitado aqui — vem de
// BALLOON_TYPES (a mesma fonte que o jogo usa para pontuar de verdade),
// então a tabela nunca fica desatualizada em relação à regra real.
const BALLOON_DISPLAY_ORDER = [
  { id: BalloonTypeId.SKY_ORB, icon: '🎈', label: 'Sky Orb (Padrão)' },
  { id: BalloonTypeId.CARNIVAL_20, icon: '🔵', label: 'Carnival 20' },
  { id: BalloonTypeId.CLOWN_DELIGHT, icon: '🤡', label: 'Clown Delight' },
  { id: BalloonTypeId.PENALTY, icon: '💀', label: 'Penalidade' },
];

/**
 * Tela inicial em DOM: campo de nome + botão "Jogar" (desabilitado
 * até haver um nome), o card de leaderboard e o card de instruções/
 * pontuação. É DOM de propósito — ao contrário do HUD e do Game Over,
 * aqui o jogador precisa digitar texto, e não existe um teclado
 * prático em espaço 3D. Esta tela só fica visível ANTES do jogador
 * entrar em VR / começar a partida.
 */
export class MenuScreen {
  constructor() {
    this.root = document.getElementById('menu-screen');
    this.nameInput = document.getElementById('player-name-input');
    this.playButton = document.getElementById('play-button');
    this.leaderboardList = document.getElementById('leaderboard-list');
    this.matchDurationEl = document.getElementById('instructions-duration');
    this.scoringTableBody = document.getElementById('scoring-table-body');

    this._onPlay = null;
    this._isBusy = false;

    this.nameInput.addEventListener('input', () => this._updatePlayButtonState());
    this.playButton.addEventListener('click', () => this._handlePlayClick());
    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !this.playButton.disabled) this._handlePlayClick();
    });

    // Estático (não muda em runtime), então só precisa rodar uma vez.
    this._renderInstructions();
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

  /** Preenche o tempo de partida e a tabela de pontuação do card de instruções. */
  _renderInstructions() {
    if (this.matchDurationEl) {
      this.matchDurationEl.textContent = String(MATCH_DURATION);
    }

    if (!this.scoringTableBody) return;
    this.scoringTableBody.innerHTML = '';

    BALLOON_DISPLAY_ORDER.forEach(({ id, icon, label }) => {
      const type = BALLOON_TYPES[id];
      if (!type) return;

      const isPenalty = type.scoreValue < 0;
      const sign = isPenalty ? '' : '+';

      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="scoring-name"><span aria-hidden="true">${icon}</span> ${label}</td>
        <td class="scoring-value ${isPenalty ? 'scoring-negative' : 'scoring-positive'}">${sign}${type.scoreValue} pts</td>
      `;
      this.scoringTableBody.appendChild(row);
    });
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
