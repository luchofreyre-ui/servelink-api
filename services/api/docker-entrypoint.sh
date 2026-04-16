#!/bin/sh
set -e
# Apply pending Prisma migrations before app/worker start (production DATABASE_URL from platform).
# Do not use db push or migrate reset here.
npx prisma migrate deploy
exec "$@"
