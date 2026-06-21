# Tasks: Backup & Restore de Progreso

## Overview
Implementar sistema de respaldo y restauración de datos de la aplicación Stringo.

## Task List

### Phase 1: Core Utilities (backup.ts)

#### Task 1.1: Create backup utility file
**Description**: Create `src/utils/backup.ts` with all backup/restore utility functions
**Files**: 
- `src/utils/backup.ts` (NEW)

**Subtasks**:
- [ ] Define `BackupData` interface
- [ ] Implement `exportAllData()` function
- [ ] Implement `importData()` function
- [ ] Implement `validateBackup()` function
- [ ] Implement `applyBackup()` function
- [ ] Implement `downloadBackup()` function
- [ ] Implement `generateBackupFilename()` function
- [ ] Add error handling for all functions
- [ ] Add JSDoc comments

**Acceptance Criteria**:
- [ ] All functions compile without TypeScript errors
- [ ] Export generates valid JSON with all localStorage data
- [ ] Import validates file format and structure
- [ ] Apply correctly restores all data
- [ ] Error messages are clear and descriptive

**Estimated effort**: 2-3 hours

---

#### Task 1.2: Create unit tests for backup utilities
**Description**: Write comprehensive tests for backup utility functions
**Files**:
- `src/utils/__tests__/backup.test.ts` (NEW)

**Subtasks**:
- [ ] Test `exportAllData()` generates valid JSON
- [ ] Test `importData()` handles valid files
- [ ] Test `importData()` rejects invalid files
- [ ] Test `validateBackup()` checks version
- [ ] Test `validateBackup()` checks app name
- [ ] Test `applyBackup()` restores data correctly
- [ ] Test error handling scenarios
- [ ] Mock localStorage for tests

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Coverage > 80% for backup.ts
- [ ] Edge cases covered (empty data, large files, corrupt data)

**Estimated effort**: 2-3 hours

---

### Phase 2: UI Components

#### Task 2.1: Create BackupButton component
**Description**: Create reusable backup button component
**Files**:
- `src/components/shared/backup-button.tsx` (NEW)

**Subtasks**:
- [ ] Create component with icon and full variants
- [ ] Implement loading/success/error states
- [ ] Add onClick handler for backup
- [ ] Add accessibility attributes (aria-label, title)
- [ ] Add keyboard navigation support
- [ ] Add tooltip with helpful text
- [ ] Style component according to design

**Acceptance Criteria**:
- [ ] Button shows correct state (idle/loading/success/error)
- [ ] Downloads backup file on click
- [ ] Accessible via keyboard and screen reader
- [ ] Responsive design works on mobile
- [ ] Follows existing button patterns in codebase

**Estimated effort**: 2-3 hours

---

#### Task 2.2: Create RestoreButton component
**Description**: Create reusable restore button component with file selection and confirmation
**Files**:
- `src/components/shared/restore-button.tsx` (NEW)

**Subtasks**:
- [ ] Create hidden file input
- [ ] Create label styled as button
- [ ] Implement file selection handler
- [ ] Validate selected file
- [ ] Show confirmation modal with backup info
- [ ] Implement restore logic
- [ ] Handle errors gracefully
- [ ] Add accessibility attributes
- [ ] Style modal and button

**Acceptance Criteria**:
- [ ] Opens file selector on click
- [ ] Validates file format before showing confirmation
- [ ] Shows backup date and size in confirmation
- [ ] Asks for confirmation before restoring
- [ ] Reloads page after successful restore
- [ ] Shows error messages for invalid files
- [ ] Accessible via keyboard and screen reader

**Estimated effort**: 4-5 hours

---

#### Task 2.3: Create unit tests for UI components
**Description**: Write tests for BackupButton and RestoreButton components
**Files**:
- `src/components/shared/__tests__/backup-button.test.tsx` (NEW)
- `src/components/shared/__tests__/restore-button.test.tsx` (NEW)

**Subtasks**:
- [ ] Test BackupButton renders correctly
- [ ] Test BackupButton handles click
- [ ] Test BackupButton shows loading state
- [ ] Test BackupButton shows success state
- [ ] Test BackupButton shows error state
- [ ] Test RestoreButton renders correctly
- [ ] Test RestoreButton opens file dialog
- [ ] Test RestoreButton validates file
- [ ] Test RestoreButton shows confirmation modal
- [ ] Mock file operations

**Acceptance Criteria**:
- [ ] All tests pass
- [ ] Component behavior verified
- [ ] Error states tested

**Estimated effort**: 3-4 hours

---

### Phase 3: Integration

#### Task 3.1: Integrate BackupButton into GuideHeader
**Description**: Add backup button to guided mode header
**Files**:
- `src/components/guide/guide-header.tsx` (MODIFIED)

**Subtasks**:
- [ ] Import BackupButton component
- [ ] Add BackupButton to headerActions
- [ ] Position after List button
- [ ] Add helpful tooltip text
- [ ] Verify styling matches existing buttons

**Acceptance Criteria**:
- [ ] Button appears in guided mode header
- [ ] Button downloads backup on click
- [ ] Button follows existing header styling
- [ ] No regression in header functionality

**Estimated effort**: 1 hour

---

#### Task 3.2: Integrate RestoreButton into HomePage
**Description**: Add restore option to home page when no session active
**Files**:
- `src/app/[locale]/page.tsx` (MODIFIED)

**Subtasks**:
- [ ] Import RestoreButton component
- [ ] Add RestoreButton below main CTA
- [ ] Add "o" divider between buttons
- [ ] Style restore section
- [ ] Verify conditional rendering (only when no session)

**Acceptance Criteria**:
- [ ] Restore option appears on home page
- [ ] Restore option hidden when session is active
- [ ] Styling matches design
- [ ] No regression in page functionality

**Estimated effort**: 1-2 hours

---

#### Task 3.3: Create integration tests
**Description**: Write tests for the complete backup/restore flow
**Files**:
- `src/__tests__/backup-restore-integration.test.ts` (NEW)

**Subtasks**:
- [ ] Test full export flow in guided mode
- [ ] Test full import flow from home page
- [ ] Test data persistence after restore
- [ ] Test error scenarios
- [ ] Test UI updates after operations

**Acceptance Criteria**:
- [ ] All integration tests pass
- [ ] Complete flow verified
- [ ] Edge cases covered

**Estimated effort**: 3-4 hours

---

### Phase 4: Documentation & Polish

#### Task 4.1: Add CSS styles
**Description**: Add all necessary styles for backup/restore components
**Files**:
- `src/styles/globals.css` (MODIFIED)

**Subtasks**:
- [ ] Add backup button styles
- [ ] Add restore button styles
- [ ] Add confirmation modal styles
- [ ] Add error message styles
- [ ] Add spinner animation
- [ ] Ensure responsive design
- [ ] Add dark mode support (if applicable)

**Acceptance Criteria**:
- [ ] All components styled correctly
- [ ] Responsive on mobile devices
- [ ] Accessible colors and contrast
- [ ] Consistent with existing design system

**Estimated effort**: 2-3 hours

---

#### Task 4.2: Update documentation
**Description**: Update relevant documentation with new feature
**Files**:
- `README.md` (if exists)
- Inline code comments

**Subtasks**:
- [ ] Add backup/restore feature description
- [ ] Document BackupData format
- [ ] Add usage examples
- [ ] Update any relevant guides

**Acceptance Criteria**:
- [ ] Feature documented
- [ ] Code well-commented
- [ ] Examples provided

**Estimated effort**: 1 hour

---

## Summary

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| Phase 1: Core Utilities | 2 | 4-6 |
| Phase 2: UI Components | 3 | 9-12 |
| Phase 3: Integration | 3 | 5-7 |
| Phase 4: Documentation | 2 | 3-4 |
| **Total** | **10** | **21-29 hours** |

## Dependencies

- Phase 1 must complete before Phase 2
- Phase 2 must complete before Phase 3
- Phase 3 must complete before Phase 4

## Risk Mitigation

1. **localStorage quota**: Test with large datasets, implement graceful error handling
2. **File compatibility**: Version schema, validate on import
3. **Browser compatibility**: Test on Safari iOS, Chrome, Firefox
4. **UI consistency**: Follow existing design patterns, get design review

## Definition of Done

- [ ] All tasks completed
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Tested on target browsers (Chrome, Safari iOS)
- [ ] Documentation updated
- [ ] No regressions in existing functionality
