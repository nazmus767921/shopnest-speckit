export function generateThemeCss(cssVariables: Record<string, any> | undefined): string {
  if (!cssVariables) return '';

  let cssStr = ':root {\n';
  
  if (cssVariables.colors) {
    for (const [key, value] of Object.entries(cssVariables.colors)) {
      cssStr += `  --color-${key}: ${value};\n`;
    }
  }
  
  if (cssVariables.typography) {
    for (const [key, value] of Object.entries(cssVariables.typography)) {
      cssStr += `  --font-${key}: '${value}', sans-serif;\n`;
    }
  }

  if (cssVariables.layout) {
    for (const [key, value] of Object.entries(cssVariables.layout)) {
      // kebab-case the key
      const kebabKey = key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
      cssStr += `  --layout-${kebabKey}: ${value};\n`;
    }
  }
  
  cssStr += '}\n';
  return cssStr;
}
