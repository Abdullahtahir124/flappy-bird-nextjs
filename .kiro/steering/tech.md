# Technology Stack

## Core Framework
- **Kiro Agent Framework**: Primary platform for AI agent development and orchestration
- **Model Context Protocol (MCP)**: Available for external integrations (currently disabled)

## Development Environment
- **Editor**: Visual Studio Code with Kiro Agent extension
- **Configuration**: JSON-based configuration files
- **Documentation**: Markdown-based steering documents

## Project Structure
- **Configuration-Driven**: No traditional build system or package management
- **Agent-Based**: Workflows defined through agent configurations and steering documents
- **Specification-Driven**: Uses structured specs for feature development

## Common Commands

### Kiro Agent Operations
```bash
# Agent operations are typically handled through the Kiro interface
# No traditional build/test commands as this is a configuration workspace
```

### File Management
```bash
# Create new steering documents
# Files should be placed in .kiro/steering/ directory

# Create new specifications
# Files should be placed in .kiro/specs/ directory
```

## Configuration Files
- `.vscode/settings.json`: VS Code editor configuration
- `.kiro/steering/*.md`: Steering documents for agent guidance
- `.kiro/specs/*/`: Specification directories for structured development

## Development Workflow
1. Create steering documents to guide agent behavior
2. Define specifications for structured development
3. Use Kiro agents to execute workflows and automation tasks
4. Iterate on configurations based on results