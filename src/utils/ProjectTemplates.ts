import * as vscode from 'vscode';
import * as path from 'path';

export class ProjectTemplates {
    private static templates: Map<string, ProjectTemplate> = new Map([
        ['react-app', {
            name: 'React Application',
            description: 'Modern React app with TypeScript',
            files: [
                { path: 'package.json', content: ProjectTemplates.getReactPackageJson },
                { path: 'tsconfig.json', content: ProjectTemplates.getTsConfig },
                { path: 'src/App.tsx', content: ProjectTemplates.getReactApp },
                { path: 'src/index.tsx', content: ProjectTemplates.getReactIndex },
                { path: 'src/index.css', content: ProjectTemplates.getBasicCSS },
                { path: 'public/index.html', content: ProjectTemplates.getIndexHTML },
                { path: '.gitignore', content: ProjectTemplates.getGitignore }
            ]
        }],
        ['node-api', {
            name: 'Node.js API',
            description: 'Express.js REST API with TypeScript',
            files: [
                { path: 'package.json', content: ProjectTemplates.getNodePackageJson },
                { path: 'tsconfig.json', content: ProjectTemplates.getTsConfig },
                { path: 'src/index.ts', content: ProjectTemplates.getExpressServer },
                { path: 'src/routes/index.ts', content: ProjectTemplates.getExpressRoutes },
                { path: '.env.example', content: ProjectTemplates.getEnvExample },
                { path: '.gitignore', content: ProjectTemplates.getGitignore }
            ]
        }],
        ['html-starter', {
            name: 'HTML/CSS/JS Starter',
            description: 'Simple static website',
            files: [
                { path: 'index.html', content: ProjectTemplates.getStaticHTML },
                { path: 'style.css', content: ProjectTemplates.getBasicCSS },
                { path: 'script.js', content: ProjectTemplates.getBasicJS }
            ]
        }]
    ]);

    static getTemplate(name: string): ProjectTemplate | undefined {
        return this.templates.get(name);
    }

    static getAllTemplates(): ProjectTemplate[] {
        return Array.from(this.templates.values());
    }

    // Template content generators
    private static getReactPackageJson(): string {
        return JSON.stringify({
            name: 'react-app',
            version: '0.1.0',
            private: true,
            dependencies: {
                'react': '^18.2.0',
                'react-dom': '^18.2.0'
            },
            devDependencies: {
                '@types/react': '^18.2.0',
                '@types/react-dom': '^18.2.0',
                'typescript': '^5.0.0',
                'vite': '^5.0.0',
                '@vitejs/plugin-react': '^4.0.0'
            },
            scripts: {
                'dev': 'vite',
                'build': 'tsc && vite build',
                'preview': 'vite preview'
            }
        }, null, 2);
    }

    private static getNodePackageJson(): string {
        return JSON.stringify({
            name: 'node-api',
            version: '1.0.0',
            main: 'dist/index.js',
            scripts: {
                'dev': 'ts-node-dev src/index.ts',
                'build': 'tsc',
                'start': 'node dist/index.js'
            },
            dependencies: {
                'express': '^4.18.0',
                'dotenv': '^16.0.0'
            },
            devDependencies: {
                '@types/express': '^4.17.0',
                '@types/node': '^20.0.0',
                'typescript': '^5.0.0',
                'ts-node-dev': '^2.0.0'
            }
        }, null, 2);
    }

    private static getTsConfig(): string {
        return JSON.stringify({
            compilerOptions: {
                target: 'ES2020',
                module: 'commonjs',
                lib: ['ES2020'],
                outDir: './dist',
                rootDir: './src',
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true,
                forceConsistentCasingInFileNames: true,
                resolveJsonModule: true
            },
            include: ['src/**/*'],
            exclude: ['node_modules']
        }, null, 2);
    }

    private static getReactApp(): string {
        return `import React, { useState } from 'react';
import './index.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>Welcome to React</h1>
      <div className="card">
        <button onClick={() => setCount(count + 1)}>
          Count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;
`;
    }

    private static getReactIndex(): string {
        return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
    }

    private static getExpressServer(): string {
        return `import express from 'express';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;
    }

    private static getExpressRoutes(): string {
        return `import { Router } from 'express';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

export default router;
`;
    }

    private static getIndexHTML(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>React App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/index.tsx"></script>
</body>
</html>
`;
    }

    private static getStaticHTML(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <header>
        <h1>Welcome</h1>
    </header>
    <main>
        <p>Your content here</p>
    </main>
    <script src="script.js"></script>
</body>
</html>
`;
    }

    private static getBasicCSS(): string {
        return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f4f4f4;
}

.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

button {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

button:hover {
  background: #0056b3;
}
`;
    }

    private static getBasicJS(): string {
        return `// Your JavaScript code here
console.log('App initialized');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');
});
`;
    }

    private static getEnvExample(): string {
        return `PORT=3000
NODE_ENV=development
# Add your environment variables here
`;
    }

    private static getGitignore(): string {
        return `node_modules/
dist/
build/
.env
.DS_Store
*.log
coverage/
.vscode/
.idea/
`;
    }
}

export interface ProjectTemplate {
    name: string;
    description: string;
    files: TemplateFile[];
}

export interface TemplateFile {
    path: string;
    content: () => string;
}
