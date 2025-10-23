import React from 'react';
import { Clock, User, Tag, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import AffiliateBox from './AffiliateBox';
import { BlogPost } from './types';

interface BlogPostContentProps {
  post: BlogPost;
}

const BlogPostContent: React.FC<BlogPostContentProps> = ({ post }) => {
  // Get affiliate recommendations by placement
  const sidebarAffiliates = post.affiliateRecommendations?.filter(
    rec => rec.placement === 'sidebar'
  ) || [];
  
  const footerAffiliates = post.affiliateRecommendations?.filter(
    rec => rec.placement === 'footer'  
  ) || [];

  // Function to render blog content with inline affiliates
  const renderContentWithInlineAffiliates = (content: string) => {
    if (!content) return null;

    // Split content by paragraphs and insert inline affiliates
    const paragraphs = content.split('\n\n');
    const inlineAffiliates = post.affiliateRecommendations?.filter(
      rec => rec.placement === 'inline'
    ) || [];

    return paragraphs.map((paragraph, index) => {
      const elements = [];
      
      // Add the paragraph
      if (paragraph.trim()) {
        elements.push(
          <div 
            key={`para-${index}`} 
            className="prose prose-lg max-w-none dark:prose-invert mb-6"
            dangerouslySetInnerHTML={{ 
              __html: formatBlogContent(paragraph) 
            }}
          />
        );
      }

      // Insert inline affiliate after every 3rd paragraph
      if (index % 3 === 2 && inlineAffiliates[Math.floor(index / 3)]) {
        elements.push(
          <div key={`affiliate-${index}`} className="my-8">
            <AffiliateBox 
              recommendation={inlineAffiliates[Math.floor(index / 3)]}
              variant="inline"
            />
          </div>
        );
      }

      return elements;
    }).flat();
  };

  // Helper to format markdown-like content
  const formatBlogContent = (content: string) => {
    return content
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/###\s(.+)/g, '<h3 class="text-xl font-bold mt-8 mb-4">$1</h3>')
      .replace(/##\s(.+)/g, '<h2 class="text-2xl font-bold mt-10 mb-6">$1</h2>')
      .replace(/^#\s(.+)/gm, '<h1 class="text-3xl font-bold mt-12 mb-8">$1</h1>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, 
        '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-6"><code>$2</code></pre>'
      );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/30">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${post.image})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        
        <div className="relative container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            {post.featured && (
              <Badge className="bg-aura-accent text-white">Featured Post</Badge>
            )}
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {post.title}
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {post.excerpt}
            </p>
            
            {/* Post Meta */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author || 'Vibe Tech'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.readTime}</span>
              </div>
            </div>
            
            {/* Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
          {/* Article Content */}
          <article className="lg:col-span-3">
            <Card className="p-8 bg-card/50 backdrop-blur-sm border-border/50">
              <div className="prose-container">
                {renderContentWithInlineAffiliates(post.content || '')}
              </div>
            </Card>
            
            {/* Footer Affiliates */}
            {footerAffiliates.length > 0 && (
              <div className="mt-12">
                <h3 className="text-xl font-bold mb-6">Recommended Resources</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  {footerAffiliates.map((affiliate, index) => (
                    <AffiliateBox
                      key={index}
                      recommendation={affiliate}
                      variant="footer"
                    />
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Author Bio */}
              <Card className="p-6 bg-card/80 backdrop-blur-sm border-border/50">
                <h3 className="font-bold mb-3">About the Author</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Full-stack developer passionate about modern web technologies, 
                  performance optimization, and sharing knowledge with the developer community.
                </p>
                <Badge variant="outline">Vibe Tech</Badge>
              </Card>

              {/* Sidebar Affiliates */}
              {sidebarAffiliates.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    Recommended Tools
                  </h3>
                  {sidebarAffiliates.map((affiliate, index) => (
                    <AffiliateBox
                      key={index}
                      recommendation={affiliate}
                      variant="sidebar"
                    />
                  ))}
                </div>
              )}

              {/* Newsletter Signup */}
              <Card className="p-6 bg-gradient-to-br from-aura-accent/10 to-aura-accent/5 border-aura-accent/20">
                <h3 className="font-bold mb-3">Stay Updated</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get notified when I publish new tutorials and tool recommendations.
                </p>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background/50 text-sm mb-3"
                />
                <Button size="sm" className="w-full">
                  Subscribe
                </Button>
              </Card>

              {/* Affiliate Disclosure */}
              <Card className="p-4 bg-muted/50 border-border/50">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>Affiliate Disclosure:</strong> This post contains affiliate links. 
                  When you purchase through these links, I earn a commission at no additional 
                  cost to you. I only recommend tools I personally use and believe will 
                  add value to your workflow.
                </p>
              </Card>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default BlogPostContent;