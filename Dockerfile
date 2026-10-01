# Two stages: Vite builds the bundle, nginx serves it. See "Deploy" in README.md.
#
# The Supabase values are baked into the bundle at build time — Vite only reads env at
# startup — so they arrive as build args rather than runtime env. Left empty the build
# comes out in local mode (localStorage only), which is the honest default for an image
# built without credentials.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
RUN npm run build

FROM nginx:1.30-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
