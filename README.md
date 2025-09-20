# Todo App — Serverless (AWS Lambda + API Gateway + DynamoDB)

## Overview
A simple serverless Todo application:
- Lambda (Node.js) implements CRUD.
- API Gateway provides REST endpoints, protected by an API key.
- DynamoDB stores todos.
- Frontend: `index.html` (simple single-file UI).

Region: **ap-south-1 (Mumbai)**  
API Base URL: `https://d1wj0xsreg.execute-api.ap-south-1.amazonaws.com/Prod`

## Local run (quick)
1. Put `index.html` (in the project folder) on your Desktop.
2. Start a simple static server from that folder:
   ```bash
   cd ~/Desktop
   python3 -m http.server 8000
