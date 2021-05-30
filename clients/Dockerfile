FROM nginx:alpine

# Copy web client files from NGINX directory
COPY build /usr/share/nginx/html

# Add modified NGINX configuration
COPY default.conf /etc/nginx/conf.d/default.conf
