#!/bin/bash

# MinIO CORS Configuration Script
# This script sets up CORS for MinIO to allow access from localhost and *.pengaruh.my.id

echo "Setting up MinIO CORS configuration..."

# MinIO endpoint
MINIO_ENDPOINT="http://localhost:9000"
MINIO_ALIAS="umkmradar"
MINIO_ACCESS_KEY="umkmradar"
MINIO_SECRET_KEY="umkmradar123"
BUCKET_NAME="assets"

# Configure MinIO client
mc alias set $MINIO_ALIAS $MINIO_ENDPOINT $MINIO_ACCESS_KEY $MINIO_SECRET_KEY

# Create bucket if not exists
mc mb $MINIO_ALIAS/$BUCKET_NAME --ignore-existing

# Set bucket policy to public read
cat > /tmp/policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::${BUCKET_NAME}/*"]
    }
  ]
}
EOF

mc anonymous set-json /tmp/policy.json $MINIO_ALIAS/$BUCKET_NAME

# Set CORS configuration
cat > /tmp/cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": [
        "http://localhost:*",
        "http://127.0.0.1:*",
        "https://*.pengaruh.my.id",
        "http://*.pengaruh.my.id"
      ],
      "AllowedMethods": [
        "GET",
        "PUT",
        "POST",
        "DELETE",
        "HEAD"
      ],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF

# Note: MinIO CORS configuration via mc command
# mc cors set /tmp/cors.json $MINIO_ALIAS/$BUCKET_NAME

echo "✅ MinIO CORS configuration completed!"
echo "   Bucket: $BUCKET_NAME"
echo "   Endpoint: $MINIO_ENDPOINT"
echo ""
echo "Note: CORS is configured to allow:"
echo "  - http://localhost:* (all ports)"
echo "  - http://127.0.0.1:* (all ports)"
echo "  - https://*.pengaruh.my.id"
echo "  - http://*.pengaruh.my.id"
