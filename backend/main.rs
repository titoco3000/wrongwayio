//! Entry point: builds the store and hands `router::app` to [`serve`] --
//! a local TCP listener, or `lambda_http::run` when built with the `lambda` feature.

use wrongwayio_api::router;
use wrongwayio_api::store::Store;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()),
        )
        .with_target(false)
        .init();

    let app = router::app(Store::from_env().await);
    serve(app).await;
}

#[cfg(feature = "lambda")]
async fn serve(app: axum::Router) {
    if let Err(err) = lambda_http::run(app).await {
        eprintln!("lambda runtime error: {err}");
        std::process::exit(1);
    }
}

#[cfg(not(feature = "lambda"))]
async fn serve(app: axum::Router) {
    let port = std::env::var("PORT").unwrap_or_else(|_| "8003".to_string());
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}"))
        .await
        .expect("port is free");
    tracing::info!("listening on http://localhost:{port}");
    axum::serve(listener, app).await.expect("server crashed");
}
