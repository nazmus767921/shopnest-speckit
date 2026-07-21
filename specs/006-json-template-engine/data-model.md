# Data Model: json-template-engine

## Entities

### `themes`
Base templates that provide the global design system (CSS variables, font families).
- **id** (text, primary key): e.g. "elegance", "sunset"
- **name** (text): e.g. "Elegance"
- **css_variables** (jsonb): 
  ```json
  {
    "colors": {
      "surface": "#ffffff",
      "ink": "#000000",
      "primary": "#3b82f6"
    },
    "typography": {
      "headingFont": "Inter",
      "bodyFont": "Roboto"
    },
    "layout": {
      "borderRadius": "0.5rem"
    }
  }
  ```

### `merchant_themes`
Maps a merchant to their active theme and stores their personalized storefront layout.
- **merchant_id** (text, foreign key to merchants, primary key component)
- **theme_id** (text, foreign key to themes)
- **active_layout** (jsonb): The JSON tree representing the merchant's customized sections.
  ```json
  [
    {
      "id": "section-uuid-1",
      "type": "hero",
      "settings": {
        "headline": "Welcome to my store",
        "subheadline": "The best products"
      }
    },
    {
      "id": "section-uuid-2",
      "type": "featured_products",
      "settings": {
        "headline": "Top Picks",
        "productIds": ["prod_1", "prod_2"]
      }
    }
  ]
  ```

## Relationships
- A `Merchant` has one active `MerchantTheme`.
- A `MerchantTheme` belongs to one `Theme`.

## Schema Changes
- DROP `store_templates`
- DROP `storefront_sections`
- CREATE `themes`
- CREATE `merchant_themes`
