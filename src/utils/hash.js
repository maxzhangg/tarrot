// utils/hash.js
import { sha256 } from "js-sha256";

export async function getCardIndex(question, timestamp) {
  const text = question + timestamp;
  const hashHex = sha256(text);
  const hashInt = parseInt(hashHex.slice(0, 8), 16); // 取前32位
  return hashInt % 156;
}
