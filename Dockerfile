# Stage 1: Cài đặt dependencies
FROM node:20-alpine AS deps
# Cần libc6-compat cho một số package native trên alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy files package để install dependencies
COPY package.json package-lock.json ./
COPY mobile/package.json ./mobile/
COPY packages/contracts/package.json ./packages/contracts/

# Cài đặt dependencies (bao gồm cả workspace packages)
RUN npm ci --legacy-peer-deps

# Stage 2: Build source code
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vô hiệu hóa telemetry thu thập dữ liệu của Next.js trong quá trình build
ENV NEXT_TELEMETRY_DISABLED=1
# Bỏ qua xác thực biến môi trường lúc build
ENV SKIP_ENV_VALIDATION=true
# Dummy variables phục vụ việc compile code mà không lỗi
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/speakielts_ai"
ENV BETTER_AUTH_SECRET="dummy-secret-value-for-building-purposes"

# Sinh mã Prisma Client và build Next.js
RUN npx prisma generate
RUN npm run build

# Stage 3: Chạy ứng dụng (Production)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Tạo group và user non-root để chạy app an toàn hơn
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy các file cần thiết từ builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Tạo thư mục lưu trữ file ghi âm cục bộ và phân quyền cho user nextjs
RUN mkdir -p .data/audio && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Khởi động Next.js server
CMD ["npm", "run", "start"]
