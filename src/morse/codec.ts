export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ";

export const Dit: unique symbol = Symbol("dit");
export const Dah: unique symbol = Symbol("dah");
export const IntraCharacterSpace: unique symbol = Symbol(
  "intra-character space"
);
export const InterCharacterSpace: unique symbol = Symbol(
  "inter-character space"
);
export const WordSpace: unique symbol = Symbol("space");

export type MorseEntry =
  | typeof Dit
  | typeof Dah
  | typeof IntraCharacterSpace
  | typeof InterCharacterSpace
  | typeof WordSpace;

export type Morse = MorseEntry[];

export function encodeToMorse(text: string): Morse {
  const morse: Morse = [];

  const characters = text.toUpperCase().split("");
  for (let i = 0; i < characters.length; i++) {
    const character = characters[i];
    if (!ALPHABET.includes(character)) {
      throw new Error(
        `Character '${character}' (${character.charCodeAt(
          0
        )}) is not in the morse alphabet`
      );
    }

    if (character === " ") {
      morse.push(WordSpace);
    } else {
      morse.push(...simpleToMorse(lookup[character]));
      morse.push(InterCharacterSpace);
    }
  }

  return morse;
}

function simpleToMorse(text: string): Morse {
  const morse: Morse = [];

  for (const character of text.split("").join(" ").split("")) {
    if (character === ".") {
      morse.push(Dit);
    } else if (character === "-") {
      morse.push(Dah);
    } else if (character === " ") {
      morse.push(IntraCharacterSpace);
    } else {
      throw new Error("Invalid morse character");
    }
  }

  return morse;
}

const lookup: Record<string, string> = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
};
