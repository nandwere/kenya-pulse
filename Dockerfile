# syntax=docker/dockerfile:1

# ---- deps: install once, reused by both the api and scheduler images ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Uses `npm install` rather than `npm ci` because this project doesn't ship
# a package-lock.json yet (generate one with `npm install` locally once,
# commit it, then switch this to `npm ci` for fully reproducible builds).
RUN npm install --omit=dev --no-audit --no-fund

# ---- runtime: minimal image, non-root user, only what's needed to run ----
FROM node:20-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Run as a non-root user rather than the default root inside the container
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 4000

# Uses the API's own /health route - no extra tooling needed in the image
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]