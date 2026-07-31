# ==========================================
# Etapa 1: Build y Dependencias (Build Stage)
# ==========================================
FROM node:20-alpine AS build

WORKDIR /app

# Copiar archivos de definición de paquetes
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para pruebas)
RUN npm ci

# Copiar el código fuente
COPY . .

# Ejecutar pruebas unitarias durante la construcción
RUN npm test

# ==========================================
# Etapa 2: Producción Minimalista (Production Stage)
# ==========================================
FROM node:20-alpine AS production

WORKDIR /app

# Establecer variable de entorno a producción
ENV NODE_ENV=production

# Copiar solo archivos de definición y luego instalar SOLO dependencias de producción
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código de aplicación desde la etapa de construcción
COPY --from=build /app/src ./src

# Usar un usuario no root por razones de seguridad (hardening)
USER node

# Exponer el puerto del microservicio
EXPOSE 5000

# Comando de inicio del contenedor
CMD ["node", "src/server.js"]
