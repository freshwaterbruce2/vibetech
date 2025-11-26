# Serena-Style Configuration Design for DeepCode Editor

## Overview
Integrating Serena's flexible configuration system into DeepCode Editor to provide context-aware AI assistance with dynamic mode switching.

## Current State Analysis

**Existing Configuration:**
- `UnifiedAIService`: Model selection (deepseek-chat, gpt-4, etc.)
- `SessionManager`: Session state and agent tracking
- `SecureApiKeyManager`: API key storage
- `localStorage`: Simple key-value settings
- No YAML configuration files
- No context/mode system

**What's Missing:**
- Project-level configuration persistence
- Context-aware AI behavior
- Dynamic mode switching
- Tool enable/disable per context
- System prompt customization per mode

## Proposed Configuration Architecture

### 1. Configuration File Structure

```
~/.deepcode/                          # Global config directory
├── deepcode_config.yml               # Global settings
├── contexts/                         # Custom contexts
│   ├── ide-assistant.yml
│   ├── code-reviewer.yml
│   └── pair-programmer.yml
└── modes/                            # Custom modes
    ├── quick-fix.yml
    ├── refactor.yml
    └── explain.yml

<project-root>/.deepcode/             # Project-specific config
├── project.yml                       # Project settings
└── workspace_context.json            # Indexed workspace data
```

### 2. Configuration Files

#### Global Config: `~/.deepcode/deepcode_config.yml`

```yaml
version: "1.0"

# Default AI provider settings
ai:
  default_provider: "deepseek"
  default_model: "deepseek-chat"
  temperature: 0.7
  max_tokens: 4000
  streaming: true

# Default context (can be overridden per session)
default_context: "ide-assistant"

# Default modes (can be combined)
default_modes:
  - "interactive"
  - "editing"

# Tool configuration
tools:
  enabled:
    - "code_completion"
    - "code_analysis"
    - "refactoring"
    - "error_detection"
    - "git_operations"
  disabled:
    - "web_search"  # Example: disable certain tools globally

# Agent configuration
agents:
  autonomous_mode: false
  max_concurrent_agents: 3
  task_timeout: 300  # seconds

# UI preferences
ui:
  theme: "dark"
  monaco_editor_options:
    fontSize: 14
    lineNumbers: true
    minimap: true
```

#### Project Config: `<project>/.deepcode/project.yml`

```yaml
version: "1.0"

# Project metadata
project:
  name: "My TypeScript Project"
  type: "typescript-react"  # Auto-detected or manually set
  language: "typescript"
  framework: "react"

# Project-specific AI settings (override global)
ai:
  context: "ide-assistant"
  modes:
    - "interactive"
    - "editing"
  model: "deepseek-coder"  # Use coding-specialized model

# Project-specific tool configuration
tools:
  enabled:
    - "typescript_analysis"
    - "react_component_generator"
  custom_rules:
    - "prefer_functional_components"
    - "use_typescript_strict_mode"

# Code style preferences
code_style:
  indent: 2
  quotes: "single"
  semi: true
  trailing_comma: "es5"

# Indexing configuration
indexing:
  auto_index_on_open: true
  exclude_patterns:
    - "node_modules/**"
    - "dist/**"
    - "*.test.ts"
  include_patterns:
    - "src/**/*.ts"
    - "src/**/*.tsx"
```

### 3. Contexts Definition

**Context**: Defines the environment and available tools

#### Built-in Contexts:

```yaml
# ~/.deepcode/contexts/ide-assistant.yml
name: "ide-assistant"
description: "Optimized for in-editor code assistance"

system_prompt: |
  You are an expert coding assistant integrated into an IDE.
  Focus on:
  - Providing context-aware code suggestions
  - Explaining code clearly and concisely
  - Helping with debugging and error resolution
  - Suggesting best practices and refactorings

  Always consider the current file context and project structure.

tools:
  enabled:
    - "code_completion"
    - "code_analysis"
    - "refactoring"
    - "error_detection"
    - "symbol_search"
    - "go_to_definition"
  disabled:
    - "project_scaffolding"
    - "package_management"

ui:
  show_confidence_scores: true
  show_alternative_suggestions: true
```

```yaml
# ~/.deepcode/contexts/code-reviewer.yml
name: "code-reviewer"
description: "Thorough code review and analysis"

system_prompt: |
  You are an expert code reviewer conducting a thorough analysis.
  Focus on:
  - Identifying bugs, security issues, and performance problems
  - Suggesting improvements to code quality
  - Checking adherence to best practices
  - Evaluating test coverage

  Provide detailed, constructive feedback.

tools:
  enabled:
    - "code_analysis"
    - "security_scanner"
    - "complexity_analyzer"
    - "test_coverage_checker"
    - "multi_agent_review"
  disabled:
    - "code_completion"
    - "quick_fixes"

ui:
  show_severity_indicators: true
  group_by_category: true
```

```yaml
# ~/.deepcode/contexts/pair-programmer.yml
name: "pair-programmer"
description: "Interactive pair programming experience"

system_prompt: |
  You are a pair programming partner.
  Focus on:
  - Collaborative problem-solving
  - Thinking through solutions together
  - Asking clarifying questions
  - Suggesting alternative approaches

  Engage in dialogue rather than just providing solutions.

tools:
  enabled:
    - "code_completion"
    - "code_generation"
    - "refactoring"
    - "test_generation"
    - "agent_mode"
  disabled: []

ui:
  show_thinking_process: true
  enable_follow_up_questions: true
```

### 4. Modes Definition

**Mode**: Defines task-specific behavior (can be combined)

#### Built-in Modes:

```yaml
# ~/.deepcode/modes/quick-fix.yml
name: "quick-fix"
description: "Fast error resolution"

system_prompt_modifier: |
  Mode: QUICK FIX
  - Prioritize speed over perfection
  - Provide immediate, working solutions
  - Explain briefly what was fixed
  - Suggest follow-up improvements separately

response_constraints:
  max_tokens: 1000
  temperature: 0.3  # More deterministic

tools:
  exclude:
    - "comprehensive_analysis"
    - "refactoring"  # No major refactors in quick-fix mode
```

```yaml
# ~/.deepcode/modes/refactor.yml
name: "refactor"
description: "Code improvement and restructuring"

system_prompt_modifier: |
  Mode: REFACTORING
  - Focus on improving code structure and maintainability
  - Consider performance implications
  - Preserve existing functionality
  - Suggest modern patterns and best practices
  - Explain the rationale for each change

response_constraints:
  max_tokens: 4000
  temperature: 0.5

tools:
  exclude:
    - "quick_fixes"
```

```yaml
# ~/.deepcode/modes/explain.yml
name: "explain"
description: "Educational code explanation"

system_prompt_modifier: |
  Mode: EXPLANATION
  - Break down complex code into understandable parts
  - Explain WHY things work, not just WHAT they do
  - Use analogies and examples
  - Adapt explanation depth to user's apparent knowledge level
  - Suggest related concepts to learn

response_constraints:
  max_tokens: 3000
  temperature: 0.7  # More creative explanations

tools:
  exclude:
    - "code_generation"
    - "refactoring"
```

```yaml
# ~/.deepcode/modes/test-generation.yml
name: "test-generation"
description: "Generate comprehensive tests"

system_prompt_modifier: |
  Mode: TEST GENERATION
  - Create thorough test coverage
  - Include edge cases and error conditions
  - Follow project's testing conventions
  - Use appropriate testing frameworks
  - Add descriptive test names and comments

tools:
  exclude:
    - "code_refactoring"
```

```yaml
# ~/.deepcode/modes/planning.yml
name: "planning"
description: "High-level task planning and analysis"

system_prompt_modifier: |
  Mode: PLANNING
  - Think through the problem before coding
  - Break down complex tasks into steps
  - Identify potential issues and dependencies
  - Suggest architecture and design patterns
  - Create actionable task lists

response_constraints:
  max_tokens: 2000
  temperature: 0.6

tools:
  exclude:
    - "code_execution"
    - "direct_file_edits"
```

```yaml
# ~/.deepcode/modes/one-shot.yml
name: "one-shot"
description: "Complete task in single response"

system_prompt_modifier: |
  Mode: ONE-SHOT
  - Provide complete solution in one response
  - Don't ask follow-up questions
  - Make reasonable assumptions
  - Include all necessary code and explanations
  - Prioritize completeness

response_constraints:
  max_tokens: 8000
  temperature: 0.5
  stream: false  # Return complete response
```

### 5. Mode Combinations

**Common Combinations:**

```yaml
# Interactive coding assistance
modes: ["interactive", "editing"]

# Quick bug fix
modes: ["quick-fix", "one-shot"]

# Thorough code review with planning
modes: ["planning", "one-shot", "review"]

# Educational session
modes: ["explain", "interactive"]

# Autonomous agent task
modes: ["planning", "editing", "agent-mode"]
```

### 6. Implementation Plan

#### Phase 1: Configuration Infrastructure
- [ ] Create `ConfigurationManager` service
- [ ] Implement YAML parser (using `js-yaml`)
- [ ] Create default configuration files
- [ ] Add configuration validation

#### Phase 2: Context System
- [ ] Implement `ContextManager`
- [ ] Load context definitions
- [ ] Apply context-specific system prompts
- [ ] Enable/disable tools per context

#### Phase 3: Mode System
- [ ] Implement `ModeManager`
- [ ] Support multiple active modes
- [ ] Apply mode-specific prompt modifiers
- [ ] Add `switch_modes` tool for dynamic switching

#### Phase 4: Integration
- [ ] Update `UnifiedAIService` to use configs
- [ ] Add UI controls for context/mode selection
- [ ] Create settings panel for config editing
- [ ] Add project initialization wizard

#### Phase 5: Advanced Features
- [ ] Hot-reload configuration changes
- [ ] Configuration profiles (save/load)
- [ ] Cloud sync for config (optional)
- [ ] AI-assisted config generation

## API Design

### TypeScript Interfaces

```typescript
// Configuration types
interface DeepCodeConfig {
  version: string;
  ai: AIConfig;
  default_context: string;
  default_modes: string[];
  tools: ToolConfig;
  agents: AgentConfig;
  ui: UIConfig;
}

interface Context {
  name: string;
  description: string;
  system_prompt: string;
  tools: {
    enabled: string[];
    disabled: string[];
  };
  ui?: Partial<UIConfig>;
}

interface Mode {
  name: string;
  description: string;
  system_prompt_modifier: string;
  response_constraints?: {
    max_tokens?: number;
    temperature?: number;
    stream?: boolean;
  };
  tools?: {
    exclude?: string[];
  };
}

// Manager classes
class ConfigurationManager {
  loadGlobalConfig(): Promise<DeepCodeConfig>
  loadProjectConfig(projectPath: string): Promise<Partial<DeepCodeConfig>>
  saveGlobalConfig(config: DeepCodeConfig): Promise<void>
  saveProjectConfig(projectPath: string, config: Partial<DeepCodeConfig>): Promise<void>
  getEffectiveConfig(projectPath?: string): Promise<DeepCodeConfig>
}

class ContextManager {
  loadContext(name: string): Promise<Context>
  listContexts(): string[]
  getCurrentContext(): Context
  switchContext(name: string): Promise<void>
  createCustomContext(context: Context): Promise<void>
}

class ModeManager {
  loadMode(name: string): Promise<Mode>
  listModes(): string[]
  getActiveModes(): Mode[]
  setModes(modes: string[]): Promise<void>
  addMode(mode: string): Promise<void>
  removeMode(mode: string): Promise<void>
}
```

### Usage Examples

```typescript
// Initialize with context and modes
const config = await configManager.getEffectiveConfig('/path/to/project');
const contextMgr = new ContextManager(config);
const modeMgr = new ModeManager(config);

// Set up IDE assistant context with interactive editing
await contextMgr.switchContext('ide-assistant');
await modeMgr.setModes(['interactive', 'editing']);

// AI service uses current context and modes
const aiService = new UnifiedAIService({
  context: contextMgr.getCurrentContext(),
  modes: modeMgr.getActiveModes(),
});

// User requests quick fix
await modeMgr.setModes(['quick-fix', 'one-shot']);
const response = await aiService.sendMessage(request);

// Dynamic mode switching via AI tool
aiService.registerTool({
  name: 'switch_modes',
  description: 'Switch to different interaction modes',
  execute: async (modes: string[]) => {
    await modeMgr.setModes(modes);
    return { success: true };
  },
});
```

## Benefits

1. **Flexibility**: Users can customize AI behavior per project
2. **Context-Aware**: AI adapts to different coding scenarios
3. **Dynamic Modes**: Switch interaction style during session
4. **Tool Management**: Enable/disable features per context
5. **Scalability**: Easy to add new contexts and modes
6. **Consistency**: YAML configs are version-controllable
7. **User Control**: Power users can fine-tune every aspect

## Migration Path

1. Keep existing API key and model selection UI
2. Add optional "Advanced Configuration" panel
3. Auto-generate project.yml on first use
4. Migrate existing settings to YAML format
5. Provide UI for common config changes
6. Allow direct YAML editing for power users

## Next Steps

1. Review and approve design
2. Create configuration file schema
3. Implement ConfigurationManager
4. Build Context/Mode managers
5. Update AI service integration
6. Create UI components
7. Write documentation
8. Add example configurations
