// For text and attribute values placed into HTML strings: head tags for the
// pre-render (headTags.js) and the customer email (customerEmailHtml.js).
export function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
