import { ScoreService } from '../services/ScoreService.js';
import { BalloonTypeId, BALLOON_TYPES } from '../gameplay/balloons/BalloonTypes.js';
import { MATCH_DURATION } from '../core/GameStateMachine.js';
import { generateBalloonThumbnails } from './BalloonThumbnailRenderer.js';

// Ordem de exibição + nome amigável de cada balão no card de
// instruções. O nome não é mais exibido ao lado (o próprio modelo 3D
// renderizado já identifica o balão visualmente — ver
// BalloonThumbnailRenderer.js), mas continua servindo de alt/aria
// para leitores de tela. O valor de pontos em si NUNCA é digitado
// aqui — vem de BALLOON_TYPES (a mesma fonte que o jogo usa para
// pontuar de verdade), então a lista nunca fica desatualizada em
// relação à regra real.
const BALLOON_DISPLAY_ORDER = [
  { id: BalloonTypeId.SKY_ORB, label: 'Sky Orb (Padrão)' },
  { id: BalloonTypeId.CARNIVAL_20, label: 'Carnival 20' },
  { id: BalloonTypeId.CLOWN_DELIGHT, label: 'Clown Delight' },
  { id: BalloonTypeId.PENALTY, label: 'Penalidade' },
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
    this.scoringGrid = document.getElementById('scoring-grid');

    this._onPlay = null;
    this._isBusy = false;

    this.nameInput.addEventListener('input', () => this._updatePlayButtonState());
    this.playButton.addEventListener('click', () => this._handlePlayClick());
    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !this.playButton.disabled) this._handlePlayClick();
    });

    // Estático (não muda em runtime), então só precisa rodar uma vez.
    // Não é aguardado aqui de propósito: o texto (duração da partida)
    // aparece de imediato, e o grid de pontuação é preenchido assim
    // que os thumbnails dos balões terminam de renderizar, sem
    // travar a construção da tela de menu.
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

  /** Preenche o tempo de partida e o grid de pontuação (com o modelo 3D de cada balão) do card de instruções. */
  async _renderInstructions() {
    if (this.matchDurationEl) {
      this.matchDurationEl.textContent = String(MATCH_DURATION);
    }

    if (!this.scoringGrid) return;
    this.scoringGrid.innerHTML = '';

    // Monta os itens já com o valor em pontos (isso não depende do
    // modelo 3D ter carregado) e um placeholder no lugar da imagem,
    // trocado pelo thumbnail real assim que ele fica pronto — assim a
    // pontuação aparece de imediato, sem esperar o load dos GLBs.
    const imageEls = {};
    BALLOON_DISPLAY_ORDER.forEach(({ id, label }) => {
      const type = BALLOON_TYPES[id];
      if (!type) return;

      const isPenalty = type.scoreValue < 0;
      const sign = isPenalty ? '' : '+';

      const item = document.createElement('div');
      item.className = 'scoring-item';
      item.innerHTML = `
        <div class="scoring-thumb-wrap">
          <img class="scoring-thumb" alt="${label}" />
        </div>
        <span class="scoring-value ${isPenalty ? 'scoring-negative' : 'scoring-positive'}">${sign}${type.scoreValue} pts</span>
      `;
      this.scoringGrid.appendChild(item);
      imageEls[id] = item.querySelector('.scoring-thumb');
    });

    try {
      const thumbnails = await generateBalloonThumbnails();
      Object.entries(thumbnails).forEach(([id, dataUrl]) => {
        if (imageEls[id]) imageEls[id].src = dataUrl;
      });
    } catch (err) {
      // Se o render dos thumbnails falhar por algum motivo (ex.: sem
      // suporte a WebGL), o grid segue exibindo os pontos normalmente
      // — só fica sem a imagem do balão.
      console.error('Falha ao gerar os thumbnails dos balões:', err);
    }
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
