import { Skeleton } from '../../../components/ui/Skeleton'
import { Badge } from '../../../components/ui/Badge'
import { LinkButton } from '../../../components/ui/LinkButton'
import { SeverityBadge } from '../../../components/ui/SeverityBadge'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Table, Td, Th, THead, Tr } from '../../../components/ui/Table'
import { formatNumber, formatUtcDateTime } from '../../../lib/format'
import { ROUTES } from '../../../routes'
import { useRecentAlerts } from '../queries'
import { DataCard } from './DataCard'

const LIMIT = 8

export function RecentAlertsTable() {
  const query = useRecentAlerts(LIMIT)
  return (
    <DataCard
      title="Recent alerts"
      description="Most recently active, newest first"
      query={query}
      isEmpty={(d) => d.items.length === 0}
      empty={{
        title: 'No alerts in this window',
        message: 'When a rule fires, it will appear here.',
      }}
      skeleton={
        <div className="space-y-3">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      }
      footnote="Times in UTC"
      actions={
        <LinkButton to={ROUTES.alerts.path} variant="ghost" size="sm">
          View all alerts
        </LinkButton>
      }
    >
      {(page) => (
        <Table caption="Alerts, most recently active first">
          <THead>
            <Tr>
              <Th>Severity</Th>
              <Th>Alert</Th>
              <Th>Source</Th>
              <Th>ATT&amp;CK</Th>
              <Th>Status</Th>
              <Th>Last seen</Th>
            </Tr>
          </THead>
          <tbody>
            {page.items.map((a) => {
              const source = a.entities.ips[0] ?? a.entities.hosts[0] ?? a.entities.users[0]
              const techniques = [
                ...new Set(a.mitre.map((m) => m.subtechnique_id ?? m.technique_id)),
              ]
              return (
                <Tr key={a.id}>
                  <Td>
                    <SeverityBadge severity={a.severity} />
                  </Td>
                  <Td className="min-w-72">
                    <p className="font-medium text-text">{a.title}</p>
                    <p className="type-data text-xs text-text-subtle">
                      {a.rule_key} · {formatNumber(a.count)} {a.count === 1 ? 'event' : 'events'}
                    </p>
                  </Td>
                  <Td mono className="whitespace-nowrap">
                    {source ?? '—'}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {techniques.map((t) => (
                        <Badge key={t} className="type-data">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </Td>
                  <Td>
                    <StatusBadge status={a.status} />
                  </Td>
                  <Td className="whitespace-nowrap text-text-muted">
                    <time dateTime={a.last_seen}>{formatUtcDateTime(a.last_seen)}</time>
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </DataCard>
  )
}
