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
| `GET /users/{name}` | player: `name`, `premiumFrom`, `premiumUntil`, `createdAt`, `currentStreakStart`, `lastStreakCheckin`, `largestStreak`, `drivingHighScores` (gears 1-5, R), `marathonHighScore` |
| `POST /users/{name}/infinite` `{drivingHighScores}` | submit scores; best of each is kept |
| `POST /users/{name}/marathon` `{marathonHighScore}` | submit marathon record; best is kept |
| `POST /users/{name}/daily` `{date, result: done\|failed}` | first result per day counts; updates streaks |
| `POST /users/{name}/premium` `{from, days}` | add premium days |
| `GET /scoreboard?by=score\|streak\|marathon\|gear-1..gear-5\|gear-R&limit=` | top players: `name`, `largestStreak`, `drivingHighScores`, `marathonHighScore` |

There are no passwords (login is a pinky promise), so the API trusts the name it is given.
