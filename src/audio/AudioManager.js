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
  '50': './../../public/audio/balloon_clown.wav',
  '-10': './../../public/audio/sound_penalidade.mp3',
  '10': './../../public/audio/ballon_pop1.wav',
  '20': './../../public/audio/balloon_pop.mp3',
};

const THEME_SRC = './../../public/audio/theme.mp3';

export class AudioManager {
  constructor() {
    this._theme = null;
    this._sfxPool = new Map(); // scoreValue (string) -> HTMLAudioElement[]
    this._fadeRafId = null;
    this._themeStarted = false;
    this._pendingAutoplayHandler = null;

    this._buildTheme();
    this._buildSfxPool();
  }

  _buildTheme() {
    const audio = new Audio(THEME_SRC);
    audio.loop = true;
    audio.volume = THEME_VOLUME_MENU;
    audio.preload = 'auto';
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
   * Chame assim que o jogador acessa o site (ex: no bootstrap do app).
   * Navegadores bloqueiam autoplay com som até haver uma interação do
   * usuário. Este método tenta tocar imediatamente e, se for bloqueado,
   * agenda o início para o primeiro clique/toque/tecla.
   */
  startThemeOnEntry() {
    if (this._themeStarted) return;

    this._theme.play()
      .then(() => {
        this._themeStarted = true;
        this._removePendingAutoplayHandler();
      })
      .catch(() => {
        this._armPendingAutoplayHandler();
      });
  }

  _armPendingAutoplayHandler() {
    if (this._pendingAutoplayHandler) return;
    const handler = () => {
      this._theme.play()
        .then(() => { this._themeStarted = true; })
        .catch(() => {});
      this._removePendingAutoplayHandler();
    };
    this._pendingAutoplayHandler = handler;
    ['pointerdown', 'keydown', 'touchstart'].forEach((evt) =>
      window.addEventListener(evt, handler, { once: true })
    );
  }

  _removePendingAutoplayHandler() {
    if (!this._pendingAutoplayHandler) return;
    const handler = this._pendingAutoplayHandler;
    ['pointerdown', 'keydown', 'touchstart'].forEach((evt) =>
      window.removeEventListener(evt, handler)
    );
    this._pendingAutoplayHandler = null;
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
    this._removePendingAutoplayHandler();
    if (this._fadeRafId !== null) cancelAnimationFrame(this._fadeRafId);
    this._theme.pause();
  }
}