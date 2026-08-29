\# CLAUDE.md — Lazy Money OS Command Center

\#\# Before Any Work  
Always read /docs/MASTER-BUILD-SPEC.md first. It is the permanent source of truth.

\#\# Rules  
\- This is a single-user personal OS. Never add login, auth flows, or multi-user features unless a phase file explicitly says otherwise.  
\- Never introduce colors outside the defined token system (\#166E16 green, \#000000 black, \#FFFFFF white).  
\- Never skip ahead to features from a later phase file. Build only what the current phase file specifies.  
\- If something in a phase file conflicts with the master spec, stop and ask me — do not guess.  
\- After completing a phase, summarize what was built, what deviated from spec (if anything), and confirm before I move to the next phase file.  
\- Commit to git incrementally with clear messages, not one giant commit per phase.  
\- Don't install new dependencies without telling me what and why first.

