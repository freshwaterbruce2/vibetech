export type Tool = 'select' | 'circle' | 'rectangle' | 'triangle' | 'star' | 'polygon' | 'arrow' | 'line' | 'text';

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
}

const tools: { id: Tool; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '↖️' },
  { id: 'circle', label: 'Circle', icon: '⭕' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'triangle', label: 'Triangle', icon: '△' },
  { id: 'star', label: 'Star', icon: '⭐' },
  { id: 'polygon', label: 'Polygon', icon: '⬡' },
  { id: 'arrow', label: 'Arrow', icon: '→' },
  { id: 'line', label: 'Line', icon: '/' },
  { id: 'text', label: 'Text', icon: 'T' },
];

export function Toolbar({ activeTool, onToolChange }: ToolbarProps) {
  return (
    <div className="w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-1">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          className={`
            w-full px-1 py-2 flex flex-col items-center justify-center rounded-lg
            transition-all duration-200
            ${
              activeTool === tool.id
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:scale-105'
            }
          `}
          title={tool.label}
        >
          <span className="text-2xl mb-0.5">{tool.icon}</span>
          <span className={`text-[9px] font-medium ${
            activeTool === tool.id ? 'text-blue-700' : 'text-gray-500'
          }`}>
            {tool.label}
          </span>
        </button>
      ))}

      <div className="flex-1" />

      {/* Separator */}
      <div className="w-8 h-px bg-gray-200 my-2" />

      {/* Zoom controls */}
      <button className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100">
        +
      </button>
      <button className="w-12 h-12 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100">
        −
      </button>
    </div>
  );
}
