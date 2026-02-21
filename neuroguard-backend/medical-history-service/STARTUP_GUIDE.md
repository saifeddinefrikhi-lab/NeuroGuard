# Medical History Service - Startup Guide

## Prerequisites

Before starting the Medical History Service, ensure:

1. **MySQL Database** is running on `localhost:3306`
   - Database name: `medical_history_db` (will be auto-created)
   
2. **Eureka Service Registry** is running on `http://localhost:8761`
   - This is where the service registers itself for service discovery
   
3. **Gateway Service** is running on `http://localhost:8083`
   - This routes frontend requests to microservices
   
4. **User Service** is running on `http://localhost:8081`
   - Used for user validation via Feign client

## Service Configuration

- **Service Name**: medical-history-service
- **Port**: 8084
- **Service URL**: http://localhost:8084
- **Eureka Registration**: Enabled
- **JWT Secret**: XDkzF2YNPA/7vXmPYJmaACjY6VBhwHJbr4pzPF5jguE=

## Startup Methods

### Method 1: Using Maven Spring Boot Plugin (Recommended)

```powershell
cd C:\Users\saife\Desktop\PI\NeuroGuard\neuroguard-backend\medical-history-service
.\mvnw.cmd spring-boot:run
```

### Method 2: Build and Run JAR

```powershell
cd C:\Users\saife\Desktop\PI\NeuroGuard\neuroguard-backend\medical-history-service

# Build the project
.\mvnw.cmd clean package -DskipTests

# Run the JAR file
java -jar target/medical-history-service-0.0.1-SNAPSHOT.jar
```

### Method 3: Using IntelliJ IDE

1. Open the project in IntelliJ
2. Navigate to `MedicalHistoryServiceApplication.java`
3. Right-click and select "Run MedicalHistoryServiceApplication"
4. Or use the keyboard shortcut: `Shift + F10`

### Method 4: Run in Background (PowerShell)

```powershell
cd C:\Users\saife\Desktop\PI\NeuroGuard\neuroguard-backend\medical-history-service
Start-Process -NoNewWindow -FilePath "powershell" -ArgumentList ".\mvnw.cmd spring-boot:run"
```

## Expected Startup Messages

When the service starts successfully, you should see:

```
...
INFO ... [main] o.s.b.w.embedded.tomcat.TomcatWebServer    : Tomcat started on port(s): 8084 (http) with context path ''
INFO ... [main] o.s.b.a.e.web.EndpointLinksSupplier        : Actuator is available
...
```

## Verification

After startup, verify the service is running:

1. **Health Check**: `http://localhost:8084/actuator/health`
2. **Eureka Registration**: Check `http://localhost:8761/eureka` - look for `MEDICAL-HISTORY-SERVICE` instance
3. **Gateway Routing**: Frontend requests to `http://localhost:8083/api/patient/**` should be routed to this service

## Logs and Debugging

The service logs are configured at DEBUG level for security components:

```yaml
logging:
  level:
    com.neuroguard.medicalhistoryservice.security: DEBUG
    org.springframework.security: DEBUG
```

Check logs for authentication and CORS issues.

## Troubleshooting

### Issue: Service won't start - Port already in use
**Solution**: Change port in `application.yaml` or kill the process using port 8084

### Issue: Cannot connect to MySQL
**Solution**: Ensure MySQL is running and accessible at `localhost:3306`

### Issue: Service not appearing in Eureka
**Solution**: Ensure Eureka server is running and `register-with-eureka: true` is set

### Issue: CORS errors from frontend
**Solution**: Verify CORS configuration allows `http://localhost:4200`

### Issue: JWT token validation fails
**Solution**: Verify the JWT secret matches between user-service and this service

## Database Initialization

The service will automatically:
- Create `medical_history_db` database if it doesn't exist
- Create all tables based on JPA entity definitions
- Run on startup with `spring.jpa.hibernate.ddl-auto: update`

## Security

- JWT authentication is required for all endpoints except `/actuator/**`
- Role-based access control:
  - `/api/patient/**` - Requires `PATIENT` role
  - `/api/provider/**` - Requires `PROVIDER` role
  - `/api/caregiver/**` - Requires `CAREGIVER` role
- CORS is configured to allow frontend at `http://localhost:4200`

## Endpoints Available

Once running, the following endpoints are accessible:

### Patient Endpoints
- `GET /api/patient/medical-history/me` - Get patient's medical history
- `POST /api/patient/medical-history/me/files` - Upload medical file
- `GET /api/patient/medical-history/me/files` - Get patient's files

### Provider Endpoints
- Similar endpoints with `/api/provider/**` path

### Caregiver Endpoints
- Similar endpoints with `/api/caregiver/**` path

## Stopping the Service

- Press `Ctrl + C` in the terminal where it's running
- Or kill the process using port 8084

---

For more information, check the `application.yaml` configuration file.

