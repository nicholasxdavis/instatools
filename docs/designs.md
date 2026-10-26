# Designs

A design is one template plus its JSON slice. Designs are scoped to your app.

```
GET    /v1/designs
POST   /v1/designs
GET    /v1/designs/{id}
PATCH  /v1/designs/{id}
PUT    /v1/designs/{id}
DELETE /v1/designs/{id}
```

Ids are UUIDs.

## Create

Body is a JSON object. Accepted shapes:

**Fields patch** (easiest for agents):

```json
{
  "template": "launch",
  "fields": {
    "headline": "One to replace them all.",
    "buttonText": "www.example.com"
  }
}
```

**Native slice** (same as the maker export):

```json
{
  "template": "template16",
  "t16": {
    "headline": "One to replace them all."
  }
}
```

**Maker export:** `{ "type": "instatools-design", "design": { "post": { ... } } }`.

Unspecified keys keep template defaults.

## Patch vs put

`PATCH` merges onto the stored design. `PUT` rebuilds from defaults, then applies the body.

Switching `template` on a patch starts from the new layout's defaults.

## List

```
GET /v1/designs?limit=50
```

Limit max is 200. Returns id, template, slug, timestamps. Not the full JSON.

Free accounts can store 25 designs. Pro can store 500. Over the cap returns `quota_exceeded`.

## Body limit

2MB. Keep photos as URLs when you can.
