export type TemplateMeta = {
  id: string;
  name: string;
  category: 'landing' | 'blog';
  path: string;
};

const landingModules = import.meta.glob('../../../templates/landing-pages/*.html', { as: 'raw', eager: true });
const blogModules = import.meta.glob('../../../templates/blogs/*.html', { as: 'raw', eager: true });

const templatesIndex: TemplateMeta[] = [
  { id: 'lp-saas', name: 'SaaS Product Launch', category: 'landing', path: 'landing-pages/saas.html' },
  { id: 'lp-agency', name: 'Agency Portfolio', category: 'landing', path: 'landing-pages/agency.html' },
  { id: 'blog-howto', name: 'How-to Guide', category: 'blog', path: 'blogs/howto.html' },
  { id: 'blog-listicle', name: 'Listicle', category: 'blog', path: 'blogs/listicle.html' }
];

export function listTemplates(category?: 'landing' | 'blog'): TemplateMeta[] {
  return templatesIndex.filter(t => (category ? t.category === category : true));
}

export function getTemplateContent(meta: TemplateMeta): string {
  const key =
    meta.category === 'landing' ? `../../../templates/${meta.path}` : `../../../templates/${meta.path}`;
  // Vite import glob uses exact keys with relative paths used above
  const mod = (meta.category === 'landing' ? landingModules : blogModules) as Record<string, string>;
  // Attempt direct key, else try both maps
  return mod[`../../../templates/${meta.path}`] ??
    (blogModules as Record<string, string>)[`../../../templates/${meta.path}`] ??
    '';
}
