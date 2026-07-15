# AI Data Flow

## General flow
1. content or media events are emitted from the core platform
2. AI workers subscribe to these events
3. the selected provider processes the input
4. derived artifacts are stored and indexed
5. product features consume the artifacts through interfaces

## Example flow
- upload complete -> speech-to-text -> transcript stored -> summarization and chapter detection run -> metadata and search artifacts updated

## Data ownership
- raw content remains in the core media domain
- AI outputs are derived data and should be stored separately
- embeddings and vector indexes are treated as search infrastructure artifacts
