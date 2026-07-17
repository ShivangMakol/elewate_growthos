import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  ThemeToggle,
} from "@elewate/ui-components";

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex w-full max-w-md items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">apps/web</span>
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Elewate GrowthOS — Web</CardTitle>
          <CardDescription>Placeholder dashboard. No business logic yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This is the tenant-facing app shell (Architecture Blueprint §5). Real modules (CRM,
            Leads, Pipeline, and the rest) land starting at Milestone M1 — see the Task List.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
