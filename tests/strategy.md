# Testing Strategy

## Test pyramid
- many unit tests for fast, local validation
- fewer integration tests for module interactions
- a smaller number of end-to-end tests for critical user journeys

## Test categories
- Unit Tests: validate isolated logic and domain behavior
- Integration Tests: validate modules, repositories, and adapters together
- Component Tests: validate UI components in isolation
- API Tests: validate HTTP contracts and API responses
- Contract Tests: validate service-to-service and provider interfaces
- Performance Tests: validate latency and throughput for key endpoints
- Load Tests: validate behavior under sustained traffic
- Stress Tests: validate behavior under extreme load or failure conditions

## Testing principles
- tests should be deterministic and fast
- prefer real behavior over mock-only assertions
- use fixtures and factories to reduce duplication
- keep tests close to the feature or package they validate
