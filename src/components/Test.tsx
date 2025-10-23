interface TestProps {
  title?: string;
  description?: string;
}

const Test = ({ title = "Test Component", description = "This is a simple test component created by YOLO mode" }: TestProps) => {
  return (
    <div className="p-6 rounded-lg border border-aura-accent/20 bg-aura-background">
      <h2 className="text-2xl font-bold font-heading bg-gradient-to-r from-aura-accent to-aura-accentSecondary bg-clip-text text-transparent mb-4">
        {title}
      </h2>
      <p className="text-aura-text/80">
        {description}
      </p>
      <div className="mt-4 flex gap-2">
        <button className="px-4 py-2 bg-aura-accent text-white rounded-md hover:bg-aura-accent/90 transition-colors">
          Primary Action
        </button>
        <button className="px-4 py-2 border border-aura-accent text-aura-accent rounded-md hover:bg-aura-accent/10 transition-colors">
          Secondary Action
        </button>
      </div>
    </div>
  );
};

export default Test;
