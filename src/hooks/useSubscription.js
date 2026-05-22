// Thin re-export of the SubscriptionContext hook so existing imports
// (`import { useSubscription } from '../hooks/useSubscription'`) keep working.
// The actual implementation lives in src/contexts/SubscriptionContext.jsx so
// every component shares ONE fetch and ONE source of truth — no more
// "locked → unlocked" flash on navigation.
export { useSubscription } from '../contexts/SubscriptionContext'
