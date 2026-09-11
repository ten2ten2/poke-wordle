// Shared by the site compiler and the console preview; keep authors' own titles.
export default function rehypeLinkTitles() {
  function attribute(node, name) {
    return node.properties?.[name] ?? node.attributes?.find((item) => item.type === 'mdxJsxAttribute' && item.name === name)?.value;
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
        if (title) {
          if (node.type === 'element') node.properties.title = title;
          else {
            node.attributes = (node.attributes ?? []).filter((item) => item.name !== 'title');
            node.attributes.push({ type: 'mdxJsxAttribute', name: 'title', value: title });
          }
        }
      }
      for (const child of node.children ?? []) visit(child);
    }
    visit(tree);
  };
}
