# SoroWork API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

All protected endpoints require `Authorization: Bearer <JWT>`.

### Register
```
POST /auth/register
Body: { walletAddress: string, username: string }
```

### Login
```
POST /auth/login
Body: { walletAddress: string, signature: string, message: string }
Response: { token: string, user: User }
```

## Tasks (Community Work)

### List Tasks
```
GET /tasks?status=OPEN&tag=Cleaning&page=1&limit=20
```

### Create Task
```
POST /tasks (Auth required)
Body: { title: string, description: string, rewardAmount: number, tags: string[], communityId?: string }
```

### Get Task Detail
```
GET /tasks/:id
```

## Submissions

### Submit Work
```
POST /submissions (Auth required)
Body: { taskId: string, evidenceUrl: string, description?: string }
```

### Approve Submission
```
PUT /submissions/:id/approve (Auth required, task creator only)
```

## Error Responses

All errors follow: `{ error: string, message?: string, details?: object[] }`

| Status | Meaning |
|---|---|
| 400 | Validation error |
| 401 | Missing or invalid token |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 429 | Rate limited |
| 500 | Internal server error |
