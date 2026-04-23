# Commerce Bank — Full Stack Project

React frontend + Spring Boot backend, running together via Docker Compose.
PostgreSQL runs on your host machine (already installed).

---

## Project Structure

```
commerce-bank-fullstack/
├── docker-compose.yml          ← Start everything here
├── .env.example                ← Copy to .env and fill in passwords
├── api-tests.http              ← IntelliJ REST Client test file
├── commerce-bank-java/         ← Spring Boot backend (port 8080)
└── commerce-bank-frontend/     ← React + Vite frontend (port 5173)
```

---

## One-Time Setup

### 1. Create the PostgreSQL database
Open pgAdmin or psql and run:
```sql
CREATE DATABASE commercebank;
```

### 2. Create your .env file
```bash
cp .env.example .env
```
Edit `.env` and set your PostgreSQL password. Optionally add a `CHAT_API_KEY`
(OpenAI key) to enable the chat assistant widget.

---

## Running the Full Stack

```bash
docker compose up --build
```

That's it. Docker will:
1. Build the Spring Boot backend JAR
2. Run Flyway migrations (creates all tables automatically)
3. Start the Vite dev server for the frontend

| Service  | URL                       |
|----------|---------------------------|
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:8080      |
| API docs | See api-tests.http         |

To stop everything:
```bash
docker compose down
```

---

## IntelliJ Setup (REST Client)

1. Install the **REST Client** plugin:
   Settings → Plugins → search "REST Client" → Install → Restart
2. Open `api-tests.http` in IntelliJ
3. Click the green ▶ button next to any request to run it
4. After running "Employee Login", copy the `token` value and paste it
   into the `@token` variable at the top of the file

---

## Opening in IntelliJ

You can open either project independently:

**Backend:**
- File → Open → select `commerce-bank-java/`
- IntelliJ detects `pom.xml` and imports Maven automatically
- Set SDK to Java 21 if prompted

**Frontend:**
- File → Open → select `commerce-bank-frontend/`
- Open the terminal and run `npm install` then `npm run dev`
- Or just let Docker handle it with `docker compose up`

---

## Chat Assistant

The chat bubble in the bottom-right corner requires an OpenAI-compatible API key.
Set it in your `.env` file:
```
CHAT_API_KEY=sk-...
```
It defaults to `gpt-4o-mini`. To use a different model or provider,
also set `CHAT_MODEL` and `CHAT_API_URL`.

---

## Employee Login

| Role  | Password   | Access                              |
|-------|------------|-------------------------------------|
| Staff | `Mul3$!26` | View, reschedule, notes, status     |
| Admin | *(set your own in .env)* | All of the above + cancel + audit log |

To set a new admin password:
```bash
echo -n "YourNewPassword" | sha256sum
# Paste the result into ADMIN_HASH in your .env
```
