# ==========================================
# Etapa de Servido en Producción con Nginx
# ==========================================
FROM nginx:1.25-alpine AS production

# Copiar archivo de configuración personalizado de Nginx con reverse proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los activos del sitio frontend al directorio de servicio de Nginx
COPY public/ /usr/share/nginx/html/

# Exponer el puerto 80 estándar HTTP
EXPOSE 80

# Iniciar servidor Nginx
CMD ["nginx", "-g", "daemon off;"]
