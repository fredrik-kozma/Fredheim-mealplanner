import { Navigate } from 'react-router-dom'
import useStore from '../store/useStore'
import AllergenCardsView from '../components/allergenCards/AllergenCardsView'

/** The route exists either way. With the setting off, it is not a feature. */
export default function AllergenCardsPage() {
  const enabled = useStore((s) => s.allergenCardsEnabled)
  if (!enabled) return <Navigate to="/recipes" replace />
  return <AllergenCardsView />
}
