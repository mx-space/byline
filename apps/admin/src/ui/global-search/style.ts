import { createStaticStyles } from '@lobehub/ui'

export const styles = createStaticStyles(({ css, cssVar }) => ({
  glyph: css`
    display: grid;
    flex: none;
    place-items: center;

    box-sizing: border-box;
    inline-size: 28px;
    block-size: 28px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: ${cssVar.borderRadius};

    color: ${cssVar.colorTextSecondary};

    background: ${cssVar.colorFillQuaternary};

    svg {
      inline-size: 15px;
      block-size: 15px;
    }
  `,

  /* 16px matches the modal header and the search field. */
  searchField: css`
    flex: none;
    padding-inline: 16px;
  `,

  searchResult: css`
    cursor: pointer;

    display: flex;
    gap: 8px;
    align-items: center;

    box-sizing: border-box;

    /* Horizontal padding is cancelled by the margin, so the icon and chevron
       stay on the same line as the group label. All four sides of the hover
       fill use the same 8px. */
    inline-size: calc(100% + 16px);
    margin-inline: -8px;
    padding: 8px;
    border: none;
    border-radius: ${cssVar.borderRadius};

    color: ${cssVar.colorText};
    text-align: start;
    text-decoration: none;

    background: none;

    &:not(:first-of-type) {
      margin-block-start: 8px;
    }

    &:hover {
      background: ${cssVar.colorFillTertiary};
    }
  `,

  searchResultMeta: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;

    margin: 0;

    font-size: ${cssVar.fontSizeSM};
    line-height: 1.45;
    color: ${cssVar.colorTextTertiary};
    overflow-wrap: anywhere;
    white-space: normal;
  `,

  /**
   * Scrollport is full-bleed so the bar sits on the panel edge.
   * The bar still consumes width on the end side, so the end padding
   * gives that width back. Otherwise the row ends short of the search field.
   * --search-scrollbar is measured (offsetWidth - clientWidth).
   */
  searchResults: css`
    overflow: clip auto;
    display: flex;
    flex-direction: column;
    gap: 4px;

    min-block-size: 240px;
    max-block-size: 50vh;
    padding-block: 12px 16px;
    padding-inline: 16px calc(16px - var(--search-scrollbar, 0px));
  `,

  searchStatus: css`
    display: flex;
    gap: 8px;
    align-items: center;

    padding-block: 8px;

    font-size: ${cssVar.fontSizeSM};
    color: ${cssVar.colorTextTertiary};
  `,

  searchSection: css`
    padding-block: 8px 2px;
    padding-inline: 0;

    font-size: ${cssVar.fontSizeSM};
    font-weight: 500;
    color: ${cssVar.colorTextTertiary};
  `,

  /* Outlined trigger with a subtle translucent fill. */
  searchTrigger: css`
    && {
      cursor: pointer;
      background: ${cssVar.colorFillQuaternary};
    }

    &&:hover:not(:focus-within) {
      background: ${cssVar.colorFillTertiary};
    }
  `,

  spacer: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    min-inline-size: 0;
  `,
}))
