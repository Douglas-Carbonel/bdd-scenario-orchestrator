import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { DashboardView } from "@/views/DashboardView";
import { CompaniesView } from "@/views/CompaniesView";
import { ScenariosView } from "@/views/ScenariosView";
import { SprintsView } from "@/views/SprintsView";
import { SettingsView } from "@/views/SettingsView";
import { AdminView } from "@/views/AdminView";
import { useBddStore } from "@/hooks/useBddStore";
import { cn } from "@/lib/utils";

const Index = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const {
    companies,
    products,
    sprints,
    scenarios,
    suites,
    teamMembers,
    testRuns,
    addCompany,
    updateCompany,
    deleteCompany,
    addProduct,
    updateProduct,
    deleteProduct,
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
    getDailyStats,
    getTeamMember,
    getScenarioRuns,
  } = useBddStore();

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <DashboardView
            companies={companies}
            sprints={sprints}
            scenarios={scenarios}
            teamMembers={teamMembers}
            getDailyStats={getDailyStats}
            getTeamMember={getTeamMember}
          />
        );
      case "companies":
        return (
          <CompaniesView
            companies={companies}
            products={products}
            scenarios={scenarios}
            sprints={sprints}
            onAddCompany={addCompany}
            onEditCompany={updateCompany}
            onDeleteCompany={deleteCompany}
            onAddProduct={addProduct}
            onEditProduct={updateProduct}
            onDeleteProduct={deleteProduct}
          />
        );
      case "scenarios":
        return (
          <ScenariosView
            companies={companies}
            products={products}
            sprints={sprints}
            scenarios={scenarios}
            suites={suites}
            teamMembers={teamMembers}
            onAddScenario={addScenario}
            onUpdateScenario={updateScenario}
            onAddSuite={addSuite}
            onUpdateSuite={updateSuite}
            onDeleteSuite={deleteSuite}
            onMoveSuite={moveSuite}
            getSuiteTree={getSuiteTree}
            getUnsortedScenarios={getUnsortedScenarios}
            getScenarioRuns={getScenarioRuns}
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
            products={products}
            sprints={sprints}
            scenarios={scenarios}
          />
        );
      case "admin":
        return <AdminView />;
      default:
        return (
          <DashboardView
            companies={companies}
            sprints={sprints}
            scenarios={scenarios}
            teamMembers={teamMembers}
            getDailyStats={getDailyStats}
            getTeamMember={getTeamMember}
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
