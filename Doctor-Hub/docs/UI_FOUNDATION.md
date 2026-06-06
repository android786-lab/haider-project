# UI foundation (Phase 0b)

## Design tokens

- **Font:** Inter
- **Primary:** Teal healthcare (`hsl(173 58% 39%)`)
- **Semantic:** `success`, `warning`, `destructive` for workflow states

## Component locations

| Path | Purpose |
|------|---------|
| `src/components/ui/` | shadcn-style primitives (Button, Card, Input, Sheet, …) |
| `src/components/shared/` | Doctor Hub composites (Stepper, StatusBadge, PaymentUploadZone, …) |
| `src/components/layout/` | PatientLayout / DashboardLayout shells |

## Patient app

- **Layout:** `PatientLayout` + `PatientNavbar` (sticky header, mobile Sheet menu)
- **Preview:** http://localhost:5173/ui-preview

## Staff dashboard (`admin/`)

- **Layout:** `DashboardLayout` + collapsible sidebar + header
- Same `ui/` and `shared/` copies under `admin/src/`

## Usage in new pages

```jsx
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
```

## Appointment stepper

`AppointmentStepper` — `currentStep` 1–6 per documentation workflow.

Legacy CareLink pages still use some old Tailwind classes until migrated phase by phase.
