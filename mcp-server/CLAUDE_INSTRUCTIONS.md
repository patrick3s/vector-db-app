# Instructions for Using Vector DB & Memory MCP

You have access to a powerful MCP server with advanced memory and screen generation capabilities.

## Core Principle: Be Proactive

Always detect and store valuable information automatically. Don't wait for users to ask.

## Available Tools

### Memory Tools (Use These First!)
- `memory_store_candidate` - Store user preferences, decisions, tasks, facts
- `memory_search` - Search memories with auto-rewriting and TTL filtering  
- `memory_rerank` - LLM-powered relevance ranking
- `memory_pack` - Format memories with citations
- `memory_rewrite_query` - Expand queries and extract filters

### Screen Generation
- `generate_screen_prompt` - Generate optimized prompts for creating UIs (uses stored preferences!)

### Basic Vector Tools
- `add_vector`, `search_vectors`, `list_all_vectors`, `delete_vector`

## When to Store Memories (Auto-detect!)

✅ **ALWAYS STORE:**
- User preferences: "I prefer...", "I like...", "I always use..."
- Decisions: "Let's use...", "We decided...", "Going with..."
- Tasks: "I need to...", "TODO:", "Remember to..."
- Important facts: "The API uses...", "The database is...", "Port is..."

❌ **NEVER STORE:**
- Greetings, thanks, small talk
- Questions (unless they reveal preference)
- Temporary/irrelevant chat

## Standard Workflows

### 1. Storing (Automatic!)

When user says something important:
```javascript
memory_store_candidate({
  user_id: "patrick",  // Get from session
  session_id: "current_session_id",
  text: "exact user quote",
  source: "chat",
  timestamp: "ISO 8601"  // Optional, defaults to now
})
```

The LLM will:
- Filter smalltalk (won't store)
- Classify type (preference/decision/task/fact/note)
- Assign importance (0-3)
- Set TTL (0 = permanent, or days)
- Handle deduplication

### 2. Searching (Use Full Pipeline!)

When user asks about past context:
```javascript
// Step 1: Rewrite query (auto-detects filters)
memory_rewrite_query({
  user_id: "patrick",
  query: "user's question",
  k: 5
})

// Step 2: Search with variants
memory_search({
  user_id: "patrick",
  query: "user's question",
  // filters: auto from rewrite_query or manual
  k: 5
})

// Step 3: Rerank by relevance
memory_rerank({
  query: "user's question",
  candidates: [results from search],
  top_n: 3
})

// Step 4: Pack for context
memory_pack({
  query: "user's question",
  selected: [results from rerank],
  max_tokens_hint: 500
})

// Step 5: Answer with citations
// "Based on your preferences [mem:abc123], ..."
```

### 3. Generating Screens (Always Use Memories!)

When user wants to create UI:
```javascript
generate_screen_prompt({
  user_id: "patrick",
  screen_description: "what user wants",
  tech_stack: "React + TypeScript + TailwindCSS",
  style_preferences: "minimalist, dark mode",
  include_user_memories: true  // ALWAYS TRUE!
})

// Returns structured prompt with:
// - full_prompt: Complete optimized prompt ready to use
// - design_guidelines, components_needed, etc.

// Use the full_prompt to generate the actual code
```

## Rules of Engagement

1. **Store First, Ask Later**: If user mentions preference/decision, store it IMMEDIATELY
2. **Always Use Pipeline**: Don't skip rewrite → search → rerank → pack
3. **Always Cite Sources**: When using memories, cite them: `[mem:abc123]`
4. **User-scoped**: Always use correct user_id for context separation
5. **Screen Generation**: ALWAYS include_user_memories=true

## Example Session

```
User: "I prefer dark mode in all my apps"

You (internally):
✅ memory_store_candidate({...}) 
   → Detected preference, stored automatically

You: "Noted! I'll remember you prefer dark mode. Stored in memory."

---

User: "Create a login screen"

You (internally):
1. ✅ memory_search("UI preferences") → Find dark mode preference
2. ✅ generate_screen_prompt({
     screen_description: "login screen",
     include_user_memories: true
   })
   → Generates prompt WITH dark mode preference
3. Use full_prompt to generate code

You: "Creating a login screen with dark mode [mem:xyz], 
as you prefer. Here's the code..."
```

## Quality Checks

Before responding, verify:
- [ ] Did I store any preferences/decisions mentioned?
- [ ] Did I use memory pipeline if user asked about past?
- [ ] Did I cite memories used? (mem:id format)
- [ ] Did I use generate_screen_prompt with memories for UI?
- [ ] Did I use correct user_id?

## Success Metrics

You're using MCP well if:
- 5-10 memories stored per work session
- 100% of memory-based answers cite sources
- All UIs generated consider user preferences
- Context maintained across sessions

## Quick Reference Card

| User says | Your action |
|-----------|-------------|
| "I prefer X" | `memory_store_candidate` (preference) |
| "We decided Y" | `memory_store_candidate` (decision) |
| "I need to Z" | `memory_store_candidate` (task) |
| "What are my preferences?" | Full pipeline: rewrite → search → rerank → pack |
| "Create a screen" | `generate_screen_prompt` with memories=true |
| Start of session | Search for relevant context first |

Remember: The system gets smarter with every stored memory. Be proactive!
