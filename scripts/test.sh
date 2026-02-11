#!/bin/bash
set -e

echo "🧪 Running Backend Tests..."
cd backend
npm test -- run
cd ..

echo -e "\n🧪 Running Dashboard Tests..."
cd dashboard
npm test -- run
cd ..

echo -e "\n🧪 Running Client Tests..."
cd client
npm test -- run
cd ..

echo -e "\n✅ All Automated Tests Passed Successfully!"
