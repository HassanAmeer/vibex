# VibeAll Extension - Code Structure & Architecture

## 📁 Project Structure

```
vibex/
├── src/
│   ├── api/                    # API clients for AI providers
│   │   ├── base/              # Base classes and interfaces
│   │   ├── providers/         # Individual provider implementations
│   │   └── index.ts           # API exports
│   ├── core/                  # Core business logic
│   │   ├── analysis/          # Code analysis engine
│   │   ├── generation/        # Code generation logic
│   │   ├── templates/         # Project templates
│   │   └── validation/        # Input validation
│   ├── managers/              # State and resource managers
│   │   ├── StorageManager.ts
│   │   ├── ContextManager.ts
│   │   └── FileSystemManager.ts
│   ├── services/              # Business services
│   │   ├── AnalysisService.ts
│   │   ├── GenerationService.ts
│   │   └── TemplateService.ts
│   ├── utils/                 # Utility functions
│   │   ├── logger/           # Logging utilities
│   │   ├── parsers/          # Code parsers
│   │   └── helpers/          # Helper functions
│   ├── types/                 # TypeScript type definitions
│   │   ├── api.types.ts
│   │   ├── core.types.ts
│   │   └── index.ts
│   ├── constants/             # Application constants
│   │   ├── models.ts
│   │   ├── config.ts
│   │   └── theme.ts
│   ├── webview/               # React UI components
│   │   ├── components/       # Reusable components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── contexts/         # React contexts
│   │   ├── styles/           # CSS modules
│   │   └── App.tsx           # Main app component
│   └── extension.ts           # Extension entry point
├── tests/                     # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/                      # Documentation
├── media/                     # Assets
└── dist/                      # Build output
```

## 🏗️ Architecture Principles

### 1. **Separation of Concerns**
- **API Layer**: Handles external communication
- **Core Layer**: Business logic and domain models
- **Service Layer**: Orchestrates core functionality
- **UI Layer**: Presentation and user interaction

### 2. **Dependency Injection**
- Services receive dependencies via constructor
- Easy to test and mock
- Loose coupling between modules

### 3. **Single Responsibility**
- Each class/module has one clear purpose
- Easy to understand and maintain
- Promotes reusability

### 4. **Interface-Based Design**
- Program to interfaces, not implementations
- Easy to swap implementations
- Better testability

### 5. **Error Handling**
- Centralized error handling
- Custom error types
- Graceful degradation

## 📋 Coding Standards

### Naming Conventions
- **Classes**: PascalCase (e.g., `CodeAnalyzer`)
- **Interfaces**: PascalCase with 'I' prefix (e.g., `IAnalysisResult`)
- **Functions**: camelCase (e.g., `analyzeCode`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_FILE_SIZE`)
- **Private members**: Prefix with underscore (e.g., `_cache`)

### File Organization
- One class/interface per file
- File name matches class name
- Index files for exports
- Group related files in folders

### Documentation
- JSDoc comments for all public APIs
- Inline comments for complex logic
- README in each major directory
- Architecture diagrams where helpful

### Testing
- Unit tests for all business logic
- Integration tests for services
- E2E tests for critical workflows
- Minimum 80% code coverage

## 🔄 Data Flow

```
User Input → UI Component → Service → Core Logic → API/Manager → Response
                ↓                                        ↓
            State Update ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

## 🎯 Module Responsibilities

### API Layer (`src/api/`)
- **Purpose**: Communication with external AI services
- **Responsibilities**:
  - HTTP request handling
  - Response parsing
  - Error handling
  - Rate limiting
  - Authentication

### Core Layer (`src/core/`)
- **Purpose**: Business logic and domain models
- **Responsibilities**:
  - Code analysis algorithms
  - Template generation
  - Validation rules
  - Domain models

### Service Layer (`src/services/`)
- **Purpose**: Orchestrate core functionality
- **Responsibilities**:
  - Coordinate between layers
  - Transaction management
  - Caching
  - Event emission

### Manager Layer (`src/managers/`)
- **Purpose**: Resource and state management
- **Responsibilities**:
  - File system operations
  - Storage management
  - Context management
  - Lifecycle management

### UI Layer (`src/webview/`)
- **Purpose**: User interface
- **Responsibilities**:
  - Rendering
  - User interaction
  - State management
  - Event handling

## 🔐 Security Guidelines

### Input Validation
- Validate all user inputs
- Sanitize file paths
- Escape special characters
- Prevent injection attacks

### API Key Management
- Never log API keys
- Use VS Code secret storage
- Encrypt at rest
- Clear from memory after use

### File Operations
- Restrict to workspace
- Validate file paths
- Check permissions
- Sandbox dangerous operations

## 📊 Performance Guidelines

### Optimization Strategies
- Lazy loading for large modules
- Caching frequently used data
- Debouncing user inputs
- Virtual scrolling for lists
- Code splitting for UI

### Memory Management
- Dispose resources properly
- Clear event listeners
- Avoid memory leaks
- Monitor memory usage

## 🧪 Testing Strategy

### Unit Tests
```typescript
describe('CodeAnalyzer', () => {
  it('should detect security issues', () => {
    const code = 'eval(userInput)';
    const issues = CodeAnalyzer.detectSecurityIssues(code);
    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('code-injection');
  });
});
```

### Integration Tests
```typescript
describe('AnalysisService', () => {
  it('should analyze and store results', async () => {
    const service = new AnalysisService();
    const result = await service.analyzeFile('test.ts');
    expect(result.metrics).toBeDefined();
  });
});
```

## 📝 Git Workflow

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Urgent fixes

### Commit Messages
```
type(scope): subject

body

footer
```

Types: feat, fix, docs, style, refactor, test, chore

### Code Review Checklist
- [ ] Code follows style guide
- [ ] Tests are included
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Error handling implemented
- [ ] Performance considered

## 🚀 Deployment Process

1. **Build**: `npm run package`
2. **Test**: `npm test`
3. **Lint**: `npm run lint`
4. **Package**: `npx vsce package`
5. **Publish**: `npx vsce publish`

## 📚 Additional Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Testing Best Practices](https://testingjavascript.com/)
