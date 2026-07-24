# Project Structure

## Directory Organization

```
Kiro/
├── .kiro/                    # Kiro framework configuration
│   ├── steering/             # Steering documents (workflow guides)
│   │   ├── product.md        # Product overview and purpose
│   │   ├── tech.md           # Technology stack and commands
│   │   └── structure.md      # Project organization (this file)
│   └── specs/                # Specification directories (when created)
│       └── {feature-name}/   # Individual feature specifications
│           ├── requirements.md
│           ├── design.md
│           └── tasks.md
└── .vscode/                  # VS Code configuration
    └── settings.json         # Editor settings
```

## File Conventions

### Steering Documents (`.kiro/steering/`)
- **Always included**: All steering documents are automatically included in agent context
- **Markdown format**: Use `.md` extension for all steering documents
- **Naming**: Use lowercase with hyphens for multi-word files
- **Purpose**: Guide agent behavior and provide project context

### Specifications (`.kiro/specs/`)
- **Feature-based**: Each feature gets its own directory
- **Kebab-case naming**: Use hyphens for feature directory names (e.g., `user-authentication`)
- **Required files**: Each spec must contain `requirements.md`, `design.md`, and `tasks.md`
- **Structured development**: Follow requirements → design → tasks workflow

### Configuration Files
- **JSON format**: Use for VS Code and Kiro configuration
- **Minimal configuration**: Keep settings focused and purposeful
- **Version control**: Include all configuration files in repository

## Best Practices

### File Organization
- Keep steering documents focused and concise
- Use descriptive names that clearly indicate purpose
- Maintain consistent formatting across all markdown files

### Documentation Standards
- Use clear headings and structure
- Include code examples where relevant
- Keep content up-to-date with project evolution

### Agent Workflow
- Create specifications before implementation
- Use steering documents to maintain consistency
- Follow structured development processes