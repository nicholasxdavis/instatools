import { APP_PAGE, HOME_PAGE, MARKETING_PAGE, NOT_FOUND_PAGE, THEME_PAGES } from './catalog'

export {
  APP_PAGE,
  HOME_PAGE,
  MARKETING_PAGE,
  NOT_FOUND_PAGE,
  THEME_PAGES,
  INDEXABLE_PAGES,
  jsonLdForPage,
} from './catalog'

export function pageForRoute(route) {
  if (route.name === 'not-found') return NOT_FOUND_PAGE
  if (route.name === 'theme') {
    return THEME_PAGES.find((page) => page.slug === route.params.slug) || NOT_FOUND_PAGE
  }
  if (route.name === 'app') return HOME_PAGE
  if (route.name === 'home') return MARKETING_PAGE
  return HOME_PAGE
}
