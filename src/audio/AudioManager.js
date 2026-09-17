// AudioManager.js
// Gerencia a música tema (com fade de volume gradual) e os efeitos sonoros
// de estouro de balão. Não depende de Three.js nem do GameLoop principal —
// usa HTMLAudioElement puro, então pode ser instanciado antes da cena 3D
// existir (ex: assim que o app carrega, no menu).

const THEME_VOLUME_MENU = 0.6;      // volume da música fora da partida (menu)
const THEME_VOLUME_PLAYING = 0.15;  // volume "baixo" durante a contagem/partida
const THEME_FADE_DURATION_MS = 1500; // duração da transição gradual de volume

const SFX_VOLUME = 0.9;
const SFX_POOL_SIZE = 4; // instâncias por som, para permitir pops sobrepostos

// Mapa scoreValue (balão) -> arquivo de efeito sonoro.
// Ajuste os caminhos caso os arquivos fiquem em outra pasta dentro de /public.
const BALLOON_SFX_MAP = {
  '50': '/audio/balloon_clown.wav',
  '-10': '/audio/sound_penalidade.mp3',
  '10': '/audio/ballon_pop1.wav',
  '20': '/audio/balloon_pop.mp3',
};

const THEME_SRC = '/audio/theme.mp3';

export class AudioManager {
  constructor() {
    this._theme = null;
    this._sfxPool = new Map(); // scoreValue (string) -> HTMLAudioElement[]
    this._fadeRafId = null;

    this._buildTheme();
    this._buildSfxPool();
  }

  _buildTheme() {
    const audio = new Audio(THEME_SRC);
    audio.loop = true;
    audio.volume = THEME_VOLUME_MENU;
    audio.preload = 'auto';
    // Começa sempre mutado — ver initTheme().
    audio.muted = true;
    this._theme = audio;
  }

  _buildSfxPool() {
    for (const [scoreValue, src] of Object.entries(BALLOON_SFX_MAP)) {
      const pool = [];
      for (let i = 0; i < SFX_POOL_SIZE; i++) {
        const a = new Audio(src);
        a.volume = SFX_VOLUME;
        a.preload = 'auto';
        pool.push(a);
      }
      this._sfxPool.set(scoreValue, pool);
    }
  }

  /**
   * Chame assim que o app inicializa (bootstrap, antes mesmo do menu).
   * Navegadores bloqueiam autoplay COM som, mas praticamente todos
   * permitem autoplay de mídia MUTADA — inclusive dentro de uma sessão
   * WebXR, onde o esquema antigo (tentar tocar e, se falhar, esperar o
   * primeiro pointerdown/keydown/touchstart na window) não era confiável:
   * o gatilho dos controles de VR dispara 'selectstart' no controller,
   * não um evento de ponteiro/teclado na window, então esse listener
   * global às vezes nunca era acionado e a música nunca começava.
   *
   * Com o áudio já tocando (mutado) desde o início, o botão de
   * mutar/desmutar só precisa alternar `.muted` — e esse clique real
   * do jogador é sempre um gesto de usuário válido para desbloquear o
   * áudio, tanto em desktop quanto dentro do headset.
   */
  initTheme() {
    this._theme.muted = true;
    this._theme.play().catch(() => {
      // Se até o autoplay mutado for bloqueado, não há problema: o
      // primeiro clique em "desmutar" (setMuted(false)) chama play()
      // novamente, e nesse momento é um gesto direto do usuário.
    });
  }

  /** true = música mutada. Reflete o estado exibido no botão 🔇/🔊. */
  isMuted() {
    return this._theme.muted;
  }

  /**
   * Alterna mudo/som. Chamado pelo botão do canto superior direito.
   * Ao desmutar, garante que a música esteja realmente tocando (caso
   * o autoplay mutado inicial tenha sido bloqueado) — como isso roda
   * dentro do handler de clique do jogador, o play() aqui é permitido.
   */
  setMuted(muted) {
    this._theme.muted = muted;
    if (!muted && this._theme.paused) {
      this._theme.play().catch(() => {});
    }
  }

  toggleMute() {
    this.setMuted(!this.isMuted());
    return this.isMuted();
  }

  /** Abaixa a música gradualmente. Chame ao iniciar a contagem regressiva. */
  duckThemeForGameplay() {
    this._fadeThemeVolumeTo(THEME_VOLUME_PLAYING, THEME_FADE_DURATION_MS);
  }

  /** Restaura o volume da música gradualmente. Chame no menu / game over. */
  restoreThemeVolume() {
    this._fadeThemeVolumeTo(THEME_VOLUME_MENU, THEME_FADE_DURATION_MS);
  }

  _fadeThemeVolumeTo(targetVolume, durationMs) {
    if (this._fadeRafId !== null) {
      cancelAnimationFrame(this._fadeRafId);
      this._fadeRafId = null;
    }
    const startVolume = this._theme.volume;
    const startTime = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      // easing suave (ease-out) para a transição não parecer abrupta
      const eased = 1 - Math.pow(1 - t, 2);
      this._theme.volume = startVolume + (targetVolume - startVolume) * eased;
      if (t < 1) {
        this._fadeRafId = requestAnimationFrame(step);
      } else {
        this._fadeRafId = null;
      }
    };
    this._fadeRafId = requestAnimationFrame(step);
  }

  /** Toca o efeito sonoro correspondente ao valor de pontos do balão estourado. */
  playBalloonPopSfx(scoreValue) {
    const key = String(scoreValue);
    const pool = this._sfxPool.get(key);
    if (!pool) {
      console.warn(`[AudioManager] Nenhum SFX mapeado para scoreValue=${scoreValue}`);
      return;
    }
    // Reusa uma instância livre do pool (permite pops sobrepostos)
    let audio = pool.find((a) => a.paused || a.ended);
    if (!audio) audio = pool[0];
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  dispose() {
    if (this._fadeRafId !== null) cancelAnimationFrame(this._fadeRafId);
    this._theme.pause();
  }
}