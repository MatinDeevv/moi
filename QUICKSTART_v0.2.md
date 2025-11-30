# Phase v0.2 Quick Start Guide

## What's New in v0.2?

Phase v0.2 adds **conversational LLM sessions** with automatic context management and rolling summaries. You can now have ongoing conversations with your local LLM that remember previous messages.

## Quick Example

### Starting a New Session

1. Run Project ME:
   ```powershell
   python main.py
   ```

2. Select option **9** (Create LLM session task)

3. Enter a session ID (e.g., "brainstorm"):
   ```
   Session ID: brainstorm
   ```

4. Enter your first message:
   ```
   Your message: Help me brainstorm ideas for a Python automation tool
   ```

5. Press Enter to skip system prompt (or provide one)

6. Press Enter to skip title

7. The task is created! Now run it with option **2**

### Continuing the Conversation

1. Create another task with option **9**

2. Use the **same session ID**: `brainstorm`

3. The system shows you're continuing:
   ```
   📝 Continuing existing session with 2 message(s)
   Summary: [your conversation summary]
   ```

4. Add your next message:
   ```
   Your message: Can you elaborate on the first idea?
   ```

5. Run with option **2** - the LLM will have context from previous messages!

### Viewing Session History

1. Select option **10** (Inspect session)

2. Enter session ID: `brainstorm`

3. You'll see:
   - Total message count
   - Session summary (if generated)
   - All messages with timestamps
   - Related tasks

## Features

### Automatic Summaries
- After 5+ messages, Project ME automatically generates summaries
- Summaries update every 3 messages
- Keeps context size manageable
- LLM can access full conversation history through summaries

### Multiple Sessions
You can have multiple independent sessions running:
- `brainstorm` - for creative ideation
- `debug` - for debugging help
- `research-python` - for research topics
- `planning` - for project planning

Each session maintains its own context and summary.

### Session Management
- View all session tasks: Use option **4** (List tasks) and filter by tag `session:brainstorm`
- Session tasks are auto-tagged with `session:{session_id}`
- Each session is independent - no cross-contamination

## Best Practices

### 1. Use Descriptive Session IDs
Good: `python-api-design`, `debug-auth-issue`, `research-ml`
Bad: `s1`, `test`, `aaa`

### 2. Start with a System Prompt (Optional)
For specialized conversations, set a system prompt:
```
System prompt: You are an expert Python developer specializing in automation
```

### 3. One Topic Per Session
Keep sessions focused on a single topic or problem. Start a new session for a new topic.

### 4. Review Summaries
Use option **10** to review summaries and ensure the LLM is maintaining proper context.

### 5. Clean Session IDs
Use lowercase, hyphens for spaces: `my-project-name` not `My Project Name!`

## Example Workflows

### Research Session
```
Session ID: research-fastapi
Message 1: "What are the key features of FastAPI?"
Message 2: "How does it compare to Flask?"
Message 3: "Show me a simple example"
```

### Debugging Session
```
Session ID: debug-import-error
Message 1: "I'm getting ModuleNotFoundError: No module named 'tools'"
Message 2: [paste error trace]
Message 3: "That didn't work, here's what I tried..."
```

### Planning Session
```
Session ID: plan-project-me-v0.3
Message 1: "Help me plan the git integration feature"
Message 2: "What tools should we add to tools/git_tools.py?"
Message 3: "How should error handling work?"
```

## Technical Details

### How Context Works
1. Your message → logged as `SESSION_MESSAGE` event
2. System loads:
   - Last summary (if exists)
   - Last 5 messages
3. LLM receives: system prompt + summary + messages + current message
4. Response → logged as `SESSION_RESPONSE` event
5. Every 3 messages: new summary generated

### Summary Generation
- Triggered: Every 3 messages when total ≥ 5
- Uses: Existing summary + last 10 messages
- Creates: 3-5 sentence summary
- Captures: Main topics, questions, solutions, current state

### Event Logging
All session activity is logged to `logs/events.jsonl`:
- `session_message` - Your prompts
- `session_response` - LLM responses
- `session_summary` - Generated summaries

You can always inspect raw logs if needed.

## Troubleshooting

### "No messages found for session"
- Make sure you've **run** at least one task for that session
- Creating a task doesn't add messages - only running it does

### Context seems lost
- Check summary with option **10**
- Summary auto-generates every 3 messages
- Last 5 messages are always included

### LLM gives irrelevant responses
- Session might be too long/unfocused
- Consider starting a new session for new topics
- Review summary to see what context LLM has

## Next Steps

After using sessions for a while:
- Experiment with different session IDs for different project areas
- Use tags to organize sessions (auto-tagged with `session:{id}`)
- Review summaries to improve prompt clarity
- Consider manual summary regeneration (coming in future update)

Enjoy v0.2! 🚀

