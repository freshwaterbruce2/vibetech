---
allowed-tools: Write, Edit, Read, Glob
argument-hint: <component-name> [type:ui|feature|page]
description: Create a new React component with TypeScript and shadcn/ui
---

# Create React Component

Generate a new React component with TypeScript, proper structure, and shadcn/ui styling.

## Component Details:
- **Name**: $1
- **Type**: ${2:-feature}
- **Location**: src/components/${2:-feature}/$1.tsx

## Analysis Phase:

First, I'll examine existing components to match the project's patterns:

@src/components/ui/button.tsx
@src/components/Footer.tsx
@tailwind.config.ts

## Component Structure:

Based on the component type "${2:-feature}" and name "$1", I'll create:

### For UI Components (type=ui):
- Primitive component with forwardRef
- Variants using class-variance-authority
- Proper TypeScript interfaces
- Accessibility attributes

### For Feature Components (type=feature):
- Functional component with hooks
- Props interface
- Error boundaries if needed
- Integration with existing state management

### For Page Components (type=page):
- Route-ready component
- SEO metadata
- Loading states
- Error handling

## Implementation:

Creating component: $1

The component will follow these patterns:
1. TypeScript with strict typing
2. Tailwind CSS with cn() utility
3. Proper imports from shadcn/ui
4. React best practices (memoization where needed)
5. Consistent naming conventions

## Additional Files:

Depending on complexity, I may also create:
- ${1}.test.tsx - Component tests
- ${1}.stories.tsx - Storybook stories (if applicable)
- index.ts - Barrel export

## Post-Creation:

After creating the component, I'll:
1. Update relevant barrel exports
2. Suggest usage examples
3. Provide integration instructions
4. Run TypeScript check to ensure compatibility

$ARGUMENTS