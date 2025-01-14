import alarmSoundEffect from '@/assets/sound-effects/alarm.mp3'

const SOUND_EFFECTS = {
  ALARM: 'alarm',
} as const

type SingleSoundEffectType = typeof SOUND_EFFECTS.ALARM

type SoundEffectConfig = {
  [SOUND_EFFECTS.ALARM]: string
}

class SoundEffectManager {
  private singleSounds: Map<SingleSoundEffectType, HTMLAudioElement> = new Map()
  private volume: number = 0.5

  constructor(config: SoundEffectConfig) {
    Object.entries(config).forEach(([type, src]) => {
      this.singleSounds.set(
        type as SingleSoundEffectType,
        this.createAudio({ src })
      )
    })

    this.preloadAll()
  }

  private createAudio({ src }: { src: string }): HTMLAudioElement {
    const audio = new Audio(src)
    audio.volume = this.volume
    return audio
  }

  play({
    type,
    shouldLoop = false,
  }: {
    type: SingleSoundEffectType
    shouldLoop: boolean
  }) {
    const sound = this.singleSounds.get(type)
    if (sound) {
      sound.currentTime = 0
      sound.loop = shouldLoop
      sound.play().catch((e) => console.error('Error playing sound effect:', e))
    }
  }

  setVolume({ volume }: { volume: number }) {
    this.volume = Math.max(0, Math.min(1, volume))
    this.singleSounds.forEach((sound) => (sound.volume = this.volume))
  }

  stop({ type }: { type: SingleSoundEffectType }) {
    const sound = this.singleSounds.get(type)
    if (sound) {
      sound.pause()
      sound.currentTime = 0
    }
  }

  getVolume(): number {
    return this.volume
  }

  preloadAll() {
    this.singleSounds.forEach((sound) => sound.load())
  }
}

let soundEffectManager: SoundEffectManager | null = null

function getSoundEffectManager(): SoundEffectManager {
  if (typeof window !== 'undefined' && !soundEffectManager) {
    soundEffectManager = new SoundEffectManager({
      [SOUND_EFFECTS.ALARM]: alarmSoundEffect,
    })
  }

  if (!soundEffectManager) {
    throw new Error('Sound effect manager not initialized')
  }

  return soundEffectManager
}

export { SOUND_EFFECTS, getSoundEffectManager }
