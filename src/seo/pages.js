import {
  ACCOUNT_PAGE,
  APP_PAGE,
  DOCS_PAGE,
  DOCS_SUBPAGES,
  HOME_PAGE,
  MARKETING_PAGE,
  NOT_FOUND_PAGE,
  PRICING_PAGE,
  THEME_PAGES,
} from './catalog'

export {
  ACCOUNT_PAGE,
  APP_PAGE,
  DOCS_PAGE,
  DOCS_SUBPAGES,
  HOME_PAGE,
  MARKETING_PAGE,
  NOT_FOUND_PAGE,
  PRICING_PAGE,
  THEME_PAGES,
  INDEXABLE_PAGES,
  jsonLdForPage,
} from './catalog'

export function pageForRoute(route) {
  if (route.name === 'not-found') return NOT_FOUND_PAGE
  if (route.name === 'theme') {
    return THEME_PAGES.find((page) => page.slug === route.params.slug) || NOT_FOUND_PAGE
  }
  if (route.name === 'app') return APP_PAGE
  if (route.name === 'docs-page') {
    return DOCS_SUBPAGES.find((page) => page.slug === route.params.slug) || DOCS_PAGE
  }
  if (route.name === 'docs') return DOCS_PAGE
  if (route.name === 'pricing') return PRICING_PAGE
  if (route.name === 'account') return ACCOUNT_PAGE
  if (route.name === 'home') return HOME_PAGE
  return HOME_PAGE
}
