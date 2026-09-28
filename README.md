# GreenLog — Tree Plantation Drive Tracker

A simple Spring Boot REST backend for tracking plantation drives, planted trees, volunteers and survival check-ins.

## Technology
- Java 17
- Spring Boot 3.5.6
- Maven
- Spring Web
- Spring Data JPA
- MySQL
- Jakarta Validation

## 1. MySQL setup

You can either create the database manually:

```sql
CREATE DATABASE greenlog;
```

or let MySQL create it because `createDatabaseIfNotExist=true` is enabled.

Open:

`src/main/resources/application.properties`

and change:

```properties
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

## 2. Run

From the project folder:

```bash
mvn spring-boot:run
```

Or package it:

```bash
mvn clean package
java -jar target/greenlog-1.0.0.jar
```

The API runs at `http://localhost:8080`.

## 3. Main endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/drives` | Create plantation drive |
| GET | `/api/drives` | List drives |
| POST | `/api/volunteers` | Create volunteer |
| GET | `/api/volunteers` | List volunteers |
| POST | `/api/trees` | Log a planted tree |
| GET | `/api/trees` | List trees |
| GET | `/api/trees/due` | List trees due for check-in |
| POST | `/api/checkins` | Submit survival check-in |
| GET | `/api/checkins/tree/{treeId}` | View check-ins for a tree |
| GET | `/api/reports/survival-rate` | Survival rate by drive + species |
| GET | `/api/reports/leaderboard` | Volunteers ordered by trees planted |

## 4. Quick test order

### Create a drive
POST `/api/drives`

```json
{
  "name": "College Green Drive",
  "location": "SECE Campus",
  "date": "2026-09-28"
}
```

### Create a volunteer
POST `/api/volunteers`

```json
{
  "name": "Arun",
  "email": "arun@example.com"
}
```

### Plant a tree
POST `/api/trees`

Use the IDs returned by the previous requests.

```json
{
  "species": "Neem",
  "datePlanted": "2026-09-28",
  "drive": { "id": 1 },
  "plantedBy": { "id": 1 }
}
```

The application automatically sets the first check-in to 30 days after planting.

### Submit a survival check-in
POST `/api/checkins`

```json
{
  "checkInDate": "2026-10-28",
  "alive": true,
  "tree": { "id": 1 },
  "volunteer": { "id": 1 }
}
```

If `alive` is `false`, the tree becomes `DEAD` and cannot receive another check-in.

For an alive tree, the next check-in is automatically set 30 days after the submitted check-in date.

## 5. Business rules implemented

1. A dead tree cannot receive another check-in.
2. A check-in date cannot be before the tree's planting date.
3. Survival rate is calculated from the current tree status whenever the report is requested, so a new check-in immediately affects the report.
4. Due-tree listing only returns alive trees whose next check-in date has arrived.

## Project structure

```text
src/main/java/com/greenlog/
├── GreenLogApplication.java
├── controller/
├── entity/
├── exception/
├── repository/
└── service/
```

The project intentionally keeps the design small: no authentication, no frontend, no DTO layer, no unnecessary dashboard modules and no extra features outside the assignment.
