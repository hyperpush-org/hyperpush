FROM ubuntu:22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y \
    curl wget gnupg git build-essential pkg-config ca-certificates xz-utils \
    libssl-dev libzstd-dev libffi-dev libxml2-dev \
    && rm -rf /var/lib/apt/lists/*

RUN wget -qO- https://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add - \
    && echo "deb http://apt.llvm.org/jammy/ llvm-toolchain-jammy-21 main" \
       > /etc/apt/sources.list.d/llvm.list \
    && apt-get update \
    && apt-get install -y llvm-21-dev libpolly-21-dev clang-21 \
    && rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
ENV PATH="/root/.cargo/bin:${PATH}"
ENV LLVM_SYS_211_PREFIX=/usr/lib/llvm-21
ENV LLVM_LINK_LLVM_DYLIB=1
ENV CARGO_TARGET_DIR=/app/target

WORKDIR /app
COPY . .

RUN cargo build -q -p mesh-rt -p meshc \
  && ./target/debug/meshc build scripts/fixtures/clustered/cluster-proof --output /tmp/cluster-proof --no-color \
  && test -x /tmp/cluster-proof

FROM debian:bookworm-slim AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && useradd --system --create-home mesh

COPY --from=builder /tmp/cluster-proof /usr/local/bin/cluster-proof
RUN chmod 0755 /usr/local/bin/cluster-proof

USER mesh:mesh
EXPOSE 4370
ENTRYPOINT ["/usr/local/bin/cluster-proof"]
