/**
 * Format deadline for display and countdown (patient timer).
 */
export function formatDeadlineDate(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Returns countdown text: "Dans 2j 5h", "Dans 3h", "Expiré", or empty if no deadline.
 */
export function getDeadlineCountdown(iso: string | undefined): { text: string; isOverdue: boolean } {
  if (!iso) return { text: '', isOverdue: false };
  const end = new Date(iso);
  if (isNaN(end.getTime())) return { text: '', isOverdue: false };
  const now = new Date();
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return { text: 'Expiré', isOverdue: true };
  const sec = Math.floor(ms / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);
  if (day > 0) return { text: `Dans ${day}j ${hour % 24}h`, isOverdue: false };
  if (hour > 0) return { text: `Dans ${hour}h ${min % 60}min`, isOverdue: false };
  if (min > 0) return { text: `Dans ${min}min`, isOverdue: false };
  return { text: 'Dans moins d\'une minute', isOverdue: false };
}
