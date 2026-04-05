export async function callClaude({ system, prompt, maxTokens = 1000, useWebSearch = true }) {
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  };

  if (system) body.system = system;
  if (useWebSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];

  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json();

  // Collect ALL text blocks — the final one contains our JSON
  const textBlocks = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text);

  // Use the LAST text block — that's always the final JSON response
  const rawText = textBlocks[textBlocks.length - 1] || "";

  // Strip any markdown formatting
  const stripped = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Extract just the JSON object between first { and last }
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in response: " + stripped.substring(0, 200));

  return JSON.parse(stripped.slice(start, end + 1));
}
