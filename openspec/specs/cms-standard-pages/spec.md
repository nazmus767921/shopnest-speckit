# cms-standard-pages Specification

## Purpose
TBD - created by archiving change dynamic-templates-v2. Update Purpose after archive.
## Requirements
### Requirement: CMS Page Management
The system SHALL allow merchants to create, edit, and publish arbitrary standard pages (e.g., About Us, Shipping Policy) with a unique slug and rich HTML content using a WYSIWYG rich text editor.

#### Scenario: Merchant creates a new page
- **WHEN** a merchant creates a page with slug "shipping-policy" using the WYSIWYG editor and publishes it
- **THEN** the page becomes accessible at `/[subdomain]/pages/shipping-policy`

#### Scenario: Clean Empty Editor Output
- **WHEN** a merchant deletes all text in the WYSIWYG editor
- **THEN** the form field value SHALL be submitted as an empty string instead of empty HTML tags (like `<p></p>`)

#### Scenario: Link Protocol Normalization
- **WHEN** a merchant inserts a URL without a protocol (e.g., "google.com")
- **THEN** the system SHALL validate or normalize the link before rendering

#### Scenario: Safe HTML Pasteurization
- **WHEN** a merchant copy-pastes content with inline fonts, styles, or script tags from external sites
- **THEN** the editor SHALL strip external scripts and format tags to only preserve basic rich text elements (headings, bold, italic, lists, paragraphs)

### Requirement: Standard Page Template
The `TemplateModule` interface SHALL require a `StandardPage` component to wrap raw CMS HTML content in the store's branded layout.

#### Scenario: Customer views a standard page
- **WHEN** a customer visits a published standard page URL
- **THEN** the system renders the rich text content inside the store's standard header/footer layout using the `StandardPage` component

