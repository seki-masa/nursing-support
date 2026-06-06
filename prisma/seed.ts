import { PrismaClient, Gender, BloodType, Edema, CareStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const recipientCount = await prisma.careRecipient.count()
  if (recipientCount > 0) {
    console.log('✅ 初期データは既に存在します。スキップします。')
    return
  }

  // 管理者ユーザ作成
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: '管理者',
      email: 'admin@example.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  })

  const staffPassword = await bcrypt.hash('staff123', 10)
  const staff = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      name: '山田 看護子',
      email: 'staff@example.com',
      passwordHash: staffPassword,
      role: 'STAFF',
    },
  })

  // 家族データ
  const family1 = await prisma.family.create({
    data: {
      name: '田中 一郎',
      relationship: '長男',
      phone: '090-1234-5678',
      email: 'tanaka.ichiro@example.com',
    },
  })

  const family2 = await prisma.family.create({
    data: {
      name: '田中 花子',
      relationship: '長女',
      phone: '080-2345-6789',
    },
  })

  const family3 = await prisma.family.create({
    data: {
      name: '鈴木 健太',
      relationship: '息子',
      phone: '070-3456-7890',
    },
  })

  // 介護対象者1: 危篤
  const recipient1 = await prisma.careRecipient.create({
    data: {
      name: '田中 太郎',
      nameKana: 'たなか たろう',
      gender: Gender.MALE,
      birthDate: new Date('1935-03-15'),
      bloodType: BloodType.A_PLUS,
      room: '101号室',
      notes: '心臓病の既往あり。家族への連絡を優先。',
      medicalConditions: {
        create: [
          { name: '慢性心不全' },
          { name: '高血圧症' },
          { name: '2型糖尿病' },
        ],
      },
      allergies: {
        create: [
          { name: 'ペニシリン系抗生物質' },
          { name: '造影剤' },
        ],
      },
      families: {
        create: [
          { familyId: family1.id },
          { familyId: family2.id },
        ],
      },
    },
  })

  // 介護対象者2: 要注意
  const recipient2 = await prisma.careRecipient.create({
    data: {
      name: '山田 花子',
      nameKana: 'やまだ はなこ',
      gender: Gender.FEMALE,
      birthDate: new Date('1940-07-20'),
      bloodType: BloodType.O_PLUS,
      room: '203号室',
      notes: '転倒リスク高。歩行補助が必要。',
      medicalConditions: {
        create: [
          { name: '骨粗鬆症' },
          { name: '変形性膝関節症' },
        ],
      },
      allergies: {
        create: [
          { name: '卵' },
        ],
      },
    },
  })

  // 介護対象者3: 健康
  const recipient3 = await prisma.careRecipient.create({
    data: {
      name: '鈴木 次郎',
      nameKana: 'すずき じろう',
      gender: Gender.MALE,
      birthDate: new Date('1942-11-08'),
      bloodType: BloodType.B_MINUS,
      room: '305号室',
      medicalConditions: {
        create: [
          { name: '高脂血症' },
        ],
      },
      families: {
        create: [
          { familyId: family3.id },
        ],
      },
    },
  })

  // 介護対象者4: 経過観察
  const recipient4 = await prisma.careRecipient.create({
    data: {
      name: '佐藤 美子',
      nameKana: 'さとう よしこ',
      gender: Gender.FEMALE,
      birthDate: new Date('1938-05-25'),
      bloodType: BloodType.AB_PLUS,
      room: '402号室',
      notes: '先月退院。経過観察中。',
      medicalConditions: {
        create: [
          { name: '脳梗塞後遺症' },
          { name: '嚥下障害' },
        ],
      },
    },
  })

  // 介護対象者5: 重篤
  const recipient5 = await prisma.careRecipient.create({
    data: {
      name: '高橋 勇',
      nameKana: 'たかはし いさむ',
      gender: Gender.MALE,
      birthDate: new Date('1930-01-10'),
      bloodType: BloodType.A_MINUS,
      room: 'ICU-1',
      notes: '肺炎治療中。酸素投与中。',
      medicalConditions: {
        create: [
          { name: '肺炎' },
          { name: '慢性閉塞性肺疾患（COPD）' },
          { name: '心房細動' },
        ],
      },
    },
  })

  // バイタルデータ（田中太郎）
  const now = new Date()
  // 田中太郎のバイタル（ステータスは最新のみ設定 = CRITICAL）
  const vitalsData = [
    { daysAgo: 0, hours: 8, status: CareStatus.CRITICAL, systolicBp: 185, diastolicBp: 110, heartRate: 110, respiratoryRate: 22, temperature: 38.5, spo2: 92, weight: 65.2, bloodSugar: 180, painScore: 6, edema: Edema.MODERATE },
    { daysAgo: 1, hours: 8, status: null, systolicBp: 175, diastolicBp: 105, heartRate: 105, respiratoryRate: 20, temperature: 38.2, spo2: 93, weight: 65.0, bloodSugar: 165, painScore: 5, edema: Edema.MILD },
    { daysAgo: 2, hours: 8, status: null, systolicBp: 168, diastolicBp: 100, heartRate: 98, respiratoryRate: 19, temperature: 37.8, spo2: 94, weight: 65.5, bloodSugar: 155, painScore: 4, edema: Edema.MILD },
    { daysAgo: 3, hours: 8, status: CareStatus.SEVERE, systolicBp: 155, diastolicBp: 95, heartRate: 92, respiratoryRate: 18, temperature: 37.5, spo2: 95, weight: 65.8, bloodSugar: 145, painScore: 3, edema: Edema.NONE },
    { daysAgo: 7, hours: 8, status: CareStatus.CAUTION, systolicBp: 142, diastolicBp: 88, heartRate: 85, respiratoryRate: 17, temperature: 36.8, spo2: 96, weight: 66.0, bloodSugar: 130, painScore: 2, edema: Edema.NONE },
  ]

  for (const v of vitalsData) {
    const recordedAt = new Date(now)
    recordedAt.setDate(recordedAt.getDate() - v.daysAgo)
    recordedAt.setHours(v.hours, 0, 0, 0)
    await prisma.vital.create({
      data: {
        careRecipientId: recipient1.id,
        recordedBy: staff.id,
        recordedAt,
        status: v.status,
        systolicBp: v.systolicBp,
        diastolicBp: v.diastolicBp,
        heartRate: v.heartRate,
        respiratoryRate: v.respiratoryRate,
        temperature: v.temperature,
        spo2: v.spo2,
        weight: v.weight,
        bloodSugar: v.bloodSugar,
        painScore: v.painScore,
        edema: v.edema,
      },
    })
  }

  // バイタルデータ（佐藤美子）
  for (let i = 0; i < 7; i++) {
    const recordedAt = new Date(now)
    recordedAt.setDate(recordedAt.getDate() - i)
    recordedAt.setHours(10, 0, 0, 0)
    await prisma.vital.create({
      data: {
        careRecipientId: recipient4.id,
        recordedBy: staff.id,
        recordedAt,
        status: i === 0 ? CareStatus.OBSERVATION : null,
        systolicBp: 135 + Math.floor(Math.random() * 15),
        diastolicBp: 82 + Math.floor(Math.random() * 10),
        heartRate: 72 + Math.floor(Math.random() * 10),
        respiratoryRate: 16 + Math.floor(Math.random() * 3),
        temperature: parseFloat((36.4 + Math.random() * 0.6).toFixed(1)),
        spo2: 96 + Math.floor(Math.random() * 3),
        weight: parseFloat((50.0 + Math.random() * 0.5).toFixed(1)),
        bloodSugar: 100 + Math.floor(Math.random() * 35),
      },
    })
  }

  // バイタルデータ（山田花子）
  for (let i = 0; i < 14; i++) {
    const recordedAt = new Date(now)
    recordedAt.setDate(recordedAt.getDate() - i)
    recordedAt.setHours(9, 0, 0, 0)
    await prisma.vital.create({
      data: {
        careRecipientId: recipient2.id,
        recordedBy: staff.id,
        recordedAt,
        status: i === 0 ? CareStatus.CAUTION : null,
        systolicBp: 145 + Math.floor(Math.random() * 20),
        diastolicBp: 88 + Math.floor(Math.random() * 12),
        heartRate: 78 + Math.floor(Math.random() * 15),
        respiratoryRate: 16 + Math.floor(Math.random() * 4),
        temperature: parseFloat((36.5 + Math.random() * 0.8).toFixed(1)),
        spo2: 96 + Math.floor(Math.random() * 3),
        weight: parseFloat((58.0 + Math.random() * 1.0).toFixed(1)),
        bloodSugar: 110 + Math.floor(Math.random() * 40),
        painScore: Math.floor(Math.random() * 4),
        edema: Edema.NONE,
      },
    })
  }

  // バイタルデータ（鈴木次郎）
  for (let i = 0; i < 7; i++) {
    const recordedAt = new Date(now)
    recordedAt.setDate(recordedAt.getDate() - i)
    recordedAt.setHours(8, 30, 0, 0)
    await prisma.vital.create({
      data: {
        careRecipientId: recipient3.id,
        recordedBy: staff.id,
        recordedAt,
        status: i === 0 ? CareStatus.HEALTHY : null,
        systolicBp: 125 + Math.floor(Math.random() * 15),
        diastolicBp: 78 + Math.floor(Math.random() * 10),
        heartRate: 68 + Math.floor(Math.random() * 12),
        respiratoryRate: 14 + Math.floor(Math.random() * 3),
        temperature: parseFloat((36.2 + Math.random() * 0.5).toFixed(1)),
        spo2: 97 + Math.floor(Math.random() * 2),
        weight: parseFloat((72.0 + Math.random() * 0.5).toFixed(1)),
        bloodSugar: 90 + Math.floor(Math.random() * 30),
      },
    })
  }

  // バイタルデータ（高橋勇）
  for (let i = 0; i < 5; i++) {
    const recordedAt = new Date(now)
    recordedAt.setDate(recordedAt.getDate() - i)
    recordedAt.setHours(7, 0, 0, 0)
    await prisma.vital.create({
      data: {
        careRecipientId: recipient5.id,
        recordedBy: staff.id,
        recordedAt,
        status: i === 0 ? CareStatus.SEVERE : null,
        systolicBp: 158 + Math.floor(Math.random() * 20),
        diastolicBp: 95 + Math.floor(Math.random() * 10),
        heartRate: 95 + Math.floor(Math.random() * 20),
        respiratoryRate: 24 + Math.floor(Math.random() * 6),
        temperature: parseFloat((38.0 + Math.random() * 1.0).toFixed(1)),
        spo2: 88 + Math.floor(Math.random() * 6),
        weight: parseFloat((60.0 - i * 0.2).toFixed(1)),
        bloodSugar: 160 + Math.floor(Math.random() * 60),
        painScore: 4 + Math.floor(Math.random() * 4),
        edema: Edema.MILD,
      },
    })
  }

  console.log('✅ シードデータの投入が完了しました')
  console.log('  管理者: admin@example.com / admin123')
  console.log('  スタッフ: staff@example.com / staff123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
