# Global Search

Today the search dialog on Home only looks up study groups, and selecting a result just drops you on the Groups page. This turns it into a real global search across the app.

## What it will search

- **Study groups** — name and subject
- **Lectures** — title and description (only in groups you belong to)
- **VTU resources** — subject and title
- **Flashcard decks** — your own decks by name/subject
- **Assignments** — title, for groups you belong to

Results are grouped by category with an icon and a short subtitle, ranked so exact-prefix matches come first, and each category is capped so no single type floods the list.

## Behaviour

- Debounced typing (300ms) with a loading state, empty state, and a short "recent searches" list persisted locally when the box is empty.
- Selecting a result navigates to the right place: group -> its learning group page, lecture -> group page focused on that lecture, resource -> Resources page with the semester selected and the item opened, deck -> Flashcards page, assignment -> group Tasks tab.
- Keyboard shortcut (Cmd/Ctrl+K) opens it from anywhere, plus the existing Home search button.
- Everything is read-only and runs through existing access rules, so results only include what the signed-in user can already see.

## Technical notes

- Rewrite `src/components/SearchDialog.tsx` to run parallel queries per entity, each with `.limit()`, aborting stale requests via a request-id guard.
- Add a small `useGlobalSearch` hook holding query state, debounce, and result normalisation into a common `{ id, type, title, subtitle, route }` shape.
- Mount the dialog globally (in `AppLayout`) with a `Cmd/Ctrl+K` listener so it is reachable on every route; Home keeps its button and just triggers the shared open state.
- Deep links: Resources accepts `?id=` / `?sem=` params, LearningGroup accepts `?tab=` and `?lecture=` params, handled on mount.
- No schema or policy changes.
