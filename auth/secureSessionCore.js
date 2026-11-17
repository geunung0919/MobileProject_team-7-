// 로그인 정보 저장소 (AC-02). 화면·Expo 모듈 없이 동작하는 순수 로직이라 테스트에서 가짜 저장소를 끼워 확인합니다.
// Firebase 가 넘기는 키·값을 기기 보안 저장소(iOS Keychain / Android Keystore)에 저장합니다.
// - 보안 저장소 키는 영문·숫자·. - _ 만 허용 → 다른 글자는 _ 로 바꿉니다.
// - 큰 값은 플랫폼에 따라 거절될 수 있어(약 2KB) 여러 조각으로 나눠 저장합니다.
// - 예전 버전이 일반 저장소(AsyncStorage)에 남긴 로그인 정보는 처음 읽을 때 보안 저장소로 옮기고 지웁니다.
// 값은 로그·화면에 출력하지 않습니다.
export const CHUNK_CHARS = 600; // 한글 등 3바이트 글자가 섞여도 1,800바이트 이하

export const secureKey = (key) => `fb.${String(key).replace(/[^A-Za-z0-9._-]/g, '_')}`;

export function createSecureSessionStorage({ secure, legacy }) {
  const countKey = (key) => `${secureKey(key)}.n`;
  const partKey = (key, i) => `${secureKey(key)}.${i}`;

  async function readSecure(key) {
    const count = Number(await secure.getItemAsync(countKey(key)));
    if (!Number.isInteger(count) || count < 1) return null;
    const parts = [];
    for (let i = 0; i < count; i += 1) {
      const part = await secure.getItemAsync(partKey(key, i));
      if (part == null) return null; // 조각이 빠졌으면 로그인 정보가 없는 것으로 처리 → 다시 로그인
      parts.push(part);
    }
    return parts.join('');
  }

  async function removeSecure(key) {
    const count = Number(await secure.getItemAsync(countKey(key)));
    await secure.deleteItemAsync(countKey(key));
    for (let i = 0; i < (Number.isInteger(count) ? count : 0); i += 1) {
      await secure.deleteItemAsync(partKey(key, i));
    }
  }

  async function setItem(key, value) {
    const text = String(value);
    await removeSecure(key);
    const parts = [];
    for (let i = 0; i < text.length; i += CHUNK_CHARS) parts.push(text.slice(i, i + CHUNK_CHARS));
    if (!parts.length) parts.push('');
    for (let i = 0; i < parts.length; i += 1) await secure.setItemAsync(partKey(key, i), parts[i]);
    await secure.setItemAsync(countKey(key), String(parts.length)); // 마지막에 개수를 써서 중간 실패 시 반쪽 값을 읽지 않음
  }

  async function getItem(key) {
    const value = await readSecure(key);
    if (value != null) return value;
    if (!legacy) return null;
    const old = await legacy.getItem(key);
    if (old == null) return null;
    await setItem(key, old);
    await legacy.removeItem(key);
    return old;
  }

  async function removeItem(key) {
    await removeSecure(key);
    if (legacy) await legacy.removeItem(key);
  }

  return { getItem, setItem, removeItem };
}
