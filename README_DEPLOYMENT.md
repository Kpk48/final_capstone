# GCP Deployment Guide

This document explains how to build and deploy the SkillSync Next.js application to Google Cloud Run using Docker.

## Prerequisites

1. Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install).
2. Authenticate and set a project:
   ```bash
   gcloud auth login
   gcloud config set project <YOUR_PROJECT_ID>
   ```
3. Ensure billing is enabled for the project.
4. Enable required services:
   ```bash
   gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
   ```
5. Create an Artifact Registry repository if you do not already have one:
   ```bash
   gcloud artifacts repositories create skillsync-repo --repository-format=docker --location=us-central1
   ```

## Environment Variables

Copy the `.env.local` file to `.env.production` (or create it) and populate all variables required by the app. These values will be passed as secrets when deploying.

## Build and Push the Container

1. Build the Docker image:
   ```bash
   docker build -t us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/skillsync-repo/skillsync:latest .
   ```
2. Push the image:
   ```bash
   docker push us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/skillsync-repo/skillsync:latest
   ```

## Deploy to Cloud Run

1. Deploy using the pushed image:
   ```bash
   gcloud run deploy skillsync \
     --image us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/skillsync-repo/skillsync:latest \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --port 8080
   ```

2. Supply environment variables during deployment. Either set them inline:
   ```bash
   gcloud run deploy skillsync \
     --image us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/skillsync-repo/skillsync:latest \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --port 8080 \
     --set-env-vars NEXT_PUBLIC_SUPABASE_URL=... ,NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
   or reference a file:
   ```bash
   gcloud run deploy skillsync \
     --image us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/skillsync-repo/skillsync:latest \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --port 8080 \
     --set-env-vars-file=.env.production
   ```

## Useful Commands

- View recent revisions:
  ```bash
  gcloud run revisions list --service skillsync --region us-central1
  ```
- View logs:
  ```bash
  gcloud logs read --project=<YOUR_PROJECT_ID> --service=skillsync --region=us-central1
  ```
- Update service (after pushing a new image):
  ```bash
  gcloud run deploy skillsync --image us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/skillsync-repo/skillsync:latest --region us-central1 --platform managed
  ```

## Cleanup

To delete the Cloud Run service:
```bash
gcloud run services delete skillsync --region us-central1 --platform managed
```

To remove the image from Artifact Registry:
```bash
gcloud artifacts docker images delete us-central1-docker.pkg.dev/<YOUR_PROJECT_ID>/skillsync-repo/skillsync:latest
```
