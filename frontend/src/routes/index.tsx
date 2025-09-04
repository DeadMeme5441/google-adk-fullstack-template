import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center theme-bg-secondary">
      <div className="text-center">
        <h1 className="text-4xl font-bold theme-text-primary mb-4">
          Frontend Nuked Successfully 🚀
        </h1>
        <p className="theme-text-secondary">
          Components and routes have been cleared. Ready for fresh rebuild.
        </p>
      </div>
    </div>
  )
}