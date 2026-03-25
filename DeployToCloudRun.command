#!/bin/bash
cd "$(dirname "$0")"

echo "==================================================="
echo "   Deploying Achieve Studio School App to Cloud Run"
echo "==================================================="

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "⚠️ Error: Google Cloud CLI (gcloud) is not installed."
    echo "To deploy to Cloud Run, please install it from:"
    echo "https://cloud.google.com/sdk/docs/install"
    read -p "Press [Enter] to exit..."
    exit 1
fi

echo "🚀 Starting deployment to Google Cloud Run..."
echo "This may take a few minutes as it builds your application in the cloud."
echo "Note: Your API settings from .env.local will be included in the build."
echo ""

gcloud run deploy achieve-feedback-wrapper \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080

echo ""
echo "==================================================="
echo "✅ Deployment finished!"
echo "You can view your live app at the URL provided above."
read -p "Press [Enter] to exit..."
