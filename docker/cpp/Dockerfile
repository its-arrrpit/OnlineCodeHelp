# ===================================================================
# Docker Sandbox — C++ Execution Runner
# ===================================================================
# Includes g++ compiler and standard libraries.
# Creates a dedicated non-root user (sandboxuser:1000) for security.
# ===================================================================

FROM alpine:3.19

# Install g++ and standard C++ libraries
RUN apk add --no-cache g++ libstdc++

# Create restricted non-root user
RUN addgroup -g 1000 sandboxgroup && \
    adduser -D -u 1000 -G sandboxgroup sandboxuser

WORKDIR /sandbox
RUN chown -R sandboxuser:sandboxgroup /sandbox

USER sandboxuser

CMD ["./solution.out"]
