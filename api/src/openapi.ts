import { catalog, listTemplates } from './catalog'

export function openApiDocument(origin: string) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Instatools API',
      version: '0.1.0',
      description: 'Invite-only JSON API for Instatools templates, designs, and PNG render.',
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
      '/v1/apps': { post: { security: [{ admin: [] }], summary: 'Create app + API key' } },
      '/v1/me': { get: { summary: 'Current app' } },
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
    'x-templates': listTemplates(),
    'x-catalogVersion': catalog.version,
  }
}
