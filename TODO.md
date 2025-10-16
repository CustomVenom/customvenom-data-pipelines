# TODO — Next Slices

## Data Pipelines

- [ ] Add validation tests for baseline projections
  - Acceptance:
    - Schema validation passes for all week data
    - Required fields present (player_id, projection, sources_used)
    - No malformed JSON
  - Files:
    - scripts/validate_file.js (enhance)
    - tests/validation.test.js

- [ ] Add ETL smoke tests to CI
  - Acceptance:
    - Validate sample week data on PR
    - Check schema_version and structure
    - Fail on validation errors
  - Files:
    - .github/workflows/etl-validate.yml

## Notes
- Guardrails: all output JSON must include schema_version and last_refresh
- Phase 3: focus on validation and CI integration

