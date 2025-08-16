import { http, HttpResponse } from 'msw'

// Mock API Endpoints für Tests
export const handlers = [
  // Mock für next-intl messages
  http.get('/api/messages/:locale', ({ params }) => {
    const { locale } = params
    return HttpResponse.json({
      home: {
        title: 'Empatify',
        subtitle: 'Modern design system with Tailwind CSS 4',
        getStarted: 'Get Started',
        viewDocumentation: 'View Documentation',
        builtWith: 'Built with modern technologies',
        features: {
          fastDevelopment: {
            title: 'Fast Development',
            description: 'Build quickly with modern tools'
          },
          beautifulUI: {
            title: 'Beautiful UI',
            description: 'Stunning components with design tokens'
          },
          typeSafe: {
            title: 'Type Safe',
            description: 'Full TypeScript support'
          }
        },
        stats: {
          nextjsVersion: 'Next.js Version',
          reactVersion: 'React Version',
          tailwindVersion: 'Tailwind Version',
          typescript: 'TypeScript'
        },
        techStack: {
          title: 'Tech Stack',
          description: 'Modern technologies we use'
        },
        footer: {
          builtWith: 'Built with ❤️',
          readyToBuild: 'Ready to build something amazing?',
          editFile: 'src/app/page.tsx'
        }
      }
    })
  }),

  // Mock für Design Tokens API (falls benötigt)
  http.get('/api/tokens', () => {
    return HttpResponse.json({
      colors: {
        primary: {
          500: '#FF6B00',
          600: '#E65F00'
        },
        neutral: {
          50: '#0F0F0F',
          100: '#1A1A1A',
          900: '#FFFFFF'
        }
      }
    })
  }),

  // Mock für User API
  http.get('/api/user', () => {
    return HttpResponse.json({
      id: '1',
      name: 'Test User',
      email: 'test@example.com'
    })
  }),

  // Mock für Error Cases
  http.get('/api/error', () => {
    return new HttpResponse(null, { status: 500 })
  })
]
