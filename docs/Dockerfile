# Dockerfile para servir documentación estática con Nginx
FROM nginx:alpine

# Remover configuración por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/* /etc/nginx/conf.d/default.conf

# Copiar archivos de documentación al directorio de Nginx
COPY documentation.html /usr/share/nginx/html/
COPY PLANES_FINANCIEROS.md /usr/share/nginx/html/
COPY *.png /usr/share/nginx/html/

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto 80
EXPOSE 80

# Nginx se ejecuta automáticamente como proceso principal
CMD ["nginx", "-g", "daemon off;"]

