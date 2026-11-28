/** Dashboard alert severities, most severe first (info exists only in the UI vocabulary). */
export const SEVERITIES_BY_RANK = ['critical', 'high', 'medium', 'low'] as const
export type DashboardSeverity = (typeof SEVERITIES_BY_RANK)[number]
