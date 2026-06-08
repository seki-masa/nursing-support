import nodemailer from 'nodemailer'

const DEFAULT_SUPPORT_EMAIL = 'system.info.support@gmail.com'
const FROM_ADDRESS = process.env.SMTP_FROM ?? DEFAULT_SUPPORT_EMAIL
const SUPPORT_ADDRESS = process.env.SUPPORT_EMAIL ?? DEFAULT_SUPPORT_EMAIL

interface BusinessIdEmailParams {
  to: string
  code: string
  companyName: string
}

function buildMessage({ to, code, companyName }: BusinessIdEmailParams) {
  const subject = '【介護支援バイタル管理】事業者IDのお知らせ'
  const text = [
    `${companyName} ご担当者様`,
    '',
    '事業者登録ありがとうございます。',
    '発行された事業者IDは以下の通りです。',
    '',
    `    事業者ID: ${code}`,
    '',
    'アカウント新規登録画面で、この事業者IDを入力してアカウントを作成してください。',
    '',
    '------------------------------',
    '介護支援バイタル管理システム',
  ].join('\n')
  return { subject, text, from: FROM_ADDRESS, to }
}

export async function sendBusinessIdEmail(params: BusinessIdEmailParams): Promise<void> {
  const message = buildMessage(params)
  await deliver(message)
}

interface PasswordResetEmailParams {
  to: string
  name: string
  url: string
}

export async function sendPasswordResetEmail({ to, name, url }: PasswordResetEmailParams): Promise<void> {
  const subject = '【介護支援バイタル管理】パスワード再設定のご案内'
  const text = [
    `${name} 様`,
    '',
    'パスワード再設定のリクエストを受け付けました。',
    '以下のURLにアクセスして、新しいパスワードを設定してください。',
    '',
    `    ${url}`,
    '',
    'このURLの有効期限は1時間です。',
    'お心当たりがない場合は、このメールを破棄してください。',
    '',
    '------------------------------',
    '介護支援バイタル管理システム',
  ].join('\n')
  await deliver({ subject, text, from: FROM_ADDRESS, to })
}

interface ContactEmailParams {
  userName: string
  userEmail: string
  subject: string
  message: string
}

export async function sendContactEmail({ userName, userEmail, subject, message }: ContactEmailParams): Promise<void> {
  const mailSubject = `【お問い合わせ】${subject}`
  const text = [
    'システム管理者へのお問い合わせを受け付けました。',
    '',
    `送信者: ${userName}`,
    `メールアドレス: ${userEmail}`,
    `件名: ${subject}`,
    '',
    '--- お問い合わせ内容 ---',
    message,
    '------------------------',
    '',
    '※ このメールは送信者ご本人とシステム管理者宛に送信されています。',
    '',
    '------------------------------',
    '介護支援バイタル管理システム',
  ].join('\n')
  // 管理者宛に送信し、本人にも控えを送る（返信は本人へ届くよう replyTo を設定）
  await deliver({ subject: mailSubject, text, from: FROM_ADDRESS, to: SUPPORT_ADDRESS, cc: userEmail, replyTo: userEmail })
}

interface Message {
  subject: string
  text: string
  from: string
  to: string
  cc?: string
  replyTo?: string
}

async function deliver(message: Message): Promise<void> {
  // SMTP未設定時はログ出力にフォールバック（開発用）
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('📧 [メール送信(ログ出力)] SMTP未設定のため実送信はスキップしました')
    console.log(`  宛先: ${message.to}`)
    if (message.cc) console.log(`  CC: ${message.cc}`)
    console.log(`  件名: ${message.subject}`)
    console.log('  本文:')
    console.log(message.text)
    return
  }

  const port = Number(process.env.SMTP_PORT ?? 587)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  await transporter.sendMail(message)
}
