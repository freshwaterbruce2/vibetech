import React, { useState } from 'react';
import { Save, Eye, Plus, X, ExternalLink, Settings, FileText, Code, Wrench, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import PageLayout from '@/components/layout/PageLayout';
import { BlogPost, AffiliateRecommendation } from '@/components/blog/types';
import { affiliateLibrary } from '@/components/blog/enhancedBlogData';
import AffiliateBox from '@/components/blog/AffiliateBox';
import { 
  createProgrammingTutorialTemplate, 
  createToolReviewTemplate, 
  createBusinessGuideTemplate,
  templateCategories 
} from '@/components/blog/templates';

const BlogEditor = () => {
  const [post, setPost] = useState<Partial<BlogPost>>({
    title: '',
    excerpt: '',
    category: '',
    author: 'Vibe Tech',
    image: '',
    tags: [],
    content: '',
    featured: false,
    seoTitle: '',
    seoDescription: '',
    affiliateRecommendations: []
  });

  const [currentTag, setCurrentTag] = useState('');
  const [selectedAffiliates, setSelectedAffiliates] = useState<AffiliateRecommendation[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Handle form updates
  const updatePost = (field: keyof BlogPost, value: unknown) => {
    setPost(prev => ({ ...prev, [field]: value }));
  };

  // Handle tag management
  const addTag = () => {
    if (currentTag && !post.tags?.includes(currentTag)) {
      updatePost('tags', [...(post.tags || []), currentTag]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updatePost('tags', post.tags?.filter(tag => tag !== tagToRemove) || []);
  };

  // Handle affiliate link management
  const addAffiliate = (affiliate: AffiliateRecommendation) => {
    if (!selectedAffiliates.find(a => a.name === affiliate.name)) {
      const newAffiliates = [...selectedAffiliates, affiliate];
      setSelectedAffiliates(newAffiliates);
      updatePost('affiliateRecommendations', newAffiliates);
    }
  };

  const removeAffiliate = (affiliateName: string) => {
    const newAffiliates = selectedAffiliates.filter(a => a.name !== affiliateName);
    setSelectedAffiliates(newAffiliates);
    updatePost('affiliateRecommendations', newAffiliates);
  };

  const updateAffiliatePlacement = (affiliateName: string, placement: 'sidebar' | 'inline' | 'footer') => {
    const newAffiliates = selectedAffiliates.map(a => 
      a.name === affiliateName ? { ...a, placement } : a
    );
    setSelectedAffiliates(newAffiliates);
    updatePost('affiliateRecommendations', newAffiliates);
  };

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle template selection
  const applyTemplate = (templateId: string) => {
    if (!templateId || templateId === 'blank') return;

    let templateData: Partial<BlogPost> = {};

    switch (templateId) {
      case 'programming':
        templateData = createProgrammingTutorialTemplate(
          post.title || 'New Programming Tutorial',
          ['React', 'TypeScript']
        );
        break;
      case 'tool-review':
        templateData = createToolReviewTemplate(
          'Tool Name',
          'Development'
        );
        break;
      case 'business':
        templateData = createBusinessGuideTemplate(
          'Business Topic',
          'Career Development'
        );
        break;
    }

    if (templateData.affiliateRecommendations) {
      setSelectedAffiliates(templateData.affiliateRecommendations);
    }

    setPost(prev => ({
      ...prev,
      ...templateData,
      title: prev.title || templateData.title, // Keep existing title if set
    }));
  };

  // Auto-generate SEO fields
  const autoGenerateSEO = () => {
    if (post.title) {
      updatePost('slug', generateSlug(post.title));
      updatePost('seoTitle', `${post.title} | Vibe Tech`);
      updatePost('seoDescription', post.excerpt || '');
    }
  };

  const handleSave = async (shouldPublish = false) => {
    if (!post.title || !post.content) {
      alert('Please fill in title and content before saving.');
      return;
    }

    try {
      const postData = {
        ...post,
        slug: post.slug || generateSlug(post.title),
        published: shouldPublish,
        date: new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        readTime: `${Math.ceil((post.content?.length || 0) / 1000)} min read`,
        seo_title: post.seoTitle,
        seo_description: post.seoDescription,
        focus_keyword: post.focusKeyword,
        canonical_url: post.canonicalUrl,
        no_index: post.noIndex,
        no_follow: post.noFollow,
        affiliate_recommendations: selectedAffiliates
      };

      const response = await fetch('http://localhost:9001/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        const savedPost = await response.json();
        alert(shouldPublish ? 'Blog post published successfully!' : 'Blog post saved as draft!');
        console.log('Saved post:', savedPost);
        
        // Optionally redirect to the blog post
        if (shouldPublish) {
          window.open(`/blog/${savedPost.slug}`, '_blank');
        }
      } else {
        const error = await response.json();
        alert(`Error saving post: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error connecting to server. Please try again.');
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Blog Editor</h1>
              <p className="text-muted-foreground">Create and manage blog posts with integrated affiliate marketing</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleSave(false)}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              
              <Button onClick={() => handleSave(true)}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>

          {!previewMode ? (
            <div className="space-y-6">
              {/* Template Selection */}
              {!post.content && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Choose a Template</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {templateCategories.map((template) => {
                      const IconComponent = {
                        'Code': Code,
                        'Wrench': Wrench, 
                        'TrendingUp': TrendingUp,
                        'FileText': FileText
                      }[template.icon] || FileText;

                      return (
                        <Button
                          key={template.id}
                          variant={selectedTemplate === template.id ? "default" : "outline"}
                          className="h-auto p-4 flex flex-col items-center gap-2"
                          onClick={() => {
                            setSelectedTemplate(template.id);
                            applyTemplate(template.id);
                          }}
                        >
                          <IconComponent className="h-6 w-6" />
                          <div className="text-center">
                            <div className="font-medium text-sm">{template.name}</div>
                            <div className="text-xs text-muted-foreground">{template.description}</div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Editor */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="p-6">
                    <Tabs defaultValue="content" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="seo">SEO</TabsTrigger>
                        <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
                      </TabsList>
                    
                    <TabsContent value="content" className="space-y-4">
                      {/* Title */}
                      <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          value={post.title}
                          onChange={(e) => updatePost('title', e.target.value)}
                          placeholder="Enter blog post title..."
                          className="text-lg"
                        />
                      </div>

                      {/* Excerpt */}
                      <div>
                        <Label htmlFor="excerpt">Excerpt</Label>
                        <Textarea
                          id="excerpt"
                          value={post.excerpt}
                          onChange={(e) => updatePost('excerpt', e.target.value)}
                          placeholder="Brief description of your post..."
                          rows={3}
                        />
                      </div>

                      {/* Category and Featured */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select onValueChange={(value) => updatePost('category', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Programming">Programming</SelectItem>
                              <SelectItem value="CSS">CSS</SelectItem>
                              <SelectItem value="Business">Business</SelectItem>
                              <SelectItem value="Tools">Tools</SelectItem>
                              <SelectItem value="Design">Design</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2 mt-6">
                          <Switch
                            id="featured"
                            checked={post.featured}
                            onCheckedChange={(checked) => updatePost('featured', checked)}
                          />
                          <Label htmlFor="featured">Featured Post</Label>
                        </div>
                      </div>

                      {/* Image */}
                      <div>
                        <Label htmlFor="image">Featured Image URL</Label>
                        <Input
                          id="image"
                          value={post.image}
                          onChange={(e) => updatePost('image', e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>

                      {/* Tags */}
                      <div>
                        <Label>Tags</Label>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={currentTag}
                            onChange={(e) => setCurrentTag(e.target.value)}
                            placeholder="Add tag..."
                            onKeyPress={(e) => e.key === 'Enter' && addTag()}
                          />
                          <Button onClick={addTag} size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {post.tags?.map((tag) => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => removeTag(tag)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Content */}
                      <div>
                        <Label htmlFor="content">Content (Markdown supported)</Label>
                        <Textarea
                          id="content"
                          value={post.content}
                          onChange={(e) => updatePost('content', e.target.value)}
                          placeholder="Write your blog post content here..."
                          rows={20}
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Supports markdown: **bold**, *italic*, `code`, ### headings, ```code blocks```
                        </p>
                      </div>
                    </TabsContent>

                    <TabsContent value="seo" className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">SEO Settings</h3>
                        <Button onClick={autoGenerateSEO} variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Auto-Generate
                        </Button>
                      </div>

                      <div>
                        <Label htmlFor="slug">URL Slug</Label>
                        <Input
                          id="slug"
                          value={post.slug}
                          onChange={(e) => updatePost('slug', e.target.value)}
                          placeholder="url-friendly-title"
                        />
                      </div>

                      <div>
                        <Label htmlFor="seoTitle">SEO Title</Label>
                        <Input
                          id="seoTitle"
                          value={post.seoTitle}
                          onChange={(e) => updatePost('seoTitle', e.target.value)}
                          placeholder="Page title for search engines"
                        />
                        <p className="text-xs text-muted-foreground">
                          {post.seoTitle?.length || 0}/60 characters
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="seoDescription">SEO Description</Label>
                        <Textarea
                          id="seoDescription"
                          value={post.seoDescription}
                          onChange={(e) => updatePost('seoDescription', e.target.value)}
                          placeholder="Description for search engine results"
                          rows={3}
                        />
                        <p className={`text-xs ${
                          (post.seoDescription?.length || 0) > 160 ? 'text-red-500' : 'text-muted-foreground'
                        }`}>
                          {post.seoDescription?.length || 0}/160 characters {(post.seoDescription?.length || 0) > 160 && '(too long)'}
                        </p>
                      </div>

                      {/* Advanced SEO Settings */}
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-medium">Advanced SEO</h4>
                        
                        <div>
                          <Label htmlFor="focusKeyword">Focus Keyword</Label>
                          <Input
                            id="focusKeyword"
                            value={post.focusKeyword || ''}
                            onChange={(e) => updatePost('focusKeyword', e.target.value)}
                            placeholder="Main keyword to target"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Primary keyword this post should rank for
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="canonicalUrl">Canonical URL</Label>
                          <Input
                            id="canonicalUrl"
                            value={post.canonicalUrl || ''}
                            onChange={(e) => updatePost('canonicalUrl', e.target.value)}
                            placeholder="https://vibetech.io/blog/post-slug"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Prevents duplicate content issues
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="noIndex"
                              checked={post.noIndex || false}
                              onCheckedChange={(checked) => updatePost('noIndex', checked)}
                            />
                            <Label htmlFor="noIndex" className="text-sm">No Index</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="noFollow"
                              checked={post.noFollow || false}
                              onCheckedChange={(checked) => updatePost('noFollow', checked)}
                            />
                            <Label htmlFor="noFollow" className="text-sm">No Follow</Label>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="affiliates" className="space-y-4">
                      <h3 className="text-lg font-semibold">Affiliate Recommendations</h3>
                      
                      {/* Available Affiliates */}
                      <div>
                        <Label>Available Affiliate Links</Label>
                        <div className="grid gap-2 mt-2">
                          {affiliateLibrary.map((affiliate, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <h4 className="font-medium">{affiliate.name}</h4>
                                <p className="text-sm text-muted-foreground">{affiliate.category}</p>
                              </div>
                              <Button
                                onClick={() => addAffiliate(affiliate)}
                                size="sm"
                                disabled={selectedAffiliates.some(a => a.name === affiliate.name)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Selected Affiliates */}
                      {selectedAffiliates.length > 0 && (
                        <div>
                          <Label>Selected Affiliate Links</Label>
                          <div className="space-y-3 mt-2">
                            {selectedAffiliates.map((affiliate, index) => (
                              <div key={index} className="p-4 border rounded-lg">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-medium">{affiliate.name}</h4>
                                    <p className="text-sm text-muted-foreground">{affiliate.description}</p>
                                  </div>
                                  <Button
                                    onClick={() => removeAffiliate(affiliate.name)}
                                    size="sm"
                                    variant="destructive"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                
                                <div>
                                  <Label>Placement</Label>
                                  <Select
                                    defaultValue={affiliate.placement}
                                    onValueChange={(value: 'sidebar' | 'inline' | 'footer') => 
                                      updateAffiliatePlacement(affiliate.name, value)
                                    }
                                  >
                                    <SelectTrigger className="w-32">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="sidebar">Sidebar</SelectItem>
                                      <SelectItem value="inline">Inline</SelectItem>
                                      <SelectItem value="footer">Footer</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Live Site
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Blog Settings
                    </Button>
                  </div>
                </Card>

                {/* Writing Tips */}
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Writing Tips</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Use affiliate links naturally within content</li>
                    <li>• Include personal experience with recommended tools</li>
                    <li>• Add value before promoting products</li>
                    <li>• Keep SEO title under 60 characters</li>
                    <li>• Write engaging excerpts for better CTR</li>
                  </ul>
                </Card>

                {/* Affiliate Preview */}
                {selectedAffiliates.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Affiliate Preview</h3>
                    <div className="space-y-3">
                      {selectedAffiliates.slice(0, 2).map((affiliate, index) => (
                        <AffiliateBox
                          key={index}
                          recommendation={affiliate}
                          variant="sidebar"
                        />
                      ))}
                    </div>
                  </Card>
                )}
                </div>
              </div>
            </div>
          ) : (
            // Preview Mode
            <div>
              <Card className="p-8">
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <h1>{post.title}</h1>
                  <p className="text-lg text-muted-foreground">{post.excerpt}</p>
                  
                  {post.tags && (
                    <div className="flex gap-2 mb-6">
                      {post.tags.map(tag => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: post.content?.replace(/\n/g, '<br>') || '' 
                    }} 
                  />
                  
                  {selectedAffiliates.length > 0 && (
                    <div className="mt-8">
                      <h3>Recommended Resources</h3>
                      <div className="grid gap-4">
                        {selectedAffiliates.map((affiliate, index) => (
                          <AffiliateBox
                            key={index}
                            recommendation={affiliate}
                            variant="footer"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default BlogEditor;