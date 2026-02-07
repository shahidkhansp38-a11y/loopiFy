

## Plan: Make Search and Notification Buttons Functional + Fix Security Issues

### What will change

**1. Search Button** -- Opens a search dialog/popover that lets you search across your study groups by name or subject.

**2. Notification Bell** -- Shows a dropdown with recent activity: new questions in your groups, answers to your questions, and upvotes on your answers. The red dot will only appear when there are unread notifications.

**3. Security Fixes** -- Address the critical and warning-level issues found in the backend:
- Profiles table is too open (any user can see all profiles) -- will be tightened so users can only see profiles of people in their shared groups (needed for peer learning) plus their own.
- Group members can escalate their own role -- will add an UPDATE policy restricting role changes to group creators only.
- Enable leaked password protection in auth settings.

---

### Technical Details

#### Search Feature
- Add a search dialog (using the existing `cmdk` / Command component) triggered by the Search button in the Index page header.
- The dialog will query `study_groups` table filtering by `name` or `subject` using `ilike`.
- Clicking a result navigates to `/groups`.

#### Notifications Feature
- Create a new `notifications` database table:
  - `id`, `user_id`, `type` (e.g., "new_question", "new_answer", "upvote"), `title`, `message`, `group_id`, `is_read`, `created_at`
- Add RLS policies so users can only see/update their own notifications.
- Create a database trigger function that automatically inserts notifications when:
  - A new question is posted in a group (notify all other members)
  - An answer is posted to a question (notify the question author)
  - An answer is upvoted (notify the answer author)
- Create `useNotifications` hook to fetch and mark notifications as read.
- Create a `NotificationPopover` component using the Popover UI component, showing a list of recent notifications with a "mark all read" option.
- The red badge dot will reflect actual unread count.
- Enable realtime on the notifications table for live updates.

#### Security Fixes (Database Migration)
- **Profiles policy**: Replace the broad "Authenticated users can view profiles" SELECT policy with a narrower one that allows viewing profiles of users who share a group with you (using `is_group_member` or a join on `group_members`), plus your own profile.
- **Group members UPDATE policy**: Add a policy that only allows the group creator to update member roles.
- **Leaked password protection**: Enable via auth configuration.

#### Files to create
- `src/hooks/useNotifications.tsx` -- hook for fetching/managing notifications
- `src/components/NotificationPopover.tsx` -- notification dropdown UI
- `src/components/SearchDialog.tsx` -- search dialog component

#### Files to modify
- `src/pages/Index.tsx` -- wire up search and notification buttons to the new components

#### Database migration
- Create `notifications` table with RLS
- Create trigger functions for auto-generating notifications
- Fix profiles SELECT policy
- Add group_members UPDATE policy
- Enable realtime on notifications table
