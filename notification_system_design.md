# Campus Notification Platform — System Design
# Pushkar Prabhath Rayana | AV.SC.U4CSE23135

---

# Stage 1

## Core Actions Identified

- Fetch all notifications for a student (with filters and pagination)
- Fetch a single notification by ID
- Mark a notification as read
- Mark all notifications as read
- Delete a notification
- Get unread notification count
- Real-time push of new notifications to connected clients

---

## REST API Endpoints

### 1. Get All Notifications

**GET** `/api/notifications`

**Headers:**
```
X-Student-ID: <student_id>
Content-Type: application/json
```

**Query Parameters:**
| Param | Type | Default | Description |
|---|---|---|---|
| page | number | 1 | Page number |
| limit | number | 20 | Results per page |
| notification_type | string | - | Filter: Event, Result, Placement |
| is_read | boolean | - | Filter by read status |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
        "studentId": "student-uuid",
        "type": "Placement",
        "message": "CSX Corporation hiring",
        "isRead": false,
        "createdAt": "2026-04-22T17:51:18Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Response 400:**
```json
{ "success": false, "error": "Invalid notification_type. Must be Event, Result, or Placement" }
```

---

### 2. Get Single Notification

**GET** `/api/notifications/:id`

**Headers:**
```
X-Student-ID: <student_id>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "81589ada-0ad3-4f77-9554-f52fb558e09d",
    "studentId": "student-uuid",
    "type": "Event",
    "message": "farewell",
    "isRead": false,
    "createdAt": "2026-04-22T17:51:06Z"
  }
}
```

**Response 404:**
```json
{ "success": false, "error": "Notification not found" }
```

---

### 3. Mark Single Notification as Read

**PATCH** `/api/notifications/:id/read`

**Response 200:**
```json
{ "success": true, "message": "Notification marked as read" }
```

---

### 4. Mark All Notifications as Read

**PATCH** `/api/notifications/read-all`

**Response 200:**
```json
{ "success": true, "message": "All notifications marked as read", "updatedCount": 42 }
```

---

### 5. Delete a Notification

**DELETE** `/api/notifications/:id`

**Response 200:**
```json
{ "success": true, "message": "Notification deleted" }
```

---

### 6. Get Unread Count

**GET** `/api/notifications/unread/count`

**Response 200:**
```json
{ "success": true, "data": { "unreadCount": 42 } }
```

---

## Real-Time Notification Mechanism

**Chosen approach: WebSockets via Socket.io**

### Why WebSockets?
- Persistent bidirectional connection — zero latency on new notifications
- Server pushes only when new data exists — no wasted polling requests
- Scales horizontally with Redis adapter across multiple server instances

### Flow:
1. On page load, client connects and joins student room:
   ```
   socket.emit("join_room", studentId)
   server: socket.join(studentId)
   ```
2. On new notification created, server emits to that student's room:
   ```json
   { "event": "new_notification", "data": { "id": "...", "type": "Placement", "message": "Google hiring" } }
   ```
3. Client prepends to list without page reload; unread badge increments in real time
4. Fallback: polling every 30s if socket disconnects

---

# Stage 2

## Database Choice: PostgreSQL

### Why PostgreSQL?
- ACID compliance — notification delivery state (is_read) must be reliably consistent
- Native ENUM types — maps perfectly to Event, Result, Placement
- Partial indexes — can index only WHERE is_read = FALSE, dramatically reducing index size
- Mature tooling — pgBouncer for pooling, pg_partman for partitioning, read replicas
- Better than MongoDB here — notifications are structured and relational; document store adds complexity without benefit

---

## DB Schema

```sql
CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');

CREATE TABLE students (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  roll_number   VARCHAR(100) UNIQUE NOT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  "notificationType" notification_type NOT NULL,
  message           TEXT NOT NULL,
  is_read           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Optimised indexes
CREATE INDEX idx_notifications_student_unread
  ON notifications (student_id, is_read, created_at DESC)
  WHERE is_read = FALSE;

CREATE INDEX idx_notifications_student_all
  ON notifications (student_id, created_at DESC);

CREATE INDEX idx_notifications_type_date
  ON notifications ("notificationType", created_at DESC);
```

---

## Problems at Scale (50,000 students, 5,000,000 notifications)

1. Full sequential scans — without indexes, every query reads all 5M rows
2. Table bloat — old notifications accumulate, VACUUM struggles, writes slow down
3. Connection exhaustion — 50k concurrent users exhaust PostgreSQL's max_connections
4. Write amplification — bulk inserts cause lock contention on a single table
5. Single point of failure — one DB node = one outage = total notification loss

---

## Solutions

1. Composite + partial indexes as shown in schema above
2. Range partitioning by created_at (monthly) — old months become read-only, reducing scan range
3. PgBouncer for connection pooling — pool 10,000 app connections into 100 real DB connections
4. Read replicas — route all SELECT queries to replica; writes go to primary
5. Archival strategy — notifications older than 90 days move to archived_notifications table

---

## Queries

### Fetch unread notifications (paginated)
```sql
SELECT id, "notificationType", message, created_at
FROM notifications
WHERE student_id = $1 AND is_read = FALSE
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

### Mark all as read
```sql
UPDATE notifications SET is_read = TRUE
WHERE student_id = $1 AND is_read = FALSE;
```

### Get unread count
```sql
SELECT COUNT(*) FROM notifications
WHERE student_id = $1 AND is_read = FALSE;
```

### Fetch by type
```sql
SELECT id, "notificationType", message, created_at, is_read
FROM notifications
WHERE student_id = $1 AND "notificationType" = $2
ORDER BY created_at DESC LIMIT $3 OFFSET $4;
```

---

# Stage 3

## Query Analysis

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

### Is this query accurate?
Functionally correct but has three problems:
- SELECT * fetches all columns including large TEXT fields unnecessarily
- No LIMIT clause — returns ALL unread rows; a student could have thousands
- No index on (studentID, isRead, createdAt) — causes full sequential scan at 5M rows

### Why is it slow?
With 5,000,000 rows and no index, PostgreSQL does a full sequential scan — reads every single row and checks the WHERE condition. At this scale that is O(n) — taking seconds per query. With 50,000 students hitting this simultaneously, the DB is completely overwhelmed.

### What to change?

Step 1 — Add a composite partial index:
```sql
CREATE INDEX idx_notifications_student_unread
ON notifications (student_id, is_read, created_at DESC)
WHERE is_read = FALSE;
```
Only indexes unread rows — index stays small as read notifications grow.

Step 2 — Rewrite the query:
```sql
SELECT id, "notificationType", message, created_at
FROM notifications
WHERE student_id = 1042 AND is_read = FALSE
ORDER BY created_at ASC
LIMIT 50 OFFSET 0;
```

### Cost Comparison
| | Before | After |
|---|---|---|
| Scan type | Sequential scan (5M rows) | Index scan (matching rows only) |
| Complexity | O(n) | O(log n + k) |
| Time at 5M rows | 2–8 seconds | < 5 milliseconds |

---

### Should we index every column to be safe?
No — this advice is harmful:
- Every index must update on every INSERT/UPDATE/DELETE — 10 indexes = 10x write cost
- Each index consumes RAM in buffer cache, evicting actual data
- Query planner may pick wrong index, causing a slower plan than no index
- Rule: index only columns used in WHERE, JOIN, and ORDER BY of high-frequency queries

---

### Query: Students who got a Placement notification in last 7 days
```sql
SELECT DISTINCT student_id
FROM notifications
WHERE "notificationType" = 'Placement'
  AND created_at >= NOW() - INTERVAL '7 days';
```

Supporting index:
```sql
CREATE INDEX idx_notifications_type_date
ON notifications ("notificationType", created_at DESC);
```

---

# Stage 4

## Problem
Notifications fetched on every page load for every student → constant high-load SELECT queries → DB overwhelmed → slow UX.

---

## Solutions & Tradeoffs

### Strategy 1: Redis Cache (Primary Recommendation)
Cache notification list per student with 60-second TTL. Invalidate on mark-read, delete, or new notification.

```
Cache key: notifications:{studentId}:{page}:{type}
TTL: 60 seconds
```

- Eliminates up to 95% of DB reads
- Sub-millisecond response from cache
- Requires Redis infrastructure
- Up to 60s staleness if invalidation misses

### Strategy 2: WebSocket Push (Eliminates Polling)
Client stores notifications in local state; server pushes only new deltas.

- Zero DB reads for refresh — client already has data
- Real-time with no latency
- Requires sticky sessions or Redis pub/sub for horizontal scaling
- Mobile clients disconnect frequently — need reconnect and catch-up logic

### Strategy 3: Cursor-Based Pagination
Replace OFFSET with cursor (last seen created_at):
```sql
SELECT ... WHERE created_at < $cursor LIMIT 20;
```
- O(log n) regardless of page depth
- No duplicate results when new notifications arrive
- Cannot jump to arbitrary page numbers

### Strategy 4: HTTP Cache Headers
Return `Cache-Control: private, max-age=30` on responses.
- Zero infrastructure cost
- No server-side invalidation possible
- Only works for GET requests

### Recommended Combined Architecture
1. Redis cache for notification lists (60s TTL, invalidated on mutation)
2. WebSocket for real-time new notification push
3. Cursor pagination for loading older notifications
4. Read replicas for all SELECT traffic

---

# Stage 5

## Shortcomings of Original Implementation

```
function notify_all(student_ids, message):
  for student_id in student_ids:
    send_email(student_id, message)
    save_to_db(student_id, message)
    push_to_app(student_id, message)
```

1. Synchronous sequential loop — 50,000 iterations blocking main thread. Each email ~200ms = 10,000 seconds total
2. No error isolation — failure at student 200 stops notifications for students 201–50,000
3. No retry — failed emails are permanently lost
4. DB and email coupled — if email API is down, DB inserts also stop; notification records are lost entirely
5. No rate limiting — email APIs have rate limits; 50,000 sync calls trigger throttling/bans
6. No progress tracking — no way to know how many succeeded or failed

### Should DB save and email send happen together?
No. They are independent concerns:
- DB record is the source of truth — must be written immediately and reliably
- Email is a side effect — it can fail, retry, or delay without affecting notification existence
- Coupling means a failed email rolls back a valid DB record, which is wrong

---

## Redesigned Implementation

```
function notify_all(student_ids, message):
  batch_id = generate_uuid()

  for student_id in student_ids:
    record = save_to_db(student_id, message, batch_id)  # synchronous, immediate

    enqueue("email_queue", {
      job_id: generate_uuid(),
      student_id: record.student_id,
      message: record.message,
      notification_id: record.id,
      attempts: 0
    })

    enqueue("push_queue", {
      job_id: generate_uuid(),
      student_id: record.student_id,
      notification_id: record.id
    })

  return { batch_id, queued: len(student_ids) }


# Email Worker (separate process, concurrency = 50)
function email_worker():
  while true:
    job = dequeue("email_queue")
    try:
      send_email(job.student_id, job.message)
      mark_job_complete(job.job_id)
    except RateLimitError:
      requeue_with_delay(job, delay_seconds=30)
    except EmailDeliveryError:
      job.attempts += 1
      if job.attempts < 3:
        requeue_with_backoff(job, delay=2^job.attempts * 60)
      else:
        move_to_dead_letter_queue(job)


# Push Worker (separate process, concurrency = 100)
function push_worker():
  while true:
    job = dequeue("push_queue")
    notification = get_from_db(job.notification_id)
    push_to_app(job.student_id, notification)
```

| Problem | Fix |
|---|---|
| Sequential loop | Workers process in parallel (50 email workers = 50x throughput) |
| No error isolation | Each job is independent |
| No retry | Exponential backoff, max 3 retries, dead letter queue |
| DB + email coupled | DB writes synchronously first; email is async side effect |
| Rate limiting | Worker requeues on 429 with delay |
| Recovery for 200-student failure | DB records already safe; failed jobs retry from dead letter queue |

Tools: BullMQ + Redis (Node.js)

---

# Stage 6

## Priority Inbox Approach

### Scoring Formula
```
score = (typeWeight × 100) + (1 / (1 + ageInMinutes)) × 10

Type weights:
  Placement = 3
  Result    = 2
  Event     = 1
```

Recent notifications of the same type always rank higher. A very recent Event can outrank an old Placement.

### Maintaining Top N Efficiently
Use a Min-Heap of fixed size N:
1. Initialise heap with first N notifications by score
2. On new notification: compute score → if score > heap.min(), evict min and insert new
3. O(log N) per insertion regardless of total notification count
4. N stays bounded at chosen value (10, 15, 20) at all times

### Files
- `priority_inbox.ts` — TypeScript implementation with Min-Heap
- `priority_inbox_output.png` — screenshot of console output
