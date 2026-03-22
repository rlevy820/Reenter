# teachme

A local tutor that reads your code and teaches you about it.

---

## The problem

When you hit a concept you don't understand, the usual answers are tutorials written for someone else or documentation that assumes you already know half of it. What actually helps is someone who has read your specific code and can explain what's happening in plain english — starting from the beginning, not the middle.

---

## How it works

```
$ cd my-project
$ teachme "how does the auth flow work here"
```

A browser opens. The tutor has already read your project. It answers your question directly — one concept at a time, grounded in what's actually in your code.

Don't know where to start, you can run this as well:

```
$ cd my-project
$ teachme
```

The tutor asks what you want to understand and goes from there.

---

## How it teaches

Every explanation starts from first principles — nothing is assumed. The how and the why are detailed. Responses are short by design, with natural stopping points so you can ask follow-ups or change direction.

If something doesn't land, highlight it. A tangent opens inline. Work through it, type `/back`, and you're where you left off.

teachme keeps track of what concepts have given you trouble across sessions. Over time, it knows where to slow down for you specifically.

---

## Status

In development. Not yet installable.
