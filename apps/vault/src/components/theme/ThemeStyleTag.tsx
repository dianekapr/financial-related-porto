import { SKINS, type SkinColors } from '@/lib/theme/skins'

function toDeclarations(colors: SkinColors): string {
  return [
    `--vault-bg:${colors.bg}`,
    `--vault-surface:${colors.surface}`,
    `--vault-card:${colors.card}`,
    `--vault-border:${colors.border}`,
    `--vault-accent:${colors.accent}`,
    `--vault-accent-light:${colors.accentLight}`,
    `--vault-accent-hover:${colors.accentHover}`,
    `--vault-accent-contrast:${colors.accentContrast}`,
    `--vault-text:${colors.text}`,
    `--vault-text-dim:${colors.textDim}`,
    `--vault-muted:${colors.muted}`,
    `--vault-success:${colors.success}`,
    `--vault-warning:${colors.warning}`,
    `--vault-danger:${colors.danger}`,
    `--vault-info:${colors.info}`,
    `--vault-shadow:${colors.shadow}`,
  ].join(';')
}

// Generates every `[data-theme="skin-id"] { --vault-*: ... }` rule from the
// skins.ts catalog, so skins.ts stays the single place color values live.
// Because the selector isn't scoped to :root, wrapping any element (e.g. a
// settings preview card) in the same data-theme attribute scopes the
// variables to just that subtree.
export default function ThemeStyleTag() {
  const css = SKINS.map(skin => `[data-theme="${skin.id}"]{${toDeclarations(skin.colors)}}`).join('\n')
  return <style id="vault-skins" dangerouslySetInnerHTML={{ __html: css }} />
}
