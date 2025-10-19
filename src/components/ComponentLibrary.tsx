import React, { useState } from 'react';

interface Component {
  name: string;
  category: string;
  description: string;
  code: string;
  preview?: string;
  dependencies: string[];
}

const SAMPLE_COMPONENTS: Component[] = [
  {
    name: 'PrimaryButton',
    category: 'Button',
    description: 'Primary action button with hover effects',
    code: `export const PrimaryButton = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
    >
      {children}
    </button>
  );
};`,
    dependencies: ['react', 'tailwindcss'],
  },
  {
    name: 'Card',
    category: 'Layout',
    description: 'Content card with shadow and padding',
    code: `export const Card = ({ title, children }: { title?: string; children: React.ReactNode }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {title && <h3 className="text-xl font-bold mb-4">{title}</h3>}
      {children}
    </div>
  );
};`,
    dependencies: ['react', 'tailwindcss'],
  },
  {
    name: 'Input',
    category: 'Form',
    description: 'Styled text input with label',
    code: `export const Input = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
};`,
    dependencies: ['react', 'tailwindcss'],
  },
  {
    name: 'Modal',
    category: 'Overlay',
    description: 'Centered modal dialog with backdrop',
    code: `export const Modal = ({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};`,
    dependencies: ['react', 'tailwindcss'],
  },
];

export const ComponentLibrary: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', ...new Set(SAMPLE_COMPONENTS.map((c) => c.category))];

  const filteredComponents = SAMPLE_COMPONENTS.filter((comp) => {
    const matchesCategory = selectedCategory === 'All' || comp.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="component-library p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Component Library</h1>

      <div className="flex gap-6">
        {/* Sidebar - Categories */}
        <div className="w-64 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold mb-2">Categories</h3>
            <ul className="space-y-1">
              {categories.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded ${
                      selectedCategory === cat
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            <p className="font-medium mb-2">Total Components</p>
            <p className="text-2xl font-bold">{SAMPLE_COMPONENTS.length}</p>
          </div>
        </div>

        {/* Main Content - Component Grid */}
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredComponents.map((component) => (
              <div
                key={component.name}
                onClick={() => setSelectedComponent(component)}
                className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{component.name}</h3>
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {component.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{component.description}</p>
                <div className="flex gap-2 text-xs text-gray-500">
                  {component.dependencies.map((dep) => (
                    <span key={dep} className="bg-gray-100 px-2 py-1 rounded">
                      {dep}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredComponents.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <p>No components found matching your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* Code Preview Modal */}
      {selectedComponent && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedComponent(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedComponent.name}</h2>
                <p className="text-gray-600">{selectedComponent.description}</p>
              </div>
              <button
                onClick={() => setSelectedComponent(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto mb-4">
              <pre className="text-sm">{selectedComponent.code}</pre>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {selectedComponent.dependencies.map((dep) => (
                  <span key={dep} className="text-sm bg-gray-100 px-3 py-1 rounded">
                    {dep}
                  </span>
                ))}
              </div>

              <button
                onClick={() => copyToClipboard(selectedComponent.code)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
