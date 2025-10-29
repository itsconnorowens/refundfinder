# Development Process Guidelines

## 🎯 Core Principle

**NEVER build features without explicit user approval.** All development work must be scoped, approved, and tracked.

---

## ❌ What Went Wrong (This Session)

### The Mistake
I built camera integration and mobile PWA features **without asking first**. This violated scope and wasted time.

### Why It Happened
1. Saw "mobile-first PWA" in a design document
2. Assumed it was approved work
3. Started implementing immediately
4. Added scope creep (camera integration)
5. Built for hours without checking alignment with PRD

### The Cost
- ~3-4 hours of wasted work
- Created confusion about actual requirements
- Built features not in PRD
- Had to revert and start over

---

## ✅ How to Prevent This

### 1. Always Start with a Plan
**Before ANY implementation:**
- Read the PRD fully
- Identify what's actually requested
- Create a written plan with file paths and code snippets
- Show the plan to user
- Wait for explicit approval

### 2. Ask Before Building
**Never assume approval.** Always ask:
- "Should I build this?"
- "Is this in scope?"
- "Does this align with the PRD?"
- "Approved to proceed?"

### 3. Break Down Large Requests
**If asked for "top improvements":**
- List options with effort/impact
- Let user choose what to build
- Build ONLY what they selected
- Ask again before each new feature

### 4. Document Assumptions
**When planning:**
- Document what you're assuming
- Call out potential scope creep
- Ask user to confirm your understanding
- Get explicit approval before starting

### 5. Stop If Unsure
**If confused or uncertain:**
- STOP implementation
- Ask clarifying questions
- Re-confirm requirements
- Get approval before continuing

---

## 📋 Approval Workflow

### Standard Approval Process

```
1. User Request
   ↓
2. Understand Requirements
   ↓
3. Write Plan Document
   ↓
4. Present Plan to User
   ↓
5. User Reviews & Approves
   ↓
6. Implement Plan Exactly
   ↓
7. Report Completion
```

### What "Approval" Looks Like

**✅ Explicit Approval:**
- "Yes, build this"
- "Approved"
- "Go ahead"
- "Implement as specified"
- "Looks good, proceed"

**❌ NOT Approval:**
- Silence
- "Interesting"
- "I see"
- Documents shared but not discussed
- Assumptions

---

## 🚫 Scope Creep Prevention

### Red Flags
If building something that:
- ❌ Not explicitly requested
- ❌ Not in PRD/plan
- ❌ Different from existing patterns
- ❌ "Nice to have" feature
- ❌ Adds complexity

**Then STOP and ask permission first.**

### Example
**Requested:** "Build mobile-optimized email parsing"
**What I Built:** Camera integration, offline storage, push notifications
**Why It Was Wrong:** User didn't ask for these features

### Correct Response
**Requested:** "Build mobile-optimized email parsing"
**Should Build:** Only what was requested
**Extras:** Offer options, don't assume

---

## 📝 Plan Template

When creating a plan, include:

```markdown
## What Will Be Built
- Specific features
- File paths
- Code snippets
- Dependencies

## What Will NOT Be Built
- Excluded features
- Out of scope items

## Assumptions
- What I'm assuming
- What needs confirmation

## Questions for Approval
- [ ] Feature A - approved?
- [ ] Feature B - approved?
- [ ] Approach C - approved?
```

---

## 🎯 Session-Specific Learnings

### Learnings from This Session

1. **Design documents ≠ Approval**
   - Just because it's in a design doc doesn't mean build it
   - Always verify with user first

2. **Mobile ≠ Camera**
   - Mobile optimization ≠ camera integration
   - Stay focused on what was requested

3. **PRD is Truth**
   - PRD = approved scope
   - Anything not in PRD needs approval

4. **Ask, Don't Assume**
   - Better to ask 10 questions than assume 1 thing
   - Silence is NOT approval

5. **Start Small**
   - Build minimal, get approval, then expand
   - Don't build a whole system at once

---

## 🔍 Pre-Implementation Checklist

Before writing ANY code:

- [ ] Read PRD completely
- [ ] Understand the request fully
- [ ] Identify what's out of scope
- [ ] Ask clarifying questions if needed
- [ ] Create written plan
- [ ] Show plan to user
- [ ] Get explicit approval
- [ ] Confirm approach is correct
- [ ] Start implementation

---

## 📊 Approval Tracking

### How to Track Approval

**Always create TODOs:**
```typescript
// ✅ Good
[{'id': 'feature-x', 'status': 'pending'}] // Wait for approval

// ❌ Bad
[{'id': 'feature-x', 'status': 'in_progress'}] // Started without approval
```

**Update status only after:**
- User approved the work
- Plan is confirmed
- Implementation started

---

## 🛑 When to Stop

Stop implementation if:
- ❌ Not explicitly requested
- ❌ Not in PRD
- ❌ User says "stop"
- ❌ Uncertain about scope
- ❌ Not approved
- ❌ Different from discussed approach

**Then ask:**
- "Should I continue?"
- "Is this correct?"
- "Which approach do you prefer?"

---

## ✅ Success Criteria

A session is successful when:
- ✅ Built exactly what was requested
- ✅ No scope creep
- ✅ User approved before building
- ✅ Aligned with PRD
- ✅ No wasted work
- ✅ Clear communication

---

## 📚 Reference Documents

### Key Documents to Check
1. `flghtly_prd.md` - Approved scope
2. `PROCESS_GUIDELINES.md` - This document
3. Any approved plans in TODO list

### Before Building, Verify:
- Is this in the PRD?
- Is this in an approved plan?
- Did user explicitly ask for this?
- Am I certain about scope?

---

## 💡 Best Practices

### Communication
- Ask more questions upfront
- Confirm understanding before building
- Show plans for approval
- Report progress regularly

### Scope Management
- Stay within approved scope
- Suggest options, don't assume
- Break down large requests
- Build incrementally

### Quality
- Test what you build
- Check for linter errors
- Follow existing patterns
- Document code changes

---

## 🎓 Remember

**The goal is not to build as much as possible.**

**The goal is to build exactly what's needed, with approval, on time.**

When in doubt: **STOP and ASK**.

