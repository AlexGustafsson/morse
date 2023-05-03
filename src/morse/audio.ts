import Channel from "../util/channel";

import impulseResponseBuffer from "../assets/response.wav?buffer";
import {
  Dit,
  Dah,
  MorseEntry,
  IntraCharacterSpace,
  InterCharacterSpace,
  WordSpace,
  Morse,
} from "./codec";
import { sleep } from "../util/sleep";

export class Track {}

export interface Tone {
  start(): void;
  stop(): void;
}

export class DefaultTone implements Tone {
  private ctx: AudioContext;
  private oscillator: OscillatorNode;
  private gain: GainNode;
  private convolver: ConvolverNode;
  private startedOnce = false;

  constructor() {
    this.ctx = new AudioContext();

    this.oscillator = new OscillatorNode(this.ctx);
    this.oscillator.type = "sine";
    this.oscillator.frequency.value = 880;

    this.gain = new GainNode(this.ctx);
    this.gain.connect(this.ctx.destination);

    // Load telephone-like impulse response buffer to get a more realistic sound
    this.convolver = new ConvolverNode(this.ctx);
    this.convolver.connect(this.gain);
    this.ctx
      .decodeAudioData(impulseResponseBuffer)
      .then((buffer) => {
        this.convolver.buffer = buffer;
      })
      .catch((error) => {
        console.error("Failed to load impulse response buffer", error);
      });
  }

  public start() {
    if (!this.startedOnce) {
      this.startedOnce = true;
      this.oscillator.start();
    }
    this.oscillator.connect(this.convolver);
  }

  public stop() {
    this.oscillator.disconnect();
  }
}

export class AudioManager extends EventTarget {
  private channel: Channel<MorseEntry> = new Channel();
  private tone: Tone;
  /** The duration of 1 unit ("dit"). */
  private tempo = 100;

  constructor(tone?: Tone) {
    super();
    this.tone = tone || new DefaultTone();
    this.play();
  }

  /** Play notes one by one. */
  private async play() {
    for await (const entry of this.channel) {
      switch (entry) {
        case Dit:
          this.start();
          await sleep(this.tempo);
          this.stop();
          break;
        case Dah:
          this.start();
          await sleep(this.tempo * 3);
          this.stop();
          break;
        case IntraCharacterSpace:
          await sleep(this.tempo);
          break;
        case InterCharacterSpace:
          await sleep(this.tempo * 3);
        case WordSpace:
          // NOTE: Technically 7, but we will always have waited for an inter-
          // character space before arriving at this point, hence 4
          await sleep(this.tempo * 4);
      }
    }
  }

  public start() {
    this.tone.start();
    this.dispatchEvent(new CustomEvent("start"));
  }

  public stop() {
    this.tone.stop();
    this.dispatchEvent(new CustomEvent("stop"));
  }

  public async queue(morse: Morse) {
    this.channel.send(...morse);
  }
}
