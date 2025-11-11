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

## Deploy via Cloud Run Connected Repository

If you prefer Google Cloud to build and deploy automatically whenever you push to a branch:

1. **Connect the repository**
   - In the Cloud Console go to **Cloud Run → Create Service** (or select an existing service → **Edit & deploy new revision**).
   - Choose **Source code** as the deployment source and click **Set up with Cloud Build**.
   - Authorize GitHub/GitLab/Bitbucket access and select the repository & branch containing this project.

2. **Configure the build**
   - For a Docker-based build, pick **Dockerfile** and set the build context to the repo root (the `Dockerfile` lives alongside `package.json`).
   - Cloud Build will run `docker build` automatically; supply build arguments for Supabase as needed:
     ```text
     NEXT_PUBLIC_SUPABASE_URL
     NEXT_PUBLIC_SUPABASE_ANON_KEY
     SUPABASE_SERVICE_ROLE_KEY
     ```
     Add placeholders or actual values in the build configuration (Cloud Console → Cloud Build triggers → Trigger details → Substitutions).

3. **Set runtime configuration**
   - In the Cloud Run service configuration, set container port to **8080**.
   - Add environment variables matching your `.env.production` values under **Variables & Secrets**.

4. **Trigger deployments**
   - Enable automatic trigger so a push to the selected branch kicks off a Cloud Build → Cloud Run deployment pipeline.
   - You can also trigger manually via **Cloud Build → Triggers → Run**.

5. **Monitor builds & services**
   - Use **Cloud Build → History** to check build logs.
   - Use `gcloud run services describe skillsync --region us-central1` or the Cloud Run console for service status.

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
