import { Scenario, Company, Sprint } from "@/types/bdd";

export function generateFeatureFile(scenario: Scenario, companyName?: string, sprintName?: string): string {
  const tags = scenario.tags.map(tag => `@${tag}`).join(" ");
  const metadata = [
    companyName && `# Company: ${companyName}`,
    sprintName && `# Sprint: ${sprintName}`,
    `# Estimated Duration: ${scenario.estimatedDuration} min`,
    `# Status: ${scenario.status}`,
  ].filter(Boolean).join("\n");

  const givenSteps = scenario.given.map((step, i) => 
    `    ${i === 0 ? "Given" : "And"} ${step}`
  ).join("\n");

  const whenSteps = scenario.when.map((step, i) => 
    `    ${i === 0 ? "When" : "And"} ${step}`
  ).join("\n");

  const thenSteps = scenario.then.map((step, i) => 
    `    ${i === 0 ? "Then" : "And"} ${step}`
  ).join("\n");

  return `${metadata}

${tags}
Feature: ${scenario.feature}

  Scenario: ${scenario.title}
${givenSteps}
${whenSteps}
${thenSteps}
`;
}

export function generateStepDefinitions(scenarios: Scenario[]): string {
  const allSteps = new Set<string>();
  
  scenarios.forEach(scenario => {
    scenario.given.forEach(step => allSteps.add(`Given("${step}", () => {\n  // TODO: Implement step\n});`));
    scenario.when.forEach(step => allSteps.add(`When("${step}", () => {\n  // TODO: Implement step\n});`));
    scenario.then.forEach(step => allSteps.add(`Then("${step}", () => {\n  // TODO: Implement step\n});`));
  });

  return `import { Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";

// Step Definitions generated from BDD Hub
// Date: ${new Date().toISOString().split('T')[0]}

${Array.from(allSteps).join("\n\n")}
`;
}

export function generateCypressConfig(): string {
  return `// cypress.config.ts
import { defineConfig } from "cypress";
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import { createEsbuildPlugin } from "@badeball/cypress-cucumber-preprocessor/esbuild";

export default defineConfig({
  e2e: {
    specPattern: "cypress/e2e/**/*.feature",
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);

      on(
        "file:preprocessor",
        createBundler({
          plugins: [createEsbuildPlugin(config)],
        })
      );

      return config;
    },
  },
});
`;
}

export function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadAllAsZip(
  scenarios: Scenario[],
  companies: Company[],
  sprints: Sprint[]
) {
  // For now, we'll download individual files
  // In a real implementation, we'd use a library like JSZip
  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name;
  const getSprintName = (id: string) => sprints.find(s => s.id === id)?.name;

  scenarios.forEach(scenario => {
    const content = generateFeatureFile(
      scenario,
      getCompanyName(scenario.companyId),
      scenario.sprintId ? getSprintName(scenario.sprintId) : undefined
    );
    const filename = `${scenario.feature.toLowerCase().replace(/\s+/g, "-")}-${scenario.title.toLowerCase().replace(/\s+/g, "-")}.feature`;
    downloadFile(content, filename);
  });
}
