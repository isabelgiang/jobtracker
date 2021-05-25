docker run -d \
    -p 5432:5432 \
    -e POSTGRES_PASSWORD=postgres \
    --name postgresStore \
    wills0ng/info441-postgresstore || true;