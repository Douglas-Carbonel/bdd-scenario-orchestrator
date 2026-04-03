import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestResult {
  scenario_id: string;
  status: "passed" | "failed";
  duration?: number;
  error_message?: string;
  executed_by?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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

    // Validate api_key — look up product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, name, company_id")
      .eq("api_key", apiKey)
      .single();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: company } = await supabase
      .from("companies")
      .select("name")
      .eq("id", product.company_id)
      .single();

    const body = await req.json();
    const results: TestResult[] = Array.isArray(body.results) ? body.results : [];

    if (results.length === 0) {
      return new Response(
        JSON.stringify({ error: "results array is required and must not be empty" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate scenario IDs belong to this product (also accept legacy scenarios with no product_id)
    const scenarioIds = results.map(r => r.scenario_id);
    const { data: validScenarios } = await supabase
      .from("scenarios")
      .select("id")
      .or(`product_id.eq.${product.id},and(product_id.is.null,company_id.eq.${product.company_id})`)
      .in("id", scenarioIds);

    const validIds = new Set((validScenarios || []).map((s: any) => s.id));
    const invalidIds = scenarioIds.filter(id => !validIds.has(id));

    if (invalidIds.length > 0) {
      return new Response(
        JSON.stringify({ error: `Invalid scenario IDs for this product: ${invalidIds.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date().toISOString();
    const testRuns = results.map(r => ({
      scenario_id: r.scenario_id,
      status: r.status,
      duration: r.duration || null,
      error_message: r.error_message || null,
      executed_by: r.executed_by || "cypress-ci",
      started_at: now,
      completed_at: now,
    }));

    const { data: insertedRuns, error: insertError } = await supabase
      .from("test_runs")
      .insert(testRuns)
      .select("id, scenario_id, status");

    if (insertError) {
      return new Response(
        JSON.stringify({ error: "Failed to insert test runs", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update scenario statuses
    for (const result of results) {
      await supabase
        .from("scenarios")
        .update({
          status: result.status,
          actual_duration: result.duration || null,
        })
        .eq("id", result.scenario_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        company: company?.name ?? "Unknown",
        product: product.name,
        processed: insertedRuns?.length || 0,
        results: insertedRuns,
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
