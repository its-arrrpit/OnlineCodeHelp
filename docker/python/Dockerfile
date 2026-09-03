# ===================================================================
# Docker Sandbox — Python Execution Runner
# ===================================================================
# Uses a minimal Alpine base image.
# Creates a dedicated non-root user (sandboxuser:1000) for security.
# ===================================================================

FROM python:3.11-alpine

# Create a restricted, non-root user for running untrusted code
RUN addgroup -g 1000 sandboxgroup && \
    adduser -D -u 1000 -G sandboxgroup sandboxuser

# Prepare the execution directory
WORKDIR /sandbox
RUN chown -R sandboxuser:sandboxgroup /sandbox

# Switch to non-root user
USER sandboxuser

# Default command
CMD ["python3", "-u", "solution.py"]
