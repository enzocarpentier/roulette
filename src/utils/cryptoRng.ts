// Générateur RNG de Niveau Casino (CSPRNG) & Algorithme Provably Fair (HMAC-SHA256)

// 1. Tirage cryptographique matériel non biaisé avec échantillonnage par rejet
// (Évite absolument tout biais de modulo pour garantir 1/37 équitable strict)
export function getCryptoRouletteNumber(): number {
  const maxRange = 37;
  // Trouver la plus grande limite multiple de 37 sous 2^32
  const limit = Math.floor(0xffffffff / maxRange) * maxRange;
  const buffer = new Uint32Array(1);

  while (true) {
    window.crypto.getRandomValues(buffer);
    const val = buffer[0];
    if (val < limit) {
      return val % maxRange;
    }
  }
}

// 2. Fonctions Provably Fair (Standard des casinos certifiés : Stake, Roobet)
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateRandomHexSeed(byteLength: number = 32): string {
  const array = new Uint8Array(byteLength);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Calcule le numéro de roulette (0-36) déterministe via HMAC-SHA256(ServerSeed, ClientSeed:Nonce)
export async function calculateProvablyFairNumber(
  serverSeed: string,
  clientSeed: string,
  nonce: number
): Promise<{ number: number; hmacHex: string }> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(serverSeed);
  const messageData = encoder.encode(`${clientSeed}:${nonce}`);

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hmacArray = Array.from(new Uint8Array(signature));
  const hmacHex = hmacArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  // Conversion standard : prendre les 8 premiers caractères hex (32 bits)
  const hexSubstring = hmacHex.substring(0, 8);
  const intVal = parseInt(hexSubstring, 16);
  const number = intVal % 37;

  return { number, hmacHex };
}

// 3. Test Statistique du Chi-Carré (Chi-Square Goodness-of-Fit)
// Évalue si les tirages observés sont conformes à une roulette européenne non truquée (p-value > 0.05)
export interface ChiSquareResult {
  chiSquare: number;
  criticalValue: number; // 50.998 pour ddl = 36 et alpha = 0.05
  isFair: boolean;
  totalSpins: number;
}

export function computeChiSquare(frequencies: Record<number, number>, totalSpins: number): ChiSquareResult {
  const k = 37;
  const criticalValue = 50.998; // Seuil standard alpha = 0.05 pour 36 degrés de liberté

  if (totalSpins < 37) {
    return { chiSquare: 0, criticalValue, isFair: true, totalSpins };
  }

  const expected = totalSpins / k;
  let chiSquare = 0;

  for (let i = 0; i < k; i++) {
    const observed = frequencies[i] || 0;
    const diff = observed - expected;
    chiSquare += (diff * diff) / expected;
  }

  return {
    chiSquare: Number(chiSquare.toFixed(2)),
    criticalValue,
    isFair: chiSquare <= criticalValue,
    totalSpins,
  };
}
