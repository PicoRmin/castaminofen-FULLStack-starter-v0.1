# AI Architecture

## Core principles
- each AI capability is an isolated module with its own contract
- providers are implemented behind interfaces and adapters
- inference runs asynchronously through background workers
- results are stored as derived artifacts and not mixed with core domain data
- the system is designed for provider swapping and model experimentation

## Suggested module boundaries
- Speech to Text
- Translation
- Summarization
- Chapter Detection
- Auto Titles
- Auto Description
- Tag Generation
- Category Prediction
- Recommendation Engine
- Semantic Search
- Vector Database
- Embeddings
- Moderation AI
- Clipping AI
- Voice Enhancement
- Future LLM Integration

## Integration model
- product modules emit events such as `content.created` or `media.ready`
- AI workers listen to these events and produce artifacts
- downstream modules consume artifacts through typed interfaces
- provider-specific code remains inside infrastructure adapters
