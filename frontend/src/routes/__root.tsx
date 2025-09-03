import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanstackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import Header from '../components/Header'
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
                  // Get stored theme from localStorage
                  const storedTheme = localStorage.getItem('theme');
                  
                  // Get system preference
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  // Determine theme: stored > system > light default
                  let theme = 'light';
                  if (storedTheme === 'dark' || storedTheme === 'light') {
                    theme = storedTheme;
                  } else if (systemPrefersDark) {
                    theme = 'dark';
                  }
                  
                  // Apply theme class to html element immediately
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                  
                  // Set color-scheme for better browser defaults
                  document.documentElement.style.colorScheme = theme;
                  
                } catch (e) {
                  // Fallback to light theme on any error
                  document.documentElement.classList.add('light');
                  document.documentElement.classList.remove('dark');
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
                <Header />
                <main className="flex-1 min-h-0">
                  {children}
                </main>
              </div>
            </AuthProvider>
          </ThemeProvider>
          
          {/* Development tools - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <>
              <ReactQueryDevtools initialIsOpen={false} />
              <TanstackDevtools
                config={{
                  position: 'bottom-left',
                }}
                plugins={[
                  {
                    name: 'Tanstack Router',
                    render: <TanStackRouterDevtoolsPanel />,
                  },
                ]}
              />
            </>
          )}
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}