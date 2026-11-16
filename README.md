# WrongWayio

A joke-app heavily inspired by Duolingo, made for people who cant tell *right* from *left*. 

It has multiple games to help the user associate both the word to the direction, and the direction to the word.

**Available at:** https://d1vxvxfinudb13.cloudfront.net

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
make init                        # backend, frontend, infra
cd infra && make deploy dev      # prints env blocks: copy into backend/.env.dev and frontend/.env.dev
make deploy dev                  # backend lambda, then the website (S3 + CloudFront); prints its URL
make run                         # backend on DynamoDB Local (docker/podman) + frontend, no AWS needed
make run dev                     # same, but the backend uses the dev stage's real table
```
