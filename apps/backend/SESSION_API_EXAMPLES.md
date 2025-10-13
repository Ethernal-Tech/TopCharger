# Sessions API — cURL Examples

## Start a session (driver)
```bash
curl -X POST "http://localhost:3000/api/chargers/<CHARGER_ID>/start" \
  -H "Authorization: Bearer <JWT>"
```

## Stop a session (driver)
```bash
curl -X POST "http://localhost:3000/api/sessions/<SESSION_ID>/stop" \
  -H "Authorization: Bearer <JWT>"
```

## List my sessions (driver)
```bash
curl "http://localhost:3000/api/sessions?page=1&pageSize=10" \
  -H "Authorization: Bearer <JWT>"
```

## List sessions on my chargers (host)
```bash
curl "http://localhost:3000/api/sessions?scope=host&page=1&pageSize=10" \
  -H "Authorization: Bearer <JWT>"
```

## Get one session (driver)
```bash
curl "http://localhost:3000/api/sessions/<SESSION_ID>" \
  -H "Authorization: Bearer <JWT>"
```

## Get one session (host)
```bash
curl "http://localhost:3000/api/sessions/<SESSION_ID>?scope=host" \
  -H "Authorization: Bearer <JWT>"
```