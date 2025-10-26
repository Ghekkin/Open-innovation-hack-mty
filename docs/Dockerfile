# Dockerfile para servir documentación estática con Nginx
FROM nginx:alpine

# Copiar archivos de documentación al directorio de Nginx
COPY . /usr/share/nginx/html/

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Nginx se ejecuta automáticamente como proceso principal
CMD ["nginx", "-g", "daemon off;"]

