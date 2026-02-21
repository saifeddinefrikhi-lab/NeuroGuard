# Pre-Startup Checklist

Before starting the medical-history-service, ensure all dependencies are running:

## Required Services

- [ ] **MySQL Database** running on `localhost:3306`
  - Database: `medical_history_db`
  - Auto-created if doesn't exist
  
- [ ] **Eureka Service Registry** running on `http://localhost:8761`
  - Required for service discovery
  - Check: http://localhost:8761 should show web UI
  
- [ ] **Gateway Service** running on `http://localhost:8083`
  - Routes frontend requests to microservices
  - Check: `curl http://localhost:8083/actuator/health`
  
- [ ] **User Service** running on `http://localhost:8081`
  - Called via Feign client for user validation
  - Check: `curl http://localhost:8081/actuator/health`

## Startup Order (Recommended)

1. Start **Eureka Service Registry** first (dependencies: none)
2. Start **MySQL Database** (dependencies: none)
3. Start **User Service** (dependencies: Eureka, MySQL)
4. Start **Gateway Service** (dependencies: Eureka)
5. Start **Medical History Service** (dependencies: Eureka, MySQL)
6. Start **Frontend** (dependencies: Gateway)

## Medical History Service Configuration

### Verified Settings
- ✅ Server Port: **8084**
- ✅ Service Name: **medical-history-service**
- ✅ Eureka Registration: **enabled**
- ✅ Database: **medical_history_db**
- ✅ JWT Secret: **configured**
- ✅ CORS: **enabled for http://localhost:4200**
- ✅ Role-based Access Control: **enabled**

### Port Allocations
| Service | Port | Type |
|---------|------|------|
| Frontend | 4200 | Angular App |
| User Service | 8081 | Spring Boot |
| (Available) | 8082 | - |
| Gateway | 8083 | Spring Cloud Gateway |
| Medical History | 8084 | Spring Boot (THIS SERVICE) |
| Eureka | 8761 | Service Registry |

## Quick Start Command

```powershell
# Navigate to service directory
cd C:\Users\saife\Desktop\PI\NeuroGuard\neuroguard-backend\medical-history-service

# Start the service
.\mvnw.cmd spring-boot:run
```

## Expected Startup Output

```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_|\__, | / / / /
 =========|_|==============|___/=/_/_/_/

2025-02-21 ... : Starting MedicalHistoryServiceApplication
2025-02-21 ... : The following profiles are active: default
2025-02-21 ... : Registering bean definition for interface com.neuroguard.medicalhistoryservice.repository.MedicalHistoryRepository
2025-02-21 ... : Registering bean definition for interface com.neuroguard.medicalhistoryservice.repository.MedicalRecordFileRepository
2025-02-21 ... : HikariPool-1 - Starting...
2025-02-21 ... : HikariPool-1 - Start completed.
2025-02-21 ... : Hibernate: create table if not exists medical_history...
2025-02-21 ... : Hibernate: create table if not exists medical_record_file...
2025-02-21 ... : Hibernate: create table if not exists progression_stage...
2025-02-21 ... : Hibernate: create table if not exists surgery...
2025-02-21 ... : DiscoveryClient_MEDICAL-HISTORY-SERVICE/... registering service URL: http://COMPUTER_NAME:8084
2025-02-21 ... : Tomcat started on port(s): 8084 (http) with context path ''
2025-02-21 ... : Started MedicalHistoryServiceApplication in X.XXX seconds
```

## Verification After Startup

### 1. Service Health Check
```bash
curl http://localhost:8084/actuator/health
# Expected: {"status":"UP"}
```

### 2. Eureka Registration
Visit: http://localhost:8761
- Should show "MEDICAL-HISTORY-SERVICE" in "Instances currently registered with Eureka"

### 3. Gateway Routing
```bash
curl -H "Authorization: Bearer <VALID_JWT_TOKEN>" \
     http://localhost:8083/api/patient/medical-history/me
# Should NOT return 503 (Service Unavailable)
```

### 4. Check Logs for Errors
Look for:
- ❌ "Connection refused" - Eureka not running
- ❌ "Cannot get a connection" - MySQL not running
- ❌ "Port 8084 already in use" - Port conflict
- ❌ "Security configuration failure" - Configuration error

## Troubleshooting

### Error: "Connection refused" to Eureka
**Solution**: Start Eureka service on http://localhost:8761

### Error: "Cannot get a connection" to MySQL
**Solution**: Start MySQL on localhost:3306

### Error: "Port 8084 already in use"
**Solution**: Either kill process on 8084 or change port in application.yaml

### Error: "401 Unauthorized" from Gateway
**Solution**: Ensure JWT token is valid and role matches endpoint requirement

### Error: "403 Forbidden" from Gateway
**Solution**: User role doesn't match endpoint requirement (e.g., PATIENT trying to access PROVIDER endpoint)

### Error: "504 Gateway Timeout"
**Solution**: Medical history service not responding on port 8084

## Files Modified

✅ `src/main/java/.../config/SecurityConfig.java` - Role-based auth + CORS
✅ `src/main/java/.../security/JwtAuthenticationFilter.java` - JWT validation
✅ `src/main/resources/application.yaml` - Port configuration

## Documentation Files Created

- `STARTUP_GUIDE.md` - Detailed startup instructions
- `FIXES_SUMMARY.md` - Complete list of all issues fixed

---

**Ready to start the service! 🚀**

