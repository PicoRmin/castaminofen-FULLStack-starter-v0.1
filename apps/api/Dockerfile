FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY apps ./apps
COPY packages ./packages
COPY tsconfig.base.json ./
RUN corepack enable && pnpm install --ignore-scripts
CMD ["pnpm", "--filter", "@castaminofen/{app_name}", "dev"]
