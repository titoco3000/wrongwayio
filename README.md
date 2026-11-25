# WrongWayio

A joke-app heavily inspired by Duolingo, made for people who cant tell *right* from *left*. 

It has multiple games to help the user associate both the word to the direction, and the direction to the word.

**Available at:** https://wrongwayio.titoco.dev/

## Features

- daily streaks
- infinite mode
- infinite driving mode
- login (not secure at all)
- global scoreboard
- "premium" mode (provides no value)

## Structure

```
frontend/   React + Vite + Tailwind (+ Capacitor)
backend/    Rust (axum). One crate: local HTTP server + Lambda handler.
infra/      Terraform: DynamoDB users table, Lambda, HTTP API Gateway, S3 + CloudFront for the website, IAM, CloudWatch
```
## Usage

Stages are `dev` and `prod`, each its own Terraform workspace. Root `.env` holds `AWS_PROFILE`, `AWS_REGION`, `PROJECT`.

```sh
make install                     # backend, frontend, infra
cd infra && make deploy prod      # also writes backend/.env.prod and frontend/.env.prod
make deploy prod                  # backend lambda, then the website (S3 + CloudFront); prints its URL
make run                         # backend on DynamoDB Local (docker/podman) + frontend, no AWS needed
make run prod                     # same, but the backend uses the prod stage's real table
```
