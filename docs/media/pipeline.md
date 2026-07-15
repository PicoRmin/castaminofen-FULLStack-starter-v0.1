# Media Processing Pipeline

## FFmpeg pipeline
- ingest source asset
- extract metadata and duration
- generate optimized derivatives
- create thumbnails, waveform, captions, and manifests

## Supported processing stages
- audio: transcode to MP3 or AAC, waveform, metadata extraction
- video: transcode to H.264/H.265, generate HLS and DASH manifests, create poster frames
- image: generate WebP/AVIF variants and responsive sizes

## Subtitle pipeline
- extract or generate captions from audio/video streams
- store subtitles in VTT/SRT format
- support multiple languages and forced subtitles
