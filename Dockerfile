FROM oven/bun:1-alpine

COPY package.json ./
COPY bun.lockb ./
COPY src ./

RUN bun install
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "index.ts"]