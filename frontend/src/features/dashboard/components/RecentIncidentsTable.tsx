import { Skeleton } from '../../../components/ui/Skeleton'
import { LinkButton } from '../../../components/ui/LinkButton'
import { SeverityBadge } from '../../../components/ui/SeverityBadge'
import { StatusBadge } from '../../../components/ui/StatusBadge'
import { Table, Td, Th, THead, Tr } from '../../../components/ui/Table'
import { formatNumber, formatUtcDateTime } from '../../../lib/format'
import { ROUTES } from '../../../routes'
import { useRecentIncidents } from '../queries'
import { DataCard } from './DataCard'

const LIMIT = 5

export function RecentIncidentsTable() {
  const query = useRecentIncidents(LIMIT)
  return (
    <DataCard
      title="Incident activity"
      description="Most recently updated incidents"
      query={query}
      isEmpty={(d) => d.items.length === 0}
      empty={{
        title: 'No incidents in this window',
        message: 'Related alerts are grouped into incidents as they arrive.',
      }}
      skeleton={
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      }
      footnote="Times in UTC"
      actions={
        <LinkButton to={ROUTES.incidents.path} variant="ghost" size="sm">
          View all incidents
        </LinkButton>
      }
    >
      {(page) => (
        <Table caption="Incidents, most recently updated first">
          <THead>
            <Tr>
              <Th>Incident</Th>
              <Th>Title</Th>
              <Th>Severity</Th>
              <Th>Status</Th>
              <Th>Owner</Th>
              <Th numeric>Alerts</Th>
              <Th>Updated</Th>
            </Tr>
          </THead>
          <tbody>
            {page.items.map((i) => (
              <Tr key={i.id}>
                <Td mono className="whitespace-nowrap">
                  {i.number}
                </Td>
                <Td className="min-w-64 font-medium">{i.title}</Td>
                <Td>
                  <SeverityBadge severity={i.severity} />
                </Td>
                <Td>
                  <StatusBadge status={i.status} />
                </Td>
                <Td className="whitespace-nowrap">
                  {i.owner ?? <span className="text-text-subtle">Unassigned</span>}
                </Td>
                <Td numeric>{formatNumber(i.alert_count)}</Td>
                <Td className="whitespace-nowrap text-text-muted">
                  <time dateTime={i.updated_at}>{formatUtcDateTime(i.updated_at)}</time>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
    </DataCard>
  )
}
