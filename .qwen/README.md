# .qwen Folder - AI Assistant Documentation

This folder contains documentation specifically designed for AI assistants (like Qwen) to maintain continuity across development sessions.

---

## 📚 Document Hierarchy

### Start Here
1. **SESSION_SUMMARY.md** - What was done in the last session
2. **QUICK_REFERENCE.md** - Commands, credentials, endpoints
3. **GUIDELINES.md** - How to develop in this codebase
4. **PROJECT_CONTEXT.md** - Architecture and module status

---

## 🎯 How to Use These Documents

### When Starting a New Session

```markdown
1. Read SESSION_SUMMARY.md
   → Understand what was accomplished last
   
2. Check QUICK_REFERENCE.md
   → Get test credentials and commands
   
3. Review GUIDELINES.md (as needed)
   → Follow proper workflows
   
4. Reference PROJECT_CONTEXT.md (as needed)
   → Understand module dependencies
```

### When Implementing New Features

```markdown
1. Check PROJECT_CONTEXT.md
   → See existing patterns and conventions
   
2. Review GUIDELINES.md
   → Follow development workflow
   
3. Update SESSION_SUMMARY.md (after completion)
   → Document what was changed
```

---

## 📄 Document Descriptions

### SESSION_SUMMARY.md
**Purpose:** Track what was accomplished in each AI session

**Contains:**
- Features implemented
- Bugs fixed
- Files created/modified
- Known issues
- Next steps

**Update:** After each development session

---

### QUICK_REFERENCE.md
**Purpose:** Quick lookup for daily development tasks

**Contains:**
- Common commands
- Test credentials
- Key endpoints
- Troubleshooting snippets
- Environment variables

**Use:** Daily reference

---

### GUIDELINES.md
**Purpose:** Complete development guide

**Contains:**
- Project structure
- Code conventions
- Development workflows
- Database management
- Testing procedures
- Security best practices

**Use:** When learning the codebase or starting new features

---

### PROJECT_CONTEXT.md
**Purpose:** Architectural overview and module status

**Contains:**
- Completed modules
- Database schema
- API conventions
- Implementation patterns
- Frontend priorities
- Known limitations

**Use:** Understanding what exists and how it fits together

---

## 🔄 Updating Documentation

### After Each Session

1. **Update SESSION_SUMMARY.md**
   - List new features
   - Note file changes
   - Document issues encountered

2. **Update QUICK_REFERENCE.md** (if needed)
   - Add new commands
   - Add new endpoints
   - Add troubleshooting tips

3. **Update PROJECT_CONTEXT.md** (if needed)
   - Mark modules as complete
   - Update schema if changed
   - Update frontend priorities

---

## 💡 Best Practices

### For AI Assistants

✅ **DO:**
- Read SESSION_SUMMARY.md first
- Follow conventions in GUIDELINES.md
- Update documentation after changes
- Reference existing patterns

❌ **DON'T:**
- Skip reading documentation
- Create duplicate functionality
- Change conventions without reason
- Leave documentation outdated

### For Developers

✅ **DO:**
- Keep .qwen folder updated
- Review AI session summaries
- Follow documented workflows
- Add troubleshooting tips

❌ **DON'T:**
- Delete .qwen folder
- Ignore session summaries
- Skip migration steps
- Commit .env file

---

## 📞 Quick Navigation

| Need | Document | Section |
|------|----------|---------|
| Start server | QUICK_REFERENCE.md | Daily Development Commands |
| Test credentials | QUICK_REFERENCE.md | Test Login Credentials |
| Add database column | GUIDELINES.md | Development Workflow |
| Understand leave module | PROJECT_CONTEXT.md | Leave Module |
| What was done last | SESSION_SUMMARY.md | Current Session Achievements |
| File upload API | QUICK_REFERENCE.md | Key Endpoints |
| TiDB setup | GUIDELINES.md | Database Management |

---

## 🎯 Current Project Status

**Backend:** ✅ Production Ready
- All core modules complete
- File uploads implemented
- Notifications working
- Migrations tested
- TiDB Cloud configured

**Frontend:** ❌ Needs Implementation
- Priority: Authentication & Core
- Then: Staff Module
- Then: Leave Module

**Next Session:** Start frontend development (Phase 1)

---

## 📚 Additional Documentation

Outside the `.qwen/` folder:

| Location | Purpose |
|----------|---------|
| `docs/TIDB_CLOUD_SETUP.md` | TiDB configuration |
| `docs/LEAVE_MODULE_API_DOCUMENTATION.md` | Leave API reference |
| `docs/LEAVE_REQUEST_FILE_UPLOAD_GUIDE.md` | File upload guide |
| `docs/database-seeder.md` | Seeder documentation |
| `screens/` | UI/UX specifications |
| `postman/` | API testing collections |
| `README.md` | Project overview |

---

**Remember:** Good documentation makes development faster and more predictable. Update it regularly!
