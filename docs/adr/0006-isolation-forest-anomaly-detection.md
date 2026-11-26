# 0006. IsolationForest for anomaly detection

- Status: Accepted
- Date: 2026-11-26

## Context

ML-based anomaly detection must complement rule-based detection, run on CPU with
Scikit-learn, and work without large labelled datasets.

## Decision

- Use Scikit-learn `IsolationForest` (unsupervised) on per-entity (user, source IP)
  time-window features: event rate, failure ratio, distinct IPs/users/hosts/ports,
  hour-of-day deviation from baseline, new-geo flag, outbound bytes.
- Train on simulated baseline traffic; evaluate on labelled simulated attack scenarios
  (`scenario_id`) to report precision/recall.
- Store models with `joblib` in a fixed directory, registered in `ml_models` with
  version, parameters, metrics and SHA-256; verify the hash before loading. No model
  upload endpoint (pickle-based artifacts can execute code).
- Anomaly alerts include the top contributing features to aid explanation.

## Consequences

- No labels needed for training; fast to train and score.
- Feature engineering quality drives results; features are unit-tested.
- Contamination/threshold tuning is required and documented per model version.

## Alternatives considered

- **One-Class SVM:** slower, more sensitive to scaling.
- **Autoencoders:** require deep learning stack; out of scope.
- **Supervised classifiers:** need labelled real data.
