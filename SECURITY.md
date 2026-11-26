# Security Policy

## Reporting

Report security vulnerabilities privately — do not open a public issue.

## Considerations

- JWT tokens expire after 7 days
- Wallet signatures verified via Ed25519
- Backend never holds private keys
- Prisma parameterized queries prevent SQL injection
- CORS configured via environment variable
- File uploads restricted by multer middleware
