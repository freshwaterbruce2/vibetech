
import React from "react";
import { Link } from "react-router-dom";
import { NeonButton } from "@/components/ui/neon-button";

interface BlogPost {
  id: number;
  title: string;
  date: string;
  description: string;
  slug: string;
}

const recentPosts: BlogPost[] = [
  {
    id: 1,
    title: "Accessibility Isn't Optional",
    date: "Aug 12, 2023",
    description: "How inclusive design expands your audience and your impact.",
    slug: "accessibility-isnt-optional"
  },
  {
    id: 2,
    title: "Speed Secrets",
    date: "Jul 28, 2023",
    description: "Three performance tweaks that halved load times—no hardware upgrades needed.",
    slug: "speed-secrets"
  }
];

const BlogSection = () => {
  return (
    <section className="py-16 px-4 relative">
      <div className="max-w-6xl mx-auto relative z-10">
        <h2 className="text-3xl font-bold mb-12 text-center font-heading bg-gradient-to-r from-[#c87eff] via-[#8d4dff] to-[#00f7ff] text-transparent bg-clip-text">
          Insights & Inspiration
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {recentPosts.map((post) => (
            <div key={post.id} className="glass-card border border-[rgba(0,255,255,0.2)] hover:border-[rgba(0,255,255,0.4)] hover:shadow-neon-blue transform transition-all duration-300 hover:-translate-y-1">
              <div className="p-6">
                <div className="flex flex-col">
                  <span className="text-sm text-white mb-2">{post.date} • {post.title}</span>
                  <h3 className="text-xl font-semibold mb-3 font-heading text-[color:var(--c-cyan)]">
                    {post.title}
                  </h3>
                  <p className="text-white mb-4">
                    {post.description}
                  </p>
                  <Link to={`/blog/${post.slug}`} className="text-[color:var(--c-cyan)] font-medium hover:underline mt-auto self-start">
                    Read More
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <NeonButton variant="secondary" asChild>
            <Link to="/blog">Read All Articles</Link>
          </NeonButton>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
