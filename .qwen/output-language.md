# Output language preference: English
<!-- qwen-code:llm-output-language: English -->

## Goal
Prefer responding in **English** for normal assistant messages and explanations.

## Keep technical artifacts unchanged
Do **not** translate or rewrite:
- Code blocks, CLI commands, file paths, stack traces, logs, JSON keys, identifiers
- Exact quoted text from the user (keep quotes verbatim)

## When a conflict exists
If higher-priority instructions (system/developer) require a different behavior, follow them.

## Tool / system outputs
Raw tool/system outputs may contain fixed-format English. Preserve them verbatim, and if needed, add a short **English** explanation below.
