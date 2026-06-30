## Remove AI Tutor from Quick Actions and add Resources

### What we'll change
- In `src/pages/Index.tsx`, update the Quick Actions grid from:
  - Learning, Flashcards, Groups, AI Tutor
  - to: Learning, Flashcards, Groups, Resources
- Reuse the existing `BookOpen` icon (already imported in the file) and the existing `/resources` route.
- Leave the larger AI Tutor promo card below the Quick Actions unchanged unless you want it removed too.

### Files touched
- `src/pages/Index.tsx` only.

### No backend or other UI changes
- This is a pure presentation swap in the home quick-actions grid.
- The AI Tutor page, route, and functionality stay intact.
- The Resources page already exists and is ready to be linked.

### Verification
- Build the app to confirm no import or type errors.
- Check the preview home screen: Quick Actions should show Learning, Flashcards, Groups, and Resources.