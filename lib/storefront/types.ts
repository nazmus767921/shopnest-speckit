export interface StorefrontContext {
  store: MerchantStore;
  merchant: User;
  templateSlug: string;
  isPreview: boolean;
  sections: any[];
  menus: Record<string, any>;
  categories: Category[];
  themeVars: Record<string, string>;
  cssVariables?: Record<string, any>;
}

export interface MerchantStore {
  id: string;
  name: string;
  subdomain: string;
  template: string;
  themeSettings: any;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}
