import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardView } from "@/views/DashboardView";
import { CompaniesView } from "@/views/CompaniesView";
import { ScenariosView } from "@/views/ScenariosView";
import { SprintsView } from "@/views/SprintsView";
import { SettingsView } from "@/views/SettingsView";
import { useBddStore } from "@/hooks/useBddStore";
import { cn } from "@/lib/utils";

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const {
    companies,
    sprints,
    scenarios,
    suites,
    addCompany,
    updateCompany,
    deleteCompany,
    addSprint,
    addScenario,
    updateScenario,
    addSuite,
    updateSuite,
    deleteSuite,
    moveSuite,
    getSuiteTree,
    getUnsortedScenarios,
    getSprintStats,
  } = useBddStore();

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <DashboardView
            companies={companies}
            sprints={sprints}
            scenarios={scenarios}
          />
        );
      case "companies":
        return (
          <CompaniesView
            companies={companies}
            scenarios={scenarios}
            sprints={sprints}
            onAddCompany={addCompany}
            onEditCompany={updateCompany}
            onDeleteCompany={deleteCompany}
          />
        );
      case "scenarios":
        return (
          <ScenariosView
            companies={companies}
            sprints={sprints}
            scenarios={scenarios}
            suites={suites}
            onAddScenario={addScenario}
            onUpdateScenario={updateScenario}
            onAddSuite={addSuite}
            onUpdateSuite={updateSuite}
            onDeleteSuite={deleteSuite}
            onMoveSuite={moveSuite}
            getSuiteTree={getSuiteTree}
            getUnsortedScenarios={getUnsortedScenarios}
          />
        );
      case "sprints":
        return (
          <SprintsView
            companies={companies}
            sprints={sprints}
            scenarios={scenarios}
            onAddSprint={addSprint}
            getSprintStats={getSprintStats}
          />
        );
      case "settings":
        return (
          <SettingsView
            companies={companies}
            sprints={sprints}
            scenarios={scenarios}
          />
        );
      default:
        return (
          <DashboardView
            companies={companies}
            sprints={sprints}
            scenarios={scenarios}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className={cn("transition-all duration-300 ml-64 p-8")}>
        <div className="max-w-7xl mx-auto">{renderView()}</div>
      </main>
    </div>
  );
};

export default Index;
