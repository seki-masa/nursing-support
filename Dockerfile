FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

# prismaスキーマをpackage.jsonと一緒にコピー（postinstallのprisma generateに必要）
COPY package*.json ./
COPY prisma ./prisma/
# next-authのpeerOptional nodemailer(^7)と本プロジェクトのnodemailer(^6)が競合するため
# --legacy-peer-depsで解決（nodemailerはnext-authのEmailProvider用の任意依存で未使用）
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
