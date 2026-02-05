# Contributing to BERLIN HEIST

Thank you for your interest in contributing! This document provides guidelines and information for contributors.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/TreasureHunt.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit with clear messages: `git commit -m "Add: description of change"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## 📋 Development Setup

```bash
# Backend
cd Backend
npm install
cp .env.example .env  # Edit with your MongoDB URI
npm run setup:quick
npm run dev

# Frontend (in a new terminal)
cd Frontend
npm install
cp .env.example .env
npm run dev
```

## 🎯 Contribution Areas

### High Priority

- [ ] Unit tests for backend controllers
- [ ] E2E tests for game flow
- [ ] Accessibility improvements
- [ ] Performance optimizations

### Feature Ideas

- Real-time WebSocket updates for leaderboard
- Multi-language support
- Custom theme support
- Team chat functionality

### Documentation

- API usage examples
- Deployment guides for other platforms
- Video tutorials

## 📝 Code Style

- Use ESLint and Prettier (configs included)
- Follow existing code patterns
- Add JSDoc comments for functions
- Keep commits atomic and well-described

## 🐛 Reporting Bugs

Please include:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots (if UI-related)
5. Browser/Node version

## 💬 Questions?

Open a GitHub Issue with the `question` label.

---

**Maintainer**: [Prasad Bhalerao](https://www.linkedin.com/in/prasadbhalerao)
