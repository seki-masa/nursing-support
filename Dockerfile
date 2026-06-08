FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat openssl

# prismaスキーマをpackage.jsonと一緒にコピー（postinstallのprisma generateに必要）
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

COPY . .

EXPOSE 3000

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
