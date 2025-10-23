import React, { useState } from 'react';
import { ImageToCodeService, GeneratedComponent } from '../services/ImageToCodeService';

interface VisualEditorProps {
  apiKey?: string;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({ apiKey }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<GeneratedComponent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Options
  const [componentName, setComponentName] = useState('');
  const [useTypeScript, setUseTypeScript] = useState(true);
  const [styling, setStyleing] = useState<'tailwind' | 'styled-components' | 'css-modules'>('tailwind');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!imageFile || !apiKey) {
      setError('Please upload an image and provide an API key');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const service = new ImageToCodeService({
        provider: 'anthropic',
        model: 'claude-3-7-sonnet-20250219',
        apiKey,
      });

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const mimeType = imageFile.type;

        const result = await service.generateComponent('data:image', {
          componentName: componentName || undefined,
          typescript: useTypeScript,
          styling,
        });

        setGeneratedCode(result);
      };
      reader.readAsDataURL(imageFile);
    } catch (err: any) {
      setError(err.message || 'Failed to generate component');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode.code);
    }
  };

  return (
    <div className="visual-editor p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Visual Editor - Image to Code</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Image Upload */}
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            {imagePreview ? (
              <div>
                <img src={imagePreview} alt="Preview" className="max-w-full h-auto mx-auto mb-4" />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Remove Image
                </button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="text-gray-500">
                  <p className="text-lg mb-2">Drop image here or click to upload</p>
                  <p className="text-sm">Supports PNG, JPG, GIF, WebP</p>
                </div>
              </label>
            )}
          </div>

          {/* Options */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold mb-2">Generation Options</h3>

            <div>
              <label className="block text-sm font-medium mb-1">Component Name (optional)</label>
              <input
                type="text"
                value={componentName}
                onChange={(e) => setComponentName(e.target.value)}
                placeholder="MyComponent"
                className="w-full px-3 py-2 border rounded"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="typescript"
                checked={useTypeScript}
                onChange={(e) => setUseTypeScript(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="typescript" className="text-sm">Use TypeScript</label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Styling</label>
              <select
                value={styling}
                onChange={(e) => setStyleing(e.target.value as any)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="tailwind">Tailwind CSS</option>
                <option value="styled-components">Styled Components</option>
                <option value="css-modules">CSS Modules</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!imageFile || generating}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {generating ? 'Generating...' : 'Generate Component'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Right Panel - Generated Code */}
        <div className="space-y-4">
          {generatedCode ? (
            <>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">{generatedCode.componentName}</h3>
                  <button
                    onClick={copyToClipboard}
                    className="text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                  >
                    Copy Code
                  </button>
                </div>

                <div className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto max-h-96">
                  <pre className="text-sm">{generatedCode.code}</pre>
                </div>

                {generatedCode.metadata && (
                  <div className="mt-4 space-y-2">
                    {generatedCode.metadata.colors && (
                      <div>
                        <p className="text-sm font-medium">Colors:</p>
                        <div className="flex gap-2 mt-1">
                          {generatedCode.metadata.colors.map((color, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded border"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {generatedCode.metadata.responsive && (
                      <p className="text-sm text-green-600">✓ Responsive design</p>
                    )}

                    {generatedCode.metadata.accessibility && (
                      <p className="text-sm text-green-600">✓ Accessibility attributes included</p>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Dependencies</h4>
                <ul className="text-sm space-y-1">
                  {generatedCode.dependencies.map((dep, i) => (
                    <li key={i} className="font-mono">
                      npm install {dep}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="bg-gray-50 p-8 rounded-lg text-center text-gray-500">
              <p>Generated code will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
