import { catalog, listTemplates } from './catalog'
import { PLANS } from './plans'

export function openApiDocument(origin: string) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Instatools API',
      version: '0.2.0',
      description: 'JSON API for Instatools templates, designs, and PNG render. Sign up with an email. No AI.',
    },
    servers: [{ url: origin }],
    components: {
      securitySchemes: {
        bearer: { type: 'http', scheme: 'bearer' },
        admin: { type: 'apiKey', in: 'header', name: 'X-Admin-Token' },
      },
    },
    security: [{ bearer: [] }],
    paths: {
      '/v1/health': { get: { security: [], summary: 'Health' } },
      '/v1/plans': { get: { security: [], summary: 'Free and Pro quotas' } },
      '/v1/signup': { post: { security: [], summary: 'Email an API key' } },
      '/v1/apps': { post: { security: [{ admin: [] }], summary: 'Admin: create app + API key' } },
      '/v1/billing/webhook': { post: { security: [], summary: 'Stripe webhook' } },
      '/v1/billing/checkout': { post: { summary: 'Create Stripe Checkout session for Pro' } },
      '/v1/billing/portal': { post: { summary: 'Open Stripe billing portal' } },
      '/v1/me': { get: { summary: 'Current app and quota' } },
      '/v1/me/keys': { post: { summary: 'Rotate API key' } },
      '/v1/templates': { get: { summary: 'List templates' } },
      '/v1/templates/{id}': { get: { summary: 'Template defaults, fields, JSON Schema' } },
      '/v1/templates/{id}/schema': { get: { summary: 'JSON Schema only' } },
      '/v1/designs': {
        get: { summary: 'List designs' },
        post: { summary: 'Create design from JSON' },
      },
      '/v1/designs/{id}': {
        get: { summary: 'Get design' },
        patch: { summary: 'Merge JSON' },
        put: { summary: 'Replace JSON' },
        delete: { summary: 'Delete design' },
      },
      '/v1/designs/{id}/render': { post: { summary: 'Render stored design to PNG' } },
      '/v1/render': { post: { summary: 'One-shot JSON to PNG' } },
    },
    'x-plans': PLANS,
    'x-templates': listTemplates(),
    'x-catalogVersion': catalog.version,
  }
}
