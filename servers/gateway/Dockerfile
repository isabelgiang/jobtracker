FROM alpine

# Install root CA certificates
RUN apk update && \
    apk add ca-certificates
COPY gateway gateway
EXPOSE 443
ENTRYPOINT ["/gateway"]
