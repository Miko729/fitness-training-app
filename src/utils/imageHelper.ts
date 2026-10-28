export function generateUnifiedImageUrl(name: string, part: string): string {
  return `https://placehold.co/600x400/111827/f9fafb/png?text=${encodeURIComponent(name)}%0A${encodeURIComponent(part)}`;
}
