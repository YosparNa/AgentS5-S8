import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";

// Route-level code splitting (G2): each view is its own chunk so the initial
// bundle stays small. Lazy + Suspense keeps the main entry well under the
// 500 kB Vite warning threshold.
const HomeView = lazy(() => import("@/views/HomeView").then((m) => ({ default: m.HomeView })));
const ChannelsView = lazy(() => import("@/views/ChannelsView").then((m) => ({ default: m.ChannelsView })));
const ChannelDetailView = lazy(() => import("@/views/ChannelDetailView").then((m) => ({ default: m.ChannelDetailView })));
const MissionsView = lazy(() => import("@/views/MissionsView").then((m) => ({ default: m.MissionsView })));
const IdeasView = lazy(() => import("@/views/IdeasView").then((m) => ({ default: m.IdeasView })));
const KnowledgeView = lazy(() => import("@/views/KnowledgeView").then((m) => ({ default: m.KnowledgeView })));
const AnalyticsView = lazy(() => import("@/views/AnalyticsView").then((m) => ({ default: m.AnalyticsView })));
const WorkbenchView = lazy(() => import("@/views/WorkbenchView").then((m) => ({ default: m.WorkbenchView })));
const ViralView = lazy(() => import("@/views/ViralView").then((m) => ({ default: m.ViralView })));

function RouteFallback() {
  return (
    <div className="h-full grid place-items-center text-[12px] text-gray-400">
      加载中…
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <AppShell>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/channels" element={<ChannelsView />} />
          <Route path="/channel/:id" element={<ChannelDetailView />} />
          <Route path="/missions" element={<MissionsView />} />
          <Route path="/ideas" element={<IdeasView />} />
          <Route path="/knowledge" element={<KnowledgeView />} />
          <Route path="/analytics" element={<AnalyticsView />} />
          <Route path="/workbench/:wfId?" element={<WorkbenchView />} />
            <Route path="/viral" element={<ViralView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </AuthGate>
  );
}
