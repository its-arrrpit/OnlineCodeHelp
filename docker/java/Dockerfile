# ===================================================================
# Docker Sandbox — Java Execution Runner
# ===================================================================
# Eclipse Temurin OpenJDK 17 on Alpine Linux.
# Creates a dedicated non-root user (sandboxuser:1000) for security.
# ===================================================================

FROM eclipse-temurin:17-alpine

# Create restricted non-root user
RUN addgroup -g 1000 sandboxgroup && \
    adduser -D -u 1000 -G sandboxgroup sandboxuser

WORKDIR /sandbox
RUN chown -R sandboxuser:sandboxgroup /sandbox

USER sandboxuser

CMD ["java", "Solution"]
