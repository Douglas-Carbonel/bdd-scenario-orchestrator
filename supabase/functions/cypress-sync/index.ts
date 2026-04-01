import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateFeatureContent(scenario: any, companyName: string): string {
  const tags = (scenario.tags as string[]).map((tag: string) => `@${tag}`).join(" ");
  const given = (scenario.given_steps as string[]).map((step: string, i: number) =>
    `    ${i === 0 ? "Given" : "And"} ${step}`
  ).join("\n");
  const when = (scenario.when_steps as string[]).map((step: string, i: number) =>
    `    ${i === 0 ? "When" : "And"} ${step}`
  ).join("\n");
  const then = (scenario.then_steps as string[]).map((step: string, i: number) =>
    `    ${i === 0 ? "Then" : "And"} ${step}`
  ).join("\n");

  return `# Company: ${companyName}
# Status: ${scenario.status}

${tags}
Feature: ${scenario.feature}

  Scenario: ${scenario.title}
${given}
${when}
${then}
`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const apiKey = url.searchParams.get("api_key");

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "api_key query parameter is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate api_key and get company
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name")
      .eq("api_key", apiKey)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch scenarios for the company
    const { data: scenarios, error: scenariosError } = await supabase
      .from("scenarios")
      .select("*")
      .eq("company_id", company.id);

    if (scenariosError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch scenarios" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate feature files
    const features = (scenarios || []).map((scenario: any) => {
      const featureSlug = scenario.feature.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const titleSlug = scenario.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      return {
        id: scenario.id,
        path: `cypress/e2e/features/${featureSlug}/${titleSlug}.feature`,
        content: generateFeatureContent(scenario, company.name),
        feature: scenario.feature,
        title: scenario.title,
        status: scenario.status,
        priority: scenario.priority,
        tags: scenario.tags,
      };
    });

    return new Response(
      JSON.stringify({
        company: company.name,
        total: features.length,
        features,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
