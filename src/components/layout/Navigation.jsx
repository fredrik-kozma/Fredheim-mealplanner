import { useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import useStore from '../../store/useStore'

const NAV_ITEMS = [
  {
    key: 'recipes',
    to: '/',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    key: 'planner',
    to: '/planner',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
  },
  {
    key: 'shopping',
    to: '/shopping',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
      </svg>
    ),
  },
  {
    key: 'packs',
    to: '/packs',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
    ),
  },
  {
    key: 'settings',
    to: '/settings',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
]

export default function Navigation() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const lastRecipesPath = useStore(s => s.lastRecipesPath)
  const setLastRecipesPath = useStore(s => s.setLastRecipesPath)

  // The recipes tab is active when on the list or any recipe detail/edit page
  const recipesActive = location.pathname === '/' ||
    location.pathname.startsWith('/recipes')

  // Remember the last recipes sub-path so returning to the tab lands
  // exactly where the user was (list, detail, edit, or new).
  useEffect(() => {
    if (recipesActive) {
      setLastRecipesPath(location.pathname)
    }
  }, [location.pathname, recipesActive, setLastRecipesPath])

  function handleRecipesClick(e) {
    e.preventDefault()
    navigate(lastRecipesPath || '/')
  }

  return (
    <>
      {/* Bottom nav — mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 safe-area-bottom">
        <div className="flex items-stretch h-16">
          {NAV_ITEMS.map(({ key, to, icon }) => {
            if (key === 'recipes') {
              return (
                <button
                  key={to}
                  onClick={handleRecipesClick}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors duration-150 ${
                    recipesActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {icon(recipesActive)}
                  <span>{t(`nav.${key}`)}</span>
                </button>
              )
            }
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex-1 flex flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors duration-150 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {icon(isActive)}
                    <span>{t(`nav.${key}`)}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* Side nav — desktop */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-slate-100 flex-col z-40">
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-lg">
            🍽
          </div>
          <span className="font-bold text-slate-800 text-base">{t('app.name')}</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {NAV_ITEMS.map(({ key, to, icon }) => {
            if (key === 'recipes') {
              return (
                <button
                  key={to}
                  onClick={handleRecipesClick}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors duration-150 ${
                    recipesActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  {icon(recipesActive)}
                  <span>{t(`nav.${key}`)}</span>
                </button>
              )
            }
            return (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {icon(isActive)}
                    <span>{t(`nav.${key}`)}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
        <div className="px-6 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">{t('app.name')} v1.0</p>
        </div>
      </nav>
    </>
  )
}
