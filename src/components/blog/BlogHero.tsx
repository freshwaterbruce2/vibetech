
const BlogHero = () => {
  return (
    <section className="pt-28 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 font-heading">
          Our <span className="bg-gradient-to-r from-aura-accent to-purple-400 bg-clip-text text-transparent">Blog</span>
        </h1>
        <div className="w-32 h-1.5 bg-gradient-to-r from-aura-accent to-purple-400 mb-6 rounded-full"></div>
        <p className="text-aura-textSecondary text-lg max-w-3xl">
          Insights, tutorials, and updates from our team on web development, design, and technology.
        </p>
      </div>
    </section>
  );
};

export default BlogHero;
