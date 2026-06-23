FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create a non‑root user (fix the adduser/addgroup syntax for Alpine)
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy the JAR that was built by the pipeline (not rebuilt inside Docker)
COPY target/*.jar app.jar

RUN chown -R appuser:appgroup /app

USER appuser
EXPOSE 8083
ENTRYPOINT ["java", "-jar", "app.jar"]