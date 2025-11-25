
import React from "react";
import PageHeader from "@/components/ui/page-header";

const BlogHero = () => {
  return (
    <section className="pt-28 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <PageHeader 
          title="Our Blog"
          subtitle="Insights, tutorials, and updates from our team on web development, design, and technology."
          className="text-white"
        />
      </div>
    </section>
  );
};

export default BlogHero;
