export function serializeFeedStatus(status: string): string {
  return `${status ?? ''}`.trim().toUpperCase();
}

export function deserializeFeedStatus(status: string): string {
  return serializeFeedStatus(status);
}
