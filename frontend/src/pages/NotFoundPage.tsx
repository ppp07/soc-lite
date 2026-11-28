import { ButtonLink } from '../components/ButtonLink'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { DEFAULT_PATH } from '../routes'
import { Compass } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" eyebrow="Error 404" />
      <EmptyState icon={Compass} title="That page doesn’t exist">
        The address may be mistyped, or the page may have moved.
      </EmptyState>
      <div className="mt-stack">
        <ButtonLink to={DEFAULT_PATH}>Back to the dashboard</ButtonLink>
      </div>
    </>
  )
}
