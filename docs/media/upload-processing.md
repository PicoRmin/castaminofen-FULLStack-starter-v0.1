# Upload and Processing Architecture

## Upload flows
- audio upload: store raw audio, generate waveform, extract metadata, and create derivatives
- video upload: store source video, queue transcoding, generate thumbnails, subtitles, and manifests
- image upload: store original image, generate variants, optimize, and provide responsive delivery

## Chunk upload and resume
- use multipart chunked uploads with resumable transfer support
- persist chunk metadata and resume state in storage or database
- support retry and resume after interruptions

## Background jobs
- use queues for transcoding, thumbnail generation, waveform generation, subtitle extraction, and metadata enrichment
- decouple asset acceptance from full processing completion
- emit events for progress and completion
