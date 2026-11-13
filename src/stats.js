// Histogram buckets, kept identical to the original app:
// [0,10) [10,30) [30,50) [50,70) [70,90) [90,100]
export const BUCKET_LOWER_BOUNDS = [0, 10, 30, 50, 70, 90];

/**
 * Validate a vote coming from an untrusted client.
 * Returns a number in [0, 100], or null if the input is not a usable number.
 */
export function sanitizeVote(value) {
  const n = typeof value === 'number' ? value : Number.parseFloat(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
}

/**
 * Compute aggregate statistics over an iterable of votes (numbers in [0, 100]).
 */
export function computeStats(votes) {
  const buckets = new Array(BUCKET_LOWER_BOUNDS.length).fill(0);
  let sum = 0;
  let count = 0;
  for (const vote of votes) {
    sum += vote;
    count += 1;
    let i = BUCKET_LOWER_BOUNDS.length - 1;
    while (vote < BUCKET_LOWER_BOUNDS[i]) i -= 1;
    buckets[i] += 1;
  }
  return { count, mean: count ? sum / count : null, buckets };
}
