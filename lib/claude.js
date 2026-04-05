/**
 * callClaude — shared utility for all SwingDesk pages
 * Calls the /api/claude proxy route (keeps API key server-side)
 * Returns parsed JSON from Claude's response
 */
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
  const text = data.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");

  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}
