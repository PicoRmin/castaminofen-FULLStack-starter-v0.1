# Routing Architecture

## App Router structure
- app/layout.tsx: root layout
- app/page.tsx: home page
- app/(public)/page.tsx: public landing or auth entry points
- app/(auth)/login/page.tsx: authentication routes
- app/(main)/feed/page.tsx: main feed experience
- app/(main)/podcast/[slug]/page.tsx: dynamic content detail routes
- app/(main)/creator/[id]/page.tsx: creator detail routes
- app/(main)/search/page.tsx: search experience
- app/(main)/library/page.tsx: library experience

## Routing principles
- route modules should be thin and delegate to feature-level containers
- business logic should live in features, processes, or services
- route-specific UI should remain small and compositional
