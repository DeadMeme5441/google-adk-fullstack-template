import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '../lib/auth'
import { ThemeProvider } from '../hooks/useTheme'

import appCss from '../styles.css?url'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
    },
  },
})

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Agent Template Frontend',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize theme immediately to prevent flash of wrong theme
              (function() {
                try {
                  // Default to light theme for SSR compatibility
                  let theme = 'light';
                  
                  // Only access localStorage and system preferences on client
                  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
                    const storedTheme = localStorage.getItem('theme');
                    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    
                    // Determine theme: stored > system > light default
                    if (storedTheme === 'dark' || storedTheme === 'light') {
                      theme = storedTheme;
                    } else if (systemPrefersDark) {
                      theme = 'dark';
                    }
                  }
                  
                  // Apply theme class to html element
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                  
                  // Set color-scheme for better browser defaults
                  document.documentElement.style.colorScheme = theme;
                  
                } catch (e) {
                  // Fallback to light theme on any error
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add('light');
                  document.documentElement.style.colorScheme = 'light';
                }
              })();
            `,
          }}
        />
      </head>
      <body className="h-full theme-bg-primary theme-text-primary antialiased">
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <div className="h-full flex flex-col">
                <main className="flex-1 min-h-0">
                  {children}
                </main>
              </div>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}