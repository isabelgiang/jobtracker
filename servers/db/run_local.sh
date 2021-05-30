docker run -d \
    -p 5432:5432 \
    -e POSTGRES_PASSWORD=postgres \
    --name postgresStore \
    $DOCKER_USER/jobtracker-postgresstore || true;
