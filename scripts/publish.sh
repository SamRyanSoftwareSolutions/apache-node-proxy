#!/bin/bash

# Publish script for GitHub Packages
# Make sure you have authenticated with: npm login --scope=@samryansoftwaresolutions --auth-type=legacy --registry=https://npm.pkg.github.com

echo "🚀 Publishing @samryansoftwaresolutions/apache-node-proxy to GitHub Packages..."

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting publish."
    exit 1
fi

# Publish to GitHub Packages
echo "📤 Publishing to GitHub Packages..."
npm publish

if [ $? -eq 0 ]; then
    echo "✅ Successfully published to GitHub Packages!"
    echo "📋 Package: @samryansoftwaresolutions/apache-node-proxy"
    echo "🌐 View at: https://github.com/SamRyanSoftwareSolutions/apache-node-proxy/packages"
else
    echo "❌ Failed to publish. Check your authentication and try again."
    exit 1
fi 