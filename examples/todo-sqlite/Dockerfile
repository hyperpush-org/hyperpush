FROM ubuntu:24.04
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY output /usr/local/bin/todo-sqlite
ENV PORT=8080
ENV TODO_DB_PATH=/var/lib/todo/todo.sqlite3
ENV TODO_RATE_LIMIT_WINDOW_SECONDS=60
ENV TODO_RATE_LIMIT_MAX_REQUESTS=5
VOLUME ["/var/lib/todo"]
EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/todo-sqlite"]
