import Image from '@tiptap/extension-image'

/**
 * Extends the default Tiptap Image extension with an `align` attribute.
 * - Stored in the JSON document as `{ align: 'left' | 'center' | 'right' | 'full' }`
 * - Rendered to HTML as `<img data-align="center" ... />`
 * - Parsed back from HTML via the `data-align` attribute
 */
export const CustomImage = Image.extend({
  addAttributes() {
    return {
      // Keep all default Image attributes (src, alt, title)
      ...this.parent?.(),
      // Add our custom align attribute
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align'),
        renderHTML: (attributes) => {
          const valid = ['left', 'center', 'right', 'full']
          if (!valid.includes(attributes.align)) return {}
          return { 'data-align': attributes.align }
        },
      },
    }
  },
})
