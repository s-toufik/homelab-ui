export const TEMPORARY_PASSWORD_LENGTH = 20;
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const GROUP = 5;

export function temporaryPassword(
  random: (bytes: Uint8Array) => Uint8Array = (bytes) => crypto.getRandomValues(bytes),
): string {
  const limit = 256 - (256 % ALPHABET.length);
  const characters: string[] = [];
  while (characters.length < TEMPORARY_PASSWORD_LENGTH) {
    for (const byte of random(new Uint8Array(TEMPORARY_PASSWORD_LENGTH * 2))) {
      if (byte < limit && characters.length < TEMPORARY_PASSWORD_LENGTH) {
        characters.push(ALPHABET[byte % ALPHABET.length]);
      }
    }
  }
  return characters
    .join('')
    .match(new RegExp(`.{1,${GROUP}}`, 'g'))!
    .join('-');
}
