# 👨‍💻 Developer Guide - Flghtly

## 📚 **Documentation Standards**

**⚠️ IMPORTANT:** Before creating or updating documentation, read [docs/DOCUMENTATION_GUIDELINES.md](./docs/DOCUMENTATION_GUIDELINES.md)

### Quick Documentation Rules

✅ **DO:**
- Place docs in `/docs` subdirectories (not at root)
- Add frontmatter metadata to all docs
- Update `DOCUMENTATION_INDEX.md` for major docs
- Run `./scripts/check-docs.sh` before committing

❌ **DON'T:**
- Create docs at project root (except README, DEVELOPER_GUIDE, etc.)
- Duplicate existing documentation
- Leave placeholder text (TODO, FIXME)

**Complete guide:** [Documentation Guidelines](./docs/DOCUMENTATION_GUIDELINES.md)

---

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Setup
```bash
# Clone repository
git clone <repository-url>
cd flghtly

# Install dependencies
npm install

# Run development server
npm run dev
```

## 🔧 **Development Workflow**

### 1. **Before Starting Work**
```bash
# Check current status
npm run type-check
npm run lint
npm test
```

### 2. **During Development**
- Use your IDE with TypeScript and ESLint integration
- Run `npm run dev` for hot reloading
- Use `npm run test:watch` for continuous testing

### 3. **Before Committing**
```bash
# Run all checks
npm run lint
npm run type-check
npm test
npm run build
```

### 4. **Pre-commit Hooks**
Pre-commit hooks will automatically run:
- ESLint checks
- TypeScript compilation
- Test suite
- Build verification

## 📁 **Project Structure**

```
src/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── admin/          # Admin pages
│   └── ...
├── components/         # React components
│   ├── ui/            # Reusable UI components
│   └── ...
├── lib/               # Utility functions
│   ├── __tests__/     # Unit tests
│   └── ...
└── types/            # TypeScript type definitions
```

## 🧪 **Testing**

### Test Types
- **Unit Tests**: `src/lib/__tests__/`
- **Integration Tests**: `src/app/api/__tests__/`
- **E2E Tests**: `e2e/`

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

### Writing Tests
```typescript
// Example unit test
import { describe, it, expect } from 'vitest';
import { functionToTest } from '../function-to-test';

describe('Function Name', () => {
  it('should do something', () => {
    const result = functionToTest(input);
    expect(result).toBe(expected);
  });
});
```

## 🔍 **Code Quality**

### ESLint Rules
- **Errors**: Must be fixed before commit
- **Warnings**: Should be addressed
- **Auto-fix**: `npm run lint:fix`

### TypeScript
- **Strict mode**: Enabled
- **Type checking**: `npm run type-check`
- **No implicit any**: Use explicit types

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add proper error handling
- Include JSDoc comments for complex functions

## 🚨 **Common Issues & Solutions**

### 1. **ESLint Errors**
```bash
# Check specific file
npx eslint src/file.ts

# Fix auto-fixable issues
npm run lint:fix
```

### 2. **TypeScript Errors**
```bash
# Check types
npm run type-check

# Common fixes:
# - Add missing type annotations
# - Fix import paths
# - Update interface definitions
```

### 3. **Import Issues**
```typescript
// ✅ Correct
import { Component } from '@/components/Component';
import { utility } from './utility';

// ❌ Incorrect
import { Component } from '../components/Component';
```

### 4. **Test Failures**
```bash
# Run specific test
npm test -- test-name

# Debug test
npm test -- --reporter=verbose
```

## 📦 **Dependencies**

### Adding Dependencies
```bash
# Production dependency
npm install package-name

# Development dependency
npm install --save-dev package-name
```

### Updating Dependencies
```bash
# Check outdated packages
npm outdated

# Update packages
npm update
```

## 🔄 **Git Workflow**

### Branch Naming
- `feature/description`
- `bugfix/description`
- `hotfix/description`

### Commit Messages
```
type(scope): description

feat(auth): add user authentication
fix(api): resolve payment processing error
docs(readme): update installation instructions
```

### Pull Request Process
1. Create feature branch
2. Make changes
3. Run quality checks
4. Create pull request
5. Address review feedback
6. Merge after approval

## 🛠️ **Tools & Configuration**

### IDE Setup
- **VS Code**: Install TypeScript and ESLint extensions
- **WebStorm**: Enable TypeScript and ESLint integration
- **Vim/Neovim**: Use LSP for TypeScript support

### Environment Variables
```bash
# Copy example file
cp .env.example .env.local

# Required variables
NEXT_PUBLIC_APP_URL=
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
```

## 📚 **Resources**

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Vitest Testing](https://vitest.dev/)

### Internal Documentation
- [Code Quality Safeguards](docs/development/CODE_QUALITY_SAFEGUARDS.md)
- [API Routes](README.md#api-routes) - See README for API documentation
- Deployment Guide - Auto-deployed to Vercel on push to main

## 🆘 **Getting Help**

### Team Channels
- **Slack**: #flghtly-dev
- **Email**: dev-team@company.com

### Escalation Process
1. Check documentation
2. Search existing issues
3. Ask in team channel
4. Create issue if needed
5. Escalate to senior developer

---

**Last Updated**: December 2024  
**Version**: 1.0.0
