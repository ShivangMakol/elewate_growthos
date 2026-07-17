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
        <span className="text-sm font-medium text-muted-foreground">apps/portal</span>
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Elewate GrowthOS — Client Portal</CardTitle>
          <CardDescription>Placeholder dashboard. No business logic yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This is the external client-facing portal shell (Architecture Blueprint §5), kept
            separate from apps/web so internal and external auth never share a session boundary. The
            real Client Portal module lands at Milestone M8 — see the Task List.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
