import { useQuery } from '@tanstack/react-query'

import { queryKeys, type DashboardRange, type TopField } from '../../api/queryKeys'
import { useDashboardSource } from './dataSource'

const RANGE: DashboardRange = '24h'

export function useDashboardSummary() {
  const source = useDashboardSource()
  return useQuery({
    queryKey: queryKeys.dashboard.summary(source.kind, RANGE),
    queryFn: ({ signal }) => source.summary(signal),
  })
}

export function useEventsSeries() {
  const source = useDashboardSource()
  return useQuery({
    queryKey: queryKeys.dashboard.events(source.kind, RANGE),
    queryFn: ({ signal }) => source.eventsSeries(signal),
  })
}

export function useAlertsSeries() {
  const source = useDashboardSource()
  return useQuery({
    queryKey: queryKeys.dashboard.alertsBySeverity(source.kind, RANGE),
    queryFn: ({ signal }) => source.alertsSeries(signal),
  })
}

export function useTopList(field: TopField, limit: number) {
  const source = useDashboardSource()
  return useQuery({
    queryKey: queryKeys.dashboard.top(source.kind, field, limit, RANGE),
    queryFn: ({ signal }) => source.top(field, limit, signal),
  })
}

export function useRecentAlerts(limit: number) {
  const source = useDashboardSource()
  return useQuery({
    queryKey: queryKeys.alerts.list(source.kind, { limit }),
    queryFn: ({ signal }) => source.recentAlerts(limit, signal),
  })
}

export function useRecentIncidents(limit: number) {
  const source = useDashboardSource()
  return useQuery({
    queryKey: queryKeys.incidents.list(source.kind, { limit }),
    queryFn: ({ signal }) => source.recentIncidents(limit, signal),
  })
}
