name: Build and Push Fineract Web to Docker Hub

on:
  push:
    branches:
      - Release-1.11.0-preview-non-official
    tags:
      - 'v*'
  pull_request:
    branches:
      - Release-1.11.0-preview-non-official
  workflow_dispatch:

env:
  REGISTRY: docker.io
  IMAGE_NAME: racinepay-web

jobs:
  build-and-push:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to Docker Hub
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ secrets.DOCKER_USERNAME }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=semver,pattern={{major}}
          type=raw,value=latest,enable={{is_default_branch}}
          type=sha,prefix={{branch}}-
        labels: |
          org.opencontainers.image.title=Fineract Web
          org.opencontainers.image.description=Apache Fineract Web Application
          org.opencontainers.image.vendor=Apache Fineract

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        file: ./Dockerfile
        platforms: linux/amd64,linux/arm64
        push: ${{ github.event_name != 'pull_request' }}
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        build-args: |
          NPM_REGISTRY_URL=https://registry.npmjs.org/
          BUILD_ENVIRONMENT_OPTIONS=--configuration production
          PUPPETEER_DOWNLOAD_HOST_ARG=https://storage.googleapis.com
          PUPPETEER_CHROMIUM_REVISION_ARG=1011831
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Generate build summary
      run: |
        echo "## Docker Build Summary 🐳" >> $GITHUB_STEP_SUMMARY
        echo "**Image:** \`${{ env.REGISTRY }}/${{ secrets.DOCKER_USERNAME }}/${{ env.IMAGE_NAME }}\`" >> $GITHUB_STEP_SUMMARY
        echo "**Tags:** " >> $GITHUB_STEP_SUMMARY
        echo "${{ steps.meta.outputs.tags }}" | sed 's/^/- /' >> $GITHUB_STEP_SUMMARY
        echo "**Platforms:** linux/amd64, linux/arm64" >> $GITHUB_STEP_SUMMARY
        echo "**Pushed:** ${{ github.event_name != 'pull_request' }}" >> $GITHUB_STEP_SUMMARY

  security-scan:
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.event_name != 'pull_request'

    steps:
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ env.REGISTRY }}/${{ secrets.DOCKER_USERNAME }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: Upload Trivy scan results to GitHub Security tab
      uses: github/codeql-action/upload-sarif@v3
      if: always()
      with:
        sarif_file: 'trivy-results.sarif'
