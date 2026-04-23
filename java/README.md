# Commerce Bank Appointment System — Spring Boot Backend

Java 21 + Spring Boot 3.3 rewrite of the Commerce Bank appointment scheduling app
originally built with React + Supabase Edge Functions.

---

## Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Language     | Java 21                             |
| Framework    | Spring Boot 3.3                     |
| Persistence  | Spring Data JPA + Hibernate         |
| Database     | PostgreSQL 15+                      |
| Migrations   | Flyway                              |
| Security     | Spring Security (Bearer token)      |
| Build        | Maven                               |
| Tests        | JUnit 5 + Mockito + MockMvc         |

---

## Project Structure

```
src/
├── main/java/com/commercebank/
│   ├── CommerceBankApplication.java       Entry point
│   ├── model/                             JPA entities + reference data
│   │   ├── Appointment.java
│   │   ├── AppointmentHistory.java
│   │   ├── AuditLog.java
│   │   ├── RateLimitLog.java
│   │   └── ReferenceData.java             Static topics + branches
│   ├── repository/                        Spring Data JPA repos
│   ├── dto/Dtos.java                      All request/response records
│   ├── exception/                         Custom exceptions + global handler
│   ├── config/                            Security, CORS, token filter, app props
│   └── service/                           Business logic
│       ├── AppointmentService.java
│       ├── EmployeeAuthService.java
│       ├── AuditLogService.java
│       ├── TimeSlotService.java
│       └── RateLimitCleanupJob.java
└── main/resources/
    ├── application.properties
    └── db/migration/V1__initial_schema.sql
```

---

## Running Locally

### Prerequisites
- Java 21+
- Maven 3.9+
- PostgreSQL 15+

### 1. Create the database

```sql
CREATE DATABASE commercebank;
```

### 2. Configure credentials

Either edit `src/main/resources/application.properties` or set environment variables:

```bash
export DB_URL=jdbc:postgresql://localhost:5432/commercebank
export DB_USERNAME=postgres
export DB_PASSWORD=yourpassword
```

### 3. Set employee password hashes (optional — defaults are set)

```bash
# Generate a SHA-256 hash for a new password:
echo -n "YourNewPassword" | sha256sum

export STAFF_HASH=<sha256-of-staff-password>
export ADMIN_HASH=<sha256-of-admin-password>
```

### 4. Run

```bash
mvn spring-boot:run
```

Flyway will automatically create all tables on first start.

---

## API Reference

### Public (no auth required)

| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| GET    | `/api/topics`                   | List appointment topics            |
| GET    | `/api/branches?topicId={id}`    | List branches (optional filter)    |
| GET    | `/api/appointments/slots`       | Booked slots for branch + date     |
| GET    | `/api/appointments/time-slots`  | All available half-hour slots      |
| POST   | `/api/appointments`             | Book a new appointment             |
| POST   | `/api/employee/login`           | Employee login (returns token)     |

### Admin (Bearer token required)

Send the token returned by `/api/employee/login` as:
```
Authorization: Bearer <token>
```

| Method | Endpoint                                      | Role  | Description             |
|--------|-----------------------------------------------|-------|-------------------------|
| GET    | `/api/admin/appointments`                     | both  | List / search / filter  |
| PATCH  | `/api/admin/appointments/{id}/reschedule`     | both  | Reschedule appointment  |
| PATCH  | `/api/admin/appointments/{id}/status`         | both  | Update status           |
| PATCH  | `/api/admin/appointments/{id}/notes`          | both  | Save staff notes        |
| DELETE | `/api/admin/appointments/{id}`                | admin | Cancel appointment      |
| GET    | `/api/admin/appointments/{id}/history`        | both  | Change history          |
| GET    | `/api/admin/audit`                            | admin | Audit log               |
| POST   | `/api/admin/audit`                            | both  | Write audit entry       |

### Book Appointment — example request body

```json
{
  "topicId": 1,
  "branchId": 1,
  "date": "2026-06-01",
  "time": "10:00",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "phone": "555-123-4567"
}
```

---

## Authentication Model

Employee authentication mirrors the original React project:

1. Client POSTs the plaintext password to `/api/employee/login`
2. Server computes SHA-256 and compares against the configured hash
3. On success, returns `{ role: "staff"|"admin", token: "<sha256-hash>" }`
4. Client sends `Authorization: Bearer <token>` on subsequent admin requests
5. `EmployeeTokenFilter` validates the token and sets the Spring Security context

---

## Running Tests

```bash
mvn test
```

Tests use Mockito (no real DB required) and cover:
- Booking with rate limiting and slot conflict detection
- Rescheduling and status updates
- Admin-only cancel enforcement
- SHA-256 password verification
- Time slot generation
- Reference data lookups
- Controller validation (MockMvc)

---

## Connecting the React Frontend

Update the React app's API base URL to point to this server instead of Supabase:

```typescript
// Replace Supabase function calls with fetch() to:
const API_BASE = "http://localhost:8080/api";
```

For CORS in production, update `app.cors.allowed-origins` in `application.properties`.
