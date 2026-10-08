# WrongWayio

Learn left from right with minigames. See `dev-docs/plan.md`.

```
frontend/   React + Vite + Tailwind (+ Capacitor)
backend/    Rust (axum). One crate: local HTTP server + Lambda handler.
infra/      Terraform: DynamoDB users table, Lambda, HTTP API Gateway, S3 + CloudFront for the website, IAM, CloudWatch
```

Stages are `dev` and `prod`, each its own Terraform workspace. Root `.env` holds `AWS_PROFILE`, `AWS_REGION`, `PROJECT`.

```sh
make init                        # backend, frontend, infra
cd infra && make deploy dev      # prints env blocks: copy into backend/.env.dev and frontend/.env.dev
make deploy dev                  # backend lambda, then the website (S3 + CloudFront); prints its URL
make run                         # backend on DynamoDB Local (docker/podman) + frontend, no AWS needed
make run dev                     # same, but the backend uses the dev stage's real table
```

## API

| route | |
|---|---|
| `POST /users` `{name}` | register (409 `name-taken`) |
| `GET /users/{name}` | player data: records, last daily, streak, longest streak, premium |
| `POST /users/{name}/infinite` `{score, ms, byGear}` | submit records; best of each is kept |
| `POST /users/{name}/daily` `{date, result: done\|failed}` | first result per day counts; updates streaks |
| `POST /users/{name}/premium` `{from, days}` | add premium days |
| `GET /scoreboard?by=score\|time\|streak&limit=` | top players |

There are no passwords (login is a pinky promise), so the API trusts the name it is given.
