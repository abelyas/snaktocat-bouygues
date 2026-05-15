#!/bin/sh
echo "Running database migration..."
node scripts/create-database.js
echo "Starting application..."
exec node server.js
