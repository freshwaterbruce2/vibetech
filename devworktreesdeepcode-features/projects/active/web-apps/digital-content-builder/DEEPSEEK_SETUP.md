# DeepSeek Content Builder - Setup Guide

## Quick Start

1. **Get your DeepSeek API Key**
   - Visit: https://platform.deepseek.com/
   - Sign up or log in to your account
   - Navigate to API Keys section
   - Create a new API key
   - Copy the key (starts with `sk-`)

2. **Configure the Application**
   - Open `.env` file in the project root
   - Replace `your_deepseek_api_key_here` with your actual API key:
   ```
   DEEPSEEK_API_KEY=sk-your-actual-key-here
   ```

3. **Start the Server**
   ```bash
   npm install                  # Install dependencies (if not already done)
   npm run start:deepseek      # Start DeepSeek server on port 5556
   ```

4. **Open the Application**
   - Open your browser
   - Navigate to: http://localhost:5556/index-deepseek.html
   - The status indicator should show "Connected to DeepSeek API"

## Features

### Content Types Supported
- Blog Posts
- Articles
- eBooks
- Courses
- Landing Pages
- Email Templates
- Social Media Content
- Code Generation

### API Endpoints

#### Generate Content
```bash
POST /api/deepseek/generate
Content-Type: application/json

{
  "prompt": "Your content requirements",
  "contentType": "blog",
  "model": "deepseek-chat",
  "temperature": 0.7,
  "maxTokens": 2000,
  "stream": true
}
```

#### Chat Generation
```bash
POST /api/deepseek/chat
```

#### Code Generation
```bash
POST /api/deepseek/code
```

#### Check Available Models
```bash
GET /api/deepseek/models
```

#### Usage Statistics
```bash
GET /api/stats
```

## Models Available

1. **deepseek-chat** - General purpose content generation
   - Best for: Articles, blogs, creative writing, marketing content
   - Context: 32K tokens

2. **deepseek-coder** - Code and technical content
   - Best for: Code generation, technical documentation, API docs
   - Context: 16K tokens

## Advanced Configuration

### Environment Variables

```env
# Required
DEEPSEEK_API_KEY=sk-your-key-here       # Your DeepSeek API key

# Optional
DEEPSEEK_BASE_URL=https://api.deepseek.com  # API base URL (default)
PORT=5556                                    # Server port
JWT_SECRET=content-builder-secret-2025      # JWT secret for auth
DATABASE_PATH=./database.sqlite              # Database location
NODE_ENV=development                         # Environment mode
```

### Temperature Settings

- **0.0-0.3**: Focused, deterministic output (technical content)
- **0.4-0.7**: Balanced creativity and coherence (general content)
- **0.8-1.0**: Creative, diverse output (creative writing)
- **1.1-2.0**: Very creative, may be less coherent

### Token Limits

- Minimum: 100 tokens
- Maximum: 8000 tokens (depending on model)
- Recommended: 2000-4000 for most content types

## Streaming vs Non-Streaming

### Streaming Mode (Default)
- Real-time content generation
- Better user experience for long content
- Shows progress as content generates
- Can be stopped mid-generation

### Non-Streaming Mode
- Waits for complete response
- Better for API integration
- Returns complete JSON response
- Shows loading indicator

## Troubleshooting

### API Key Issues
- Ensure key starts with `sk-`
- Check for extra spaces or quotes
- Verify key is active on DeepSeek platform

### Connection Issues
- Check server is running: `npm run start:deepseek`
- Verify port 5556 is not in use
- Check firewall settings

### Generation Issues
- Reduce max tokens if getting timeouts
- Adjust temperature for better results
- Try different models for specific content types

## Usage Tips

1. **Be Specific in Prompts**
   - Include target audience
   - Specify tone and style
   - Mention key points to cover

2. **Choose Right Model**
   - Use `deepseek-chat` for general content
   - Use `deepseek-coder` for technical content

3. **Optimize Token Usage**
   - Start with lower token limits
   - Increase only if needed
   - Monitor usage statistics

4. **Export Options**
   - Markdown for documentation
   - HTML for web publishing
   - Text for plain content

## Cost Estimation

DeepSeek pricing (as of 2025):
- Input: $0.14 per million tokens
- Output: $2.00 per million tokens
- Cache hit: $0.014 per million tokens

Example usage:
- Blog post (2000 tokens): ~$0.004
- eBook chapter (5000 tokens): ~$0.01
- Full course outline (8000 tokens): ~$0.016

## Support

- DeepSeek Documentation: https://platform.deepseek.com/docs
- API Status: https://status.deepseek.com
- Community: https://discord.gg/deepseek

## Security Notes

- Never commit `.env` file to version control
- Rotate API keys regularly
- Use environment-specific keys
- Monitor usage for anomalies
- Implement rate limiting in production

## Next Steps

1. Test content generation with different prompts
2. Experiment with temperature settings
3. Try both streaming and non-streaming modes
4. Monitor token usage and costs
5. Customize UI for your specific needs