// 事業者ID（短い英数字コード）を生成する。
// 紛らわしい文字（0/O/1/I）は除外して読み間違いを防ぐ。
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateBusinessCode(): string {
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return `BIZ-${code}`
}
