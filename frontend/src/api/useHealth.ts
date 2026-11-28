import { useQuery } from '@tanstack/react-query'

import { getHealth } from './health'
import { queryKeys } from './queryKeys'

/** The one live backend call in the app so far. Public endpoint: no authentication involved. */
export const useHealth = () =>
  useQuery({
    queryKey: queryKeys.system.health(),
    queryFn: ({ signal }) => getHealth(signal),
    // A status indicator should reflect now, not a 30-second-old answer.
    staleTime: 0,
  })
