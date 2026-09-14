FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY shared/package.json shared/tsconfig.json shared/
COPY shared/src shared/src
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci
COPY backend/tsconfig.json backend/
COPY backend/src backend/src
RUN npm run build --workspace backend && npm prune --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/shared/package.json shared/
COPY --from=build /app/shared/dist shared/dist
COPY --from=build /app/backend/package.json backend/
COPY --from=build /app/backend/node_modules backend/node_modules
COPY --from=build /app/backend/dist backend/dist
RUN mkdir -p backend/backup && chown -R node:node backend/backup
USER node
WORKDIR /app/backend
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=120s --retries=3 \
    CMD wget -qO- http://127.0.0.1:${HEALTH_PORT:-3000}/health || exit 1
CMD ["node", "dist/index.js"]
