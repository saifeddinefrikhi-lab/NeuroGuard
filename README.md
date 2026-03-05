# 🧠 NeuroGuard - Intelligent Alzheimer's Risk Detection System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Angular](https://img.shields.io/badge/Angular-18-DD0031?logo=angular)](https://angular.io/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.4.3-6DB33F?logo=springboot)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-007396?logo=java)](https://www.java.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)](https://www.mysql.com/)
[![Eureka](https://img.shields.io/badge/Eureka-Discovery-blueviolet)](https://spring.io/projects/spring-cloud-netflix)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.x-7952B3?logo=bootstrap)](https://getbootstrap.com/)

> *An intelligent web application for comprehensive Alzheimer's disease patient management, featuring automated risk detection, real-time alerts, multi-role monitoring, and a microservices architecture.*

---

## 📋 Overview

**NeuroGuard** is a cutting-edge healthcare platform designed to revolutionize the care of Alzheimer's disease patients. Continuous monitoring is essential for preventing high-risk situations such as falls, wandering, and abnormal behaviors. However, existing solutions often lack automation and personalization. NeuroGuard addresses these challenges by providing an intelligent, automated system that continuously analyzes patient behavior and enhances their safety through predictive analytics and business rule-based detection.

The system is built using a modern **microservices architecture**, enabling scalability, maintainability, and independent deployment of each service. It integrates a **machine learning model** to predict hospitalization risks, a **rule-based alert engine**, and an **Angular frontend** with role-based views for patients, caregivers, healthcare providers, and administrators.

### 🎯 Project Context

The care of Alzheimer's patients requires continuous surveillance to prevent dangerous situations such as:
- 🚨 Falls and physical injuries
- 🚶 Wandering and getting lost
- ⚠️ Abnormal or dangerous behaviors
- 📉 Health deterioration patterns

Current solutions are often:
- ❌ Poorly automated
- ❌ Insufficiently personalized
- ❌ Lack real-time monitoring capabilities
- ❌ Limited coordination between caregivers

### 🎯 Objectives

NeuroGuard aims to develop an intelligent web application with the following capabilities:
- 🔍 **Automated Risk Detection** – Business rule-based algorithms for identifying dangerous situations
- 🔔 **Smart Alert Generation** – Real-time notifications to relevant stakeholders (in-app, optionally email)
- 📊 **Comprehensive Patient Monitoring** – Continuous tracking of patient health and behavior
- 👥 **Multi-Role Management** – Clear role definitions for administrators, caregivers, healthcare providers, and patients
- 📈 **Medical History Tracking** – Detailed progression and diagnostic records
- 🤖 **ML-Powered Risk Prediction** – Hospitalization risk assessment using patient features
- 💬 **Community Forum** – Knowledge sharing and support network

---

## ✨ Features

### 🔐 Authentication & Authorization
- Secure user registration and login with JWT
- Role-based access control (Admin, Patient, Caregiver, Provider)
- Token invalidation on logout (server-side blacklist)

### 👤 User Role Management

#### 🔧 Administrator
- User management (create, update, delete, assign roles)
- System configuration and monitoring
- Overall platform oversight

#### 🏥 Healthcare Provider
- Create and manage patient medical histories
- Track disease progression (Mild, Moderate, Severe)
- Assign caregivers to patients
- View and respond to alerts (rule‑based & ML)
- Trigger manual or predictive alert generation

#### 🤝 Caregiver
- View assigned patients’ medical histories
- Receive notifications when new alerts are created
- Monitor patient alerts and mark them as resolved (if permitted)

#### 🙋 Patient
- View personal medical history
- See own alerts (past and present)
- Upload/download medical documents
- Participate in the community forum

### 🚨 Alert System
- **Rule-based alerts** – Triggered by configurable medical rules (e.g., severe progression, allergies, comorbidities)
- **ML-based alerts** – Generated when hospitalization risk exceeds a threshold (from Python ML service)
- **Manual alerts** – Providers can create custom alerts
- Alert severity levels: INFO, WARNING, CRITICAL
- Real-time **in-app notifications** for patients and caregivers
- Alert resolution tracking

### 📋 Medical History Management
- Comprehensive patient records including:
  - Diagnosis and date
  - Progression stage (Mild, Moderate, Severe)
  - Genetic risk, family history, environmental factors
  - Comorbidities (comma-separated)
  - Allergies (medication, environmental, food)
  - List of surgeries (with description and date)
  - Assigned providers and caregivers (by ID or username)
- File attachments (e.g., MRI scans, lab reports) – upload/download
- One medical history per patient (unique constraint)

### 🔬 ML-Powered Risk Prediction
- Python Flask microservice (`ml-predictor-service`)
- Accepts patient features (`age`, `gender`, `progressionStage`, `yearsSinceDiagnosis`, counts of comorbidities/allergies/surgeries, etc.)
- Returns hospitalization probability and risk level (MINIMAL, LOW, MODERATE, HIGH, CRITICAL)
- Can use a trained scikit‑learn model or a mock rule‑based model for testing
- Integrated with the risk‑alert‑service via Feign client

### 💬 Community Forum
- Post creation and management
- Comment system with threading
- Topic categorization
- User engagement and support

### 🔍 Advanced Search & Filtering
- Real-time search functionality
- Multi-criteria filtering
- Sorting capabilities
- Pagination for large datasets

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Angular** | 18.x | Core framework |
| **TypeScript** | 5.x | Primary language |
| **Bootstrap** | 5.x | UI framework |
| **SCSS** | – | Styling |
| **RxJS** | – | Reactive programming |
| **Tabler Icons** | – | Icon library |
| **FormsModule & ReactiveFormsModule** | – | Form handling |
| **HTTP Interceptors** | – | JWT injection |

### Backend (Microservices)

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| **Eureka Server** | 8761 | Spring Cloud Netflix | Service registry |
| **Gateway Service** | 8083 | Spring Cloud Gateway | API routing, CORS, load balancing |
| **User Service** | 8081 | Spring Boot, JPA, MySQL | User management, authentication, JWT |
| **Medical History Service** | 8082 | Spring Boot, JPA, MySQL | Patient medical records, file storage |
| **Risk Alert Service** | 8084 | Spring Boot, JPA, MySQL | Alert generation (rules & ML), notifications |
| **ML Predictor Service** | 5000 | Python, Flask, scikit‑learn | Hospitalization risk prediction |

**Common Backend Technologies:**
- Java 17, Spring Boot 3.4.3
- Spring Security, JWT (Auth0)
- Spring Data JPA, Hibernate, MySQL
- Spring Cloud Netflix Eureka (client)
- Spring Cloud OpenFeign (with token propagation interceptor)
- Lombok
- Maven

---

## 🏗️ Architecture

The system follows a microservices architecture with service discovery and an API gateway.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Angular Frontend                         │
│                         (http://localhost:4200)                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Gateway Service (8083)                       │
│              (Routing, CORS, Load Balancing)                      │
└───────┬──────────────────┬──────────────────┬──────────────────┬─┘
        │                  │                  │                  │
        ▼                  ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  User Service │  │Medical History│  │Risk Alert     │  │   ML Predictor│
│    (8081)     │  │  Service (8082)│  │Service (8084) │  │   (5000)      │
│ - Auth        │  │ - CRUD history│  │ - Rule alerts │  │ - /predict    │
│ - User CRUD   │  │ - File upload │  │ - ML alerts   │  │ - /health     │
│ - JWT tokens  │  │ - Caregiver   │  │ - Notifications│  │               │
└───────────────┘  │   assignment  │  └───────────────┘  └───────────────┘
                   └───────────────┘
        │                  │                  │                  │
        └──────────────────┴──────────────────┴──────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Eureka Server (8761) │
                    │   Service Registry     │
                    └───────────────────────┘
```

- **Eureka Server** – All microservices register themselves, enabling dynamic discovery.
- **Gateway** – Routes requests to appropriate services, adds CORS headers, and forwards JWT tokens.
- **User Service** – Manages users, roles, authentication, and JWT issuance.
- **Medical History Service** – Core domain for patient medical data and file storage.
- **Risk Alert Service** – Evaluates patient data against rules and ML predictions, generates alerts and notifications.
- **ML Predictor Service** – Python‑based service that returns hospitalisation risk probabilities.

---

## 📦 Microservices Details

### 📦 Eureka Server
- **Port:** `8761`
- **Purpose:** Service registry.
- **Configuration:** Self‑registration disabled.
- **Run:** `mvn spring-boot:run`

### 📦 Gateway Service
- **Port:** `8083`
- **Purpose:** API Gateway with dynamic routing and CORS.
- **Routes:**
  | Path | Target Service |
  |------|----------------|
  | `/auth/**`, `/users/**` | user-service |
  | `/api/provider/medical-history/**`, `/api/patient/medical-history/**`, `/api/caregiver/medical-history/**`, `/files/**`, `/test` | medical-history-service |
  | `/api/patient/alerts/**`, `/api/caregiver/alerts/**`, `/api/provider/alerts/**` | risk-alert-service |
- **Run:** `mvn spring-boot:run`

### 📦 User Service
- **Port:** `8081`
- **Database:** `userdb`
- **Key Entities:** `User` (id, firstName, lastName, username, email, phoneNumber, gender, age, role, password)
- **Key Endpoints:**
  - `POST /auth/login` – Login, returns JWT
  - `POST /auth/register` – Register new user
  - `GET /users/{id}` – Get user by ID (includes gender & age for ML features)
  - `GET /users/role/{role}` – Get all users of a role
  - Admin endpoints for user management
- **Run:** `mvn spring-boot:run`

### 📦 Medical History Service
- **Port:** `8082`
- **Database:** `medical_history_db`
- **Key Entities:** `MedicalHistory`, `MedicalRecordFile`, `Surgery`
- **Key Endpoints:**
  - `POST /api/provider/medical-history` – Create history
  - `GET /api/provider/medical-history/features/{patientId}` – Get ML features (age, gender, progression stage, counts, etc.)
  - `GET /api/patient/medical-history/me` – Patient view
  - File upload/download endpoints
- **File Storage:** Local directory `uploads/medical-history/`
- **Run:** `mvn spring-boot:run`

### 📦 Risk Alert Service
- **Port:** `8084`
- **Database:** `risk_alert_db`
- **Key Entities:** `Alert`, `Notification`
- **Alert Generation:**
  - **Rule‑based:** 10 medical rules (severe progression, allergies, age, etc.)
  - **ML‑based:** Calls `ml-predictor-service`; creates alert if probability > 0.7
  - **Manual:** Providers can create alerts via API
- **Notifications:** In‑app notifications for patients and assigned caregivers (stored in DB, exposed via REST)
- **Key Endpoints:**
  - `POST /api/provider/alerts/generate` – Rule‑based generation
  - `POST /api/provider/alerts/generate-predictive` – ML generation
  - `GET /api/patient/alerts` – Patient’s own alerts
  - `GET /api/caregiver/alerts` – Alerts for assigned patients
  - `POST /api/notifications/mark-read` – Mark notifications as read
- **Run:** `mvn spring-boot:run`

### 📦 ML Predictor Service (Python)
- **Port:** `5000`
- **Purpose:** Hospitalization risk prediction.
- **Endpoints:**
  - `POST /predict` – Accepts patient features, returns `{ patientId, prediction (0/1), probability, riskLevel, riskPercentage, recommendation }`
  - `GET /health` – Health check
- **Model:** Can use a trained scikit‑learn model or a mock rule‑based model (for testing).
- **Run:**
  ```bash
  pip install -r requirements.txt
  python app.py
  ```

---

## 👥 Contributors

This project was developed by a dedicated team of students and supervised by experienced faculty members.

### Development Team
- 👨‍💻 **Saif Eddine Frikhi** 
- 👨‍💻 **Ameni Ferjeni** 
- 👨‍💻 **Hamza Znaidi** 
- 👨‍💻 **Jihen Ben AMMAR**
- 👨‍💻 **Nour Trabelsi**
- 👨‍💻 **Eya Ezzedine**

---

## 🎓 Academic Context

This project is developed as part of an **Integrated Project (Projet Intégré)** in the academic curriculum.

**Project Details:**
- 📚 **Course:** Integrated Project - Software Engineering
- 🏫 **Institution:**  Esprit School of Engineering
- 📅 **Academic Year:** 2025-2026
- 🎯 **Subject:** Application intelligente pour la détection des risques de la maladie d'Alzheimer
- ⏱️ **Duration:** 4 months
- 🎓 **Level:** 4rd SAE

**Learning Objectives:**
- Full-stack web application development
- Agile project management
- Team collaboration and version control
- Healthcare domain problem-solving
- Implementation of intelligent algorithms
- Real-world software deployment

---

## 🚀 Getting Started

### Prerequisites
- Java 17+
- Node.js 18+ & npm
- MySQL 8.0
- Python 3.10+ (for ML service)
- Maven

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/neuroguard.git
   cd neuroguard/Backend
   ```

2. **Create MySQL databases**
   ```sql
   CREATE DATABASE userdb;
   CREATE DATABASE medical_history_db;
   CREATE DATABASE risk_alert_db;
   ```

3. **Update configuration**  
   Edit `application.yaml` in each microservice to match your MySQL credentials and JWT secret.

4. **Build and run Eureka Server**
   ```bash
   cd eureka-server
   mvn clean package
   java -jar target/eureka-server-0.0.1-SNAPSHOT.jar
   ```

5. **Run the other microservices** (in separate terminals):
   ```bash
   cd user-service && mvn spring-boot:run
   cd medical-history-service && mvn spring-boot:run
   cd risk-alert-service && mvn spring-boot:run
   cd gateway-service && mvn spring-boot:run
   ```

6. **Start the ML predictor**
   ```bash
   cd ml-predictor-service
   pip install -r requirements.txt
   python app.py
   ```

### Frontend Setup

```bash
cd FrontEnd
npm install
ng serve
```

The application will be available at `http://localhost:4200`.

### Default Credentials
| Role | Email | Password |
|------|-------|----------|
| Administrator | admin@neuroguard.com | admin123 |
| Healthcare Provider | provider@neuroguard.com | provider123 |
| Caregiver | caregiver@neuroguard.com | caregiver123 |
| Patient | patient@neuroguard.com | patient123 |

---

## 🧪 Testing

### Frontend
```bash
# Unit tests
ng test

# E2E tests
ng e2e

# Code coverage
ng test --code-coverage
```

### Backend
```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=AlertServiceTest
```

---

## 📦 Build & Deployment

### Frontend Production Build
```bash
ng build --configuration production
# Output in dist/
```

### Backend Production Build
```bash
mvn clean package
# JAR files in target/ of each service
java -jar service-name.jar
```

### Docker (optional)
Each microservice includes a `Dockerfile`; you can use `docker-compose` to orchestrate all services.

---

## 📱 Application Features Demo

### Dashboard Views
- 🏠 **Home Dashboard** – Overview of patient status and recent alerts
- 📊 **Analytics** – Visual representations of patient data
- 🔔 **Alert Management** – Real-time alert monitoring and response
- 📋 **Patient Records** – Comprehensive medical history
- 💬 **Forum** – Community engagement platform

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



## 🙏 Acknowledgments

- 🎨 **Mantis Template** – Base admin dashboard template
- 📚 **Angular Team** – Excellent framework and documentation
- 🍃 **Spring Team** – Robust backend framework
- 🎓 **Academic Supervisors** – Guidance and support
- 💡 **Healthcare Professionals** – Domain expertise and requirements
- 🌟 **Open Source Community** – Libraries and tools

---

## 📞 Contact & Support

For questions, issues, or suggestions:

- 📧 Email: support@neuroguard.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/neuroguard/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/neuroguard/discussions)

---

## 🗺️ Roadmap

### Current Version (v1.0)
- ✅ User authentication and authorization
- ✅ Multi-role management
- ✅ Rule-based alert system
- ✅ ML-based risk prediction (mock model)
- ✅ Medical history tracking with file upload
- ✅ In-app notifications
- ✅ Community forum (basic)

### Future Enhancements (v2.0)
- 🔮 AI/ML-based behavior prediction (advanced models)
- 📱 Mobile application (iOS & Android)
- 🌐 Multi-language support
- 📊 Advanced analytics dashboard with charts
- 🔗 IoT device integration (wearables)
- 📞 Video consultation feature
- 🗣️ Voice assistant integration

---

<div align="center">

**Made with ❤️ for better Alzheimer's patient care**

⭐ Star this repository if you find it helpful!

</div>
