// Shared by the site compiler and console preview; preserve explicit attributes.
export default function rehypeKnowledge() {
  function attribute(node, name) {
    return node.properties?.[name] ?? node.attributes?.find((item) => item.type === 'mdxJsxAttribute' && item.name === name)?.value;
  }
  function setAttribute(node, name, value) {
    if (node.type === 'element') node.properties[name] = value;
    else {
      node.attributes = (node.attributes ?? []).filter((item) => item.name !== name);
      node.attributes.push({ type: 'mdxJsxAttribute', name, value: String(value) });
    }
  }
  function text(node) {
    if ([true, 'true'].includes(attribute(node, 'ariaHidden') ?? attribute(node, 'aria-hidden'))) return '';
    if (node.type === 'text') return node.value;
    if ((node.tagName ?? node.name) === 'img') {
      const alt = attribute(node, 'alt');
      return typeof alt === 'string' ? alt : '';
    }
    if (['svg', 'script', 'style'].includes(node.tagName ?? node.name)) return '';
    return (node.children ?? []).map(text).join('');
  }
  return (tree) => {
    function visit(node) {
      if ((node.tagName ?? node.name) === 'a' && !attribute(node, 'title')) {
        const label = attribute(node, 'ariaLabel') ?? attribute(node, 'aria-label');
        const title = (text(node) || (typeof label === 'string' ? label : '')).replace(/\s+/g, ' ').trim();
        if (title) setAttribute(node, 'title', title);
      }
      if ((node.tagName ?? node.name) === 'img') {
        const src = attribute(node, 'src');
        // Only the default front-sprite directory has this known square format.
        // Artwork, custom covers and authors' explicit sizing keep their own dimensions.
        if (typeof src === 'string' && /^https:\/\/raw\.githubusercontent\.com\/PokeAPI\/sprites\/master\/sprites\/pokemon\/\d+\.png$/.test(src)) {
          if (attribute(node, 'width') === undefined && attribute(node, 'height') === undefined) {
            setAttribute(node, 'width', 96);
            setAttribute(node, 'height', 96);
          }
          if (attribute(node, 'loading') === undefined) setAttribute(node, 'loading', 'lazy');
          if (attribute(node, 'decoding') === undefined) setAttribute(node, 'decoding', 'async');
        }
      }
      for (const child of node.children ?? []) visit(child);
    }
    visit(tree);
  };
}
