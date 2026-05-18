# AGENTS.md

## Project Constraints

- Package manager must be `pnpm`.
- The app should be implemented as a real, runnable web project rather than static design-only files.
- Prefer a lightweight frontend stack that supports quick iteration and easy later integration of question flow and result logic.
- Current goal is to produce a polished production-style landing/start page for the attachment style test, not the full test flow yet.
- Content should align with:
  - [docs/specs/attachment-question-bank.md](/Users/lijuwei/Documents/workspace/attachment-style-test/docs/specs/attachment-question-bank.md)
  - [data/question-banks/attachment-style-bank.v2.json](/Users/lijuwei/Documents/workspace/attachment-style-test/data/question-banks/attachment-style-bank.v2.json)

## UX Constraints

- The page should feel like a real launch-ready product page.
- Prefer a centered, single-column structure similar to a formal test landing page.
- Keep typography moderate and readable; avoid oversized hero text.
- Use a light, soft, pastel-minimal palette rather than heavy earthy tones.
- Mobile usability is required from the start.

## Implementation Notes

- It is acceptable to choose the framework, but keep the setup simple and maintainable.
- Use local structured data from the question bank where helpful for real content instead of placeholder lorem ipsum.
- Build toward future expansion: start page now, test flow next.
