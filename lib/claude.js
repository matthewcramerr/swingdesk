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

  // Strip ALL markdown formatting before parsing
  const clean = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  // Find the first { and last } to extract just the JSON object
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in response");
  
  return JSON.parse(clean.slice(start, end + 1));
}
