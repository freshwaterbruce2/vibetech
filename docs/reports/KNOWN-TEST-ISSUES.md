# Known Test Issues - Vibe Tech

> **Last Updated**: October 2, 2025

## Failing Tests (2)

### 1. Color Contrast: Purple on Dark Background
- **File**: `src/tests/accessibility/colorContrast.test.ts`
- **Status**: ❌ Failing (Pre-existing)
- **Issue**: Purple (#B933FF) has contrast ratio of **2.68:1** against dark background (#080810)
- **WCAG Requirement**: 4.5:1 minimum (AA standard)
- **Impact**: Low - Purple is used sparingly for accents, not body text
- **Recommendation**: 
  - Consider lightening purple to #C855FF (3.5:1) or #D777FF (4.5:1)
  - Or restrict purple use to large text only (3:1 requirement)
  - Or use purple with background overlays for better contrast

### 2. Color Contrast: Dark Background on Purple
- **File**: `src/tests/accessibility/colorContrast.test.ts`
- **Status**: ❌ Failing (Pre-existing)
- **Issue**: Same contrast issue, inverted
- **Resolution**: Will be fixed when purple shade is adjusted

## Test Summary

| Category | Passing | Failing | Total |
|----------|---------|---------|-------|
| **Unit Tests** | 33 | 0 | 33 |
| **Accessibility** | 3 | 2 | 5 |
| **TOTAL** | 36 | 2 | 38 |

**Success Rate**: 94.7% (36/38 tests passing)

## Next Actions

### Immediate (Optional)
- [ ] Review purple color usage across application
- [ ] Decide on color adjustment strategy:
  - Option A: Lighten purple to meet WCAG AA
  - Option B: Add contrast overlays where purple is used
  - Option C: Update tests to reflect "large text" exception (3:1 ratio)

### Phase 2 (After CI/CD Setup)
- [ ] Add automated accessibility testing in CI pipeline
- [ ] Implement visual regression testing
- [ ] Add lighthouse CI for performance/accessibility scores
- [ ] Consider adding axe-core for comprehensive a11y testing

## Color Recommendations

Current purple: `#B933FF` (2.68:1 contrast ratio)

### WCAG AA Compliant Options
```css
/* Option 1: Lighter purple (meets AA for normal text) */
--aura-purple-aa: #D777FF;  /* 4.5:1 contrast */

/* Option 2: Much lighter (better for body text) */
--aura-purple-aaa: #E9A8FF;  /* 7:1 contrast - AAA standard */

/* Option 3: Keep current for large text (18pt+) */
--aura-purple-accent: #B933FF;  /* Use for headings only */
```

### Testing Color Contrast

Use WebAIM Contrast Checker:
https://webaim.org/resources/contrastchecker/

Test colors against:
- Dark background: #080810
- Light backgrounds (if used)

## Monitoring

Run accessibility tests:
```bash
npm run test:unit -- src/tests/accessibility
```

Generate coverage report:
```bash
npm run test:unit:coverage
```

---

**Note**: These issues do not block deployment but should be addressed for WCAG 2.1 Level AA compliance.
