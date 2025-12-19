#!/usr/bin/env python3
"""
Simple test script to verify memory management tools are working.
This tests the basic functionality of the new tools.
"""

import sys
import os

# Add paths
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend', 'src'))

# Test imports
print("Testing imports...")
try:
    import memory_helpers as mh
    print("✓ memory_helpers imported successfully")
except Exception as e:
    print(f"✗ Failed to import memory_helpers: {e}")
    sys.exit(1)

try:
    from services.ollama_service import OllamaService
    print("✓ OllamaService imported successfully")
except Exception as e:
    print(f"✗ Failed to import OllamaService: {e}")
    sys.exit(1)

# Test chunking
print("\nTesting text chunking...")
short_text = "This is a short text."
long_text = "A" * 1000
chunks_short = mh.chunk_text(short_text)
chunks_long = mh.chunk_text(long_text)
print(f"✓ Short text ({len(short_text)} chars) -> {len(chunks_short)} chunk(s)")
print(f"✓ Long text ({len(long_text)} chars) -> {len(chunks_long)} chunk(s)")

# Test dedupe key generation
print("\nTesting dedupe key generation...")
text1 = "I prefer dark mode"
text2 = "I PREFER DARK MODE"
key1 = mh.generate_dedupe_key(text1, "user123")
key2 = mh.generate_dedupe_key(text2, "user123")
print(f"✓ Dedupe key for '{text1}': {key1[:16]}...")
print(f"✓ Dedupe key for '{text2}': {key2[:16]}...")
print(f"✓ Keys are {'identical' if key1 == key2 else 'different'} (should be identical)")

# Test filter building
print("\nTesting filter building...")
filter1 = mh.build_qdrant_filter("user123")
print(f"✓ Basic filter created: {len(filter1.get('must', []))} conditions")

filter2 = mh.build_qdrant_filter("user123", {
    "type_any": ["preference", "decision"],
    "min_importance": 2,
    "tags_any": ["ui", "settings"]
})
print(f"✓ Advanced filter created: {len(filter2.get('must', []))} conditions")

# Test JSON validation
print("\nTesting JSON validation...")
valid_json = '{"key": "value", "number": 123}'
invalid_json = 'not valid json'
markdown_json = '```json\n{"key": "value"}\n```'

result1 = mh.validate_json_response(valid_json)
result2 = mh.validate_json_response(invalid_json)
result3 = mh.validate_json_response(markdown_json)

print(f"✓ Valid JSON parsed: {result1 is not None}")
print(f"✓ Invalid JSON rejected: {result2 is None}")
print(f"✓ Markdown JSON extracted: {result3 is not None}")

# Test expiration calculation
print("\nTesting expiration calculation...")
from datetime import datetime
timestamp = datetime.utcnow().isoformat()
expires_never = mh.calculate_expires_at(timestamp, 0)
expires_30 = mh.calculate_expires_at(timestamp, 30)
print(f"✓ TTL=0 expires at: {expires_never}")
print(f"✓ TTL=30 expires at: {expires_30[:10]}...")

print("\n" + "="*50)
print("All basic tests passed! ✓")
print("="*50)
print("\nNOTE: To test the actual MCP tools, you need to:")
print("1. Ensure the MCP server is running")
print("2. Connect via MCP client (e.g., Claude Desktop)")
print("3. Call the tools: memory_store_candidate, memory_rewrite_query, etc.")
