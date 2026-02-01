#!/bin/bash

# Script to set up milestones and issues for the Evaluation System project

# Define the repository and project details
REPO="GMNAPI/legalbot-rag"

# Create a milestone
MILESTONE_TITLE="Evaluation System Milestone"
MILESTONE_DUE_DATE="2026-03-01"

# Use GitHub API to create a milestone
curl -X POST https://api.github.com/repos/$REPO/milestones \
-H "Authorization: token YOUR_ACCESS_TOKEN" \
-H "Accept: application/vnd.github.v3+json" \
-d "{\"title\": \"$MILESTONE_TITLE\", \"due_on\": \"$MILESTONE_DUE_DATE\"}"

# Create issues for the project
ISSUES=(
    "Set up initial project structure"
    "Define project requirements"
    "Create wireframes"
    "Develop API endpoints"
    "Write documentation"
)

for ISSUE in "${ISSUES[@]}"; do
    curl -X POST https://api.github.com/repos/$REPO/issues \
    -H "Authorization: token YOUR_ACCESS_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -d "{\"title\": \"$ISSUE\"}"
done

echo "Milestone and issues created successfully!"