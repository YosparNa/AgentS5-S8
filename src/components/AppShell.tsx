import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { RailNav } from "@/components/RailNav";
import { StageDrawer } from "@/components/drawer/StageDrawer";
import { FileModal } from "@/components/modals/FileModal";
import { ViralModal } from "@/components/modals/ViralModal";
import { ArchModal } from "@/components/modals/ArchModal";
import { NewActionModal } from "@/components/modals/NewActionModal";
import { NewChannelModal } from "@/components/modals/NewChannelModal";
import { NewMissionModal } from "@/components/modals/NewMissionModal";
import { SourceModal } from "@/components/modals/SourceModal";
import { InsertStageModal } from "@/components/modals/InsertStageModal";
import { SedimentModal } from "@/components/modals/SedimentModal";

// 全局外壳。StageDrawer 与 Modal 在切片 D/F 挂载到此处(由 uiStore 控制)。
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col text-[13px] antialiased">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <RailNav />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
      <StageDrawer />
      <FileModal />
      <ViralModal />
      <ArchModal />
      <NewActionModal />
      <NewChannelModal />
      <NewMissionModal />
      <SourceModal />
      <InsertStageModal />
      <SedimentModal />
    </div>
  );
}
