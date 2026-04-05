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

  // Only grab text blocks — ignore all tool_use and tool_result blocks
  const textBlocks = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text);

  // Always use the LAST text block — that's Claude's final JSON after web searches
  const rawText = textBlocks[textBlocks.length - 1] || "";

  // Strip markdown formatting
  const stripped = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Extract just the JSON object
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in response");

  return JSON.parse(stripped.slice(start, end + 1));
}
