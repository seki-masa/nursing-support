# 介護支援バイタル管理システム — Claude作業ガイドライン

## 実装前に必ず説明すること

**コードを書く前に、以下を必ず日本語で説明すること：**

1. **目的**: この変更が何のためにあるか（ユーザの要望や解決する問題）
2. **追加・変更するファイル**: ファイルパスと、そのファイルで何をするか
3. **処理の流れ**: データやリクエストがどう流れるか（必要な場合）

説明後、ユーザの承認なしに実装を開始してよい。ただし認識のズレが生じやすい複雑な変更は確認を取ること。

---

## プロジェクト概要

介護施設向けのバイタルサイン管理Webアプリ。

- **フレームワーク**: Next.js 14 (App Router) + TypeScript
- **DB**: PostgreSQL 15 + Prisma ORM
- **認証**: NextAuth.js（メール/パスワード）
- **UI**: Tailwind CSS + shadcn/ui（Radix UI ベース）
- **起動**: Docker Compose（`docker compose up`）

---

## ディレクトリ構成

```
app/
├── (auth)/login/         # ログイン画面（認証不要）
├── (dashboard)/          # 認証済みユーザ向けレイアウト（サイドバー付き）
│   ├── dashboard/        # メインダッシュボード /?id=xxx でバイタル表示
│   └── care-recipients/  # プロフィール表示・編集・新規登録・バイタル入力
├── api/                  # REST APIルート
└── layout.tsx            # ルートレイアウト

components/
├── sidebar/              # 左サイドバー（対象者一覧・ステータス別）
├── vitals/               # バイタルダッシュボード・入力フォーム・グラフ
├── profile/              # プロフィール表示・編集フォーム・家族管理
└── ui/                   # shadcn/ui ベースのUIコンポーネント

lib/
├── prisma.ts             # Prismaクライアント（シングルトン）
├── auth.ts               # NextAuth設定
└── vitals-utils.ts       # バイタル正常範囲判定ロジック

types/index.ts            # 共通型定義・ステータス設定（STATUS_CONFIG等）
prisma/schema.prisma      # DBスキーマ（7モデル）
```

---

## 重要な実装パターン

### URL設計
- `/dashboard?id=xxx` → 介護対象者 xxx のバイタルダッシュボード
- `/care-recipients/[id]` → プロフィール表示
- `/care-recipients/[id]/edit` → プロフィール編集
- `/care-recipients/[id]/vitals/new` → バイタル入力

### 認証
- `middleware.ts` で `/login` と `/api/auth` 以外は認証必須
- サーバーコンポーネントでは `getServerSession(authOptions)` を使う
- クライアントコンポーネントでは `useSession()` を使う

### APIルートの基本形
```ts
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  // ...
}
```

### データ変更後のUI更新
クライアントコンポーネントで保存後は必ず `router.refresh()` を呼ぶ（サーバーコンポーネントのキャッシュを破棄するため）。

### Decimal型の扱い
Prismaの `Decimal` 型（体温・体重）はAPIレスポンス時に `Number()` で変換すること。

---

## Docker操作

```bash
docker compose up          # 起動（初回はスキーマ適用＋シードデータ投入）
docker compose up --build  # イメージ再ビルドして起動
docker compose down        # 停止
make logs                  # アプリのログを表示
make shell                 # コンテナ内シェルに入る
make reset                 # DBリセット＋シードデータ再投入
```

---

## 開発時の注意

- UIはすべて**日本語**
- コメントは**原則不要**。WHYが非自明な場合のみ1行
- shadcn/ui コンポーネントは `components/ui/` に手動で作成済み（CLIは使わない）
- ウェアラブル連携は未実装（プレースホルダのみ）。Web Bluetooth APIで将来実装予定
- シードデータのパスワードは `admin123` / `staff123`（開発用）
