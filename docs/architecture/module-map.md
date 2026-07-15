# نقشه ماژول‌های اصلی

## 1. ماژول‌های کسب‌وکار

- Authentication
- Users
- Profiles
- Channels
- Creators
- Followers
- Podcast
- Episodes
- Playlists
- History
- Bookmarks
- Likes
- Comments
- Timestamp Comments
- Discussions
- Communities
- Notifications
- Recommendations
- Categories
- Tags
- Media
- Upload
- Audio
- Video
- Shorts
- Audiobooks
- Player
- Search
- Analytics
- Dashboard
- Admin
- Moderation
- Reports
- Payments
- Subscriptions
- Ads
- Wallet
- AI
- Transcription
- Translation
- Summaries
- Clipping
- Feeds
- Discovery
- Trending
- Realtime
- Messaging
- Settings
- Localization
- Feature Flags

## 2. ماژول‌های زیرساختی

- Auth Infrastructure
- Database Infrastructure
- Storage Infrastructure
- Cache Infrastructure
- Search Infrastructure
- Queue Infrastructure
- Media Infrastructure
- Realtime Infrastructure
- Observability Infrastructure
- Security Infrastructure

## 3. الگوی هر ماژول

```text
module/
  domain/
  application/
  infrastructure/
  interfaces/
  tests/
```

## 4. قواعد جداسازی

- هیچ ماژولی نباید مستقیماً به ماژول دیگری وابسته باشد.
- همه ارتباطات از طریق contracts/events/services انجام شود.
- هر ماژول باید API داخلی مشخص داشته باشد.
