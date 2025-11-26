/**
 * VisualEditor Utilities
 * Helper functions for element rendering and code generation
 */
import React from 'react';

import type { PaletteItem, UIElement } from './types';

// Component palette items
export const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'button', label: 'Button', icon: '🔘' },
  { type: 'input', label: 'Input', icon: '��' },
  { type: 'text', label: 'Text', icon: '📄' },
  { type: 'card', label: 'Card', icon: '🎴' },
  { type: 'container', label: 'Container', icon: '📦' },
];

// Render actual UI element
export function renderElement(element: UIElement): React.ReactElement {
  switch (element.type) {
    case 'button':
      return (
        <button style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}>
          {(element.props.text as string) || 'Button'}
        </button>
      );
    case 'input':
      return (
        <input type="text" placeholder={(element.props.placeholder as string) || 'Enter text...'} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb', width: '100%' }} />
      );
    case 'text':
      return <p style={{ margin: 0, fontSize: '14px', color: '#1f2937' }}>{(element.props.content as string) || 'Text content'}</p>;
    case 'card':
      return (
        <div style={{ padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600' }}>{(element.props.title as string) || 'Card Title'}</h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{(element.props.description as string) || 'Card description'}</p>
        </div>
      );
    case 'container':
      return (
        <div style={{ padding: '16px', borderRadius: '8px', border: '1px dashed #d1d5db', background: '#f3f4f6' }}>
          Container (can nest elements here)
        </div>
      );
    default:
      return <div>Unknown element</div>;
  }
}

// Get default props for element type
export function getDefaultProps(type: UIElement['type']): Record<string, unknown> {
  switch (type) {
    case 'button':
      return { text: 'Click me' };
    case 'input':
      return { placeholder: 'Enter text...' };
    case 'text':
      return { content: 'Text content' };
    case 'card':
      return { title: 'Card Title', description: 'Card description' };
    case 'container':
      return {};
    default:
      return {};
  }
}

// Generate code for a single element
export function generateElementCode(element: UIElement, indent: number): string {
  const spaces = ' '.repeat(indent);

  switch (element.type) {
    case 'button':
      return `${spaces}<button className="px-5 py-2.5 bg-blue-500 text-white rounded-md hover:bg-blue-600">
${spaces}  ${(element.props.text as string) || 'Button'}
${spaces}</button>`;
    case 'input':
      return `${spaces}<input
${spaces}  type="text"
${spaces}  placeholder="${(element.props.placeholder as string) || 'Enter text...'}"
${spaces}  className="px-3 py-2 border border-gray-300 rounded-md w-full"
${spaces}/>`;
    case 'text':
      return `${spaces}<p className="text-sm text-gray-900">${(element.props.content as string) || 'Text content'}</p>`;
    case 'card':
      return `${spaces}<div className="p-5 border border-gray-200 rounded-lg bg-gray-50">
${spaces}  <h3 className="text-base font-semibold mb-2">${(element.props.title as string) || 'Card Title'}</h3>
${spaces}  <p className="text-sm text-gray-600">${(element.props.description as string) || 'Card description'}</p>
${spaces}</div>`;
    case 'container':
      return `${spaces}<div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-100">
${spaces}  Container
${spaces}</div>`;
    default:
      return `${spaces}<div>Unknown element</div>`;
  }
}

// Generate full component code
export function generateCode(elements: UIElement[]): string {
  const imports = `import React from 'react';\n\n`;
  const component = `export function GeneratedComponent() {\n  return (\n    <div style={{ padding: '20px' }}>\n${elements.map(el => generateElementCode(el, 6)).join('\n')}\n    </div>\n  );\n}`;
  return imports + component;
}
