
import { Link } from "react-router-dom";
import { NeonButton } from "@/components/ui/neon-button";

interface BlogPostPreview {
  id: number;
  title: string;
  category: string;
  date: string;
  excerpt: string;
}

const blogPosts: BlogPostPreview[] = [
  {
    id: 1,
    title: "Blog Post Title 1",
    category: "Category",
    date: "May 10, 2023",
    excerpt: "Brief excerpt from the blog post that gives readers an idea of what the article is about..."
  },
  {
    id: 2,
    title: "Blog Post Title 2",
    category: "Category",
    date: "May 10, 2023",
    excerpt: "Brief excerpt from the blog post that gives readers an idea of what the article is about..."
  }
];

const BlogSection = () => {
  return (
    <section className="py-16 px-4 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-3xl font-bold mb-12 text-center font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">Latest Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogPosts.map((post) => (
            <Link 
              key={post.id}
              to={`/blog/post-${post.id}`}
              className="group"
            >
              <div className="glass-card border border-[color:var(--c-purple)/20] hover:border-[color:var(--c-purple)/40] hover:shadow-neon-purple-soft transform transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 h-full p-6">
                <div className="mb-4">
                  <span className="text-xs uppercase tracking-wider text-[color:var(--c-cyan)]">
                    {post.category}
                  </span>
                  <h3 className="text-xl font-semibold my-2 font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-200/90 mb-3">
                    {post.date}
                  </p>
                </div>
                <p className="text-slate-200/90">
                  {post.excerpt}
                </p>
                <div className="mt-4 text-[color:var(--c-cyan)] group-hover:drop-shadow-[0_0_6px_var(--c-cyan)] transition-all">Read more</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="text-center mt-10">
          <NeonButton variant="blue" asChild>
            <Link to="/blog">Read All Articles</Link>
          </NeonButton>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
