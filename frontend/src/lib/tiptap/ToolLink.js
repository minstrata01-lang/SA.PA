// frontend/src/lib/tiptap/ToolLink.js
import { Mark, mergeAttributes } from '@tiptap/core';

export const ToolLink = Mark.create({
  name: 'toolLink',
  keepOnSplit: false,
  exitable: true,

  addAttributes() {
    return {
      toolSlug: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-tool-slug'),
        renderHTML: (attrs) => ({ 'data-tool-slug': attrs.toolSlug }),
      },
      toolName: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-tool-name'),
        renderHTML: (attrs) => attrs.toolName ? { 'data-tool-name': attrs.toolName } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'a[data-tool-slug]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { toolSlug, toolName, ...rest } = HTMLAttributes;
    return [
      'a',
      mergeAttributes(rest, {
        href: toolSlug ? `/tool/${toolSlug}` : '#',
        target: '_blank',
        rel: 'noopener noreferrer',
        class: 'tool-link',
        'data-tool-slug': toolSlug,
        ...(toolName ? { 'data-tool-name': toolName } : {}),
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setToolLink:
        (attrs) =>
        ({ commands }) =>
          commands.setMark('toolLink', attrs),
      unsetToolLink:
        () =>
        ({ commands }) =>
          commands.unsetMark('toolLink'),
    };
  },
});
