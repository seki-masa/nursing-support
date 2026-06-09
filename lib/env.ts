// 本番環境で必須の認証関連環境変数を検証する（フェイルクローズ）。
// セッションJWTの署名鍵が未設定/プレースホルダのまま本番稼働するのを防ぐ。

const PLACEHOLDER_SECRET = 'your-secret-key-here'

export function assertProductionAuthEnv(): void {
  if (process.env.NODE_ENV !== 'production') return
  // next build 中はランタイム値が無くてもよいのでスキップ
  if (process.env.NEXT_PHASE === 'phase-production-build') return

  const secret = process.env.NEXTAUTH_SECRET
  if (!secret || secret === PLACEHOLDER_SECRET) {
    throw new Error(
      'NEXTAUTH_SECRET が未設定、またはプレースホルダのままです。' +
        '本番では強いランダム値（例: `openssl rand -base64 32`）を環境変数に設定してください。'
    )
  }

  if (!process.env.NEXTAUTH_URL) {
    throw new Error(
      'NEXTAUTH_URL が未設定です。本番では公開URL（末尾スラッシュ無し、例: https://your-domain）を環境変数に設定してください。'
    )
  }
}
