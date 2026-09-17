/**
 * Botão de mutar/desmutar a música tema, fixo no canto superior
 * direito da tela. Existe fora do menu (não faz parte de #menu-screen)
 * de propósito: a música toca durante o menu, a contagem regressiva,
 * a partida e o game over, então o controle precisa ficar visível e
 * clicável em todas essas telas — inclusive na visão "espelhada" do
 * navegador enquanto o jogador está dentro do headset.
 *
 * Este componente só cuida da UI (ícone, estado visual, clique). Quem
 * decide o que "mutado"/"desmutado" significa para o áudio de fato é
 * o AudioManager — ver Game.js, onde o clique aqui chama
 * audioManager.setMuted(...).
 */
export class MuteButton {
  /** @param {{ initialMuted?: boolean, onToggle?: (muted: boolean) => void }} options */
  constructor({ initialMuted = true, onToggle = null } = {}) {
    this.button = document.getElementById('mute-button');
    this._muted = initialMuted;
    this._onToggle = onToggle;

    this._render();
    this.button.addEventListener('click', () => this._handleClick());
  }

  _handleClick() {
    this._muted = !this._muted;
    this._render();
    // É este clique — um gesto real do jogador — que autoriza o
    // navegador a liberar o áudio com som (ver AudioManager.setMuted).
    if (this._onToggle) this._onToggle(this._muted);
  }

  _render() {
    this.button.textContent = this._muted ? '🔇' : '🔊';
    this.button.classList.toggle('is-muted', this._muted);
    const label = this._muted ? 'Ativar música' : 'Desativar música';
    this.button.setAttribute('aria-label', label);
    this.button.title = label;
    this.button.setAttribute('aria-pressed', String(!this._muted));
  }

  isMuted() {
    return this._muted;
  }
}
