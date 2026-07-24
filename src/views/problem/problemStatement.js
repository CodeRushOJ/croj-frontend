import DOMPurify from 'dompurify'

const STATEMENT_HTML_POLICY = {
  ALLOWED_TAGS: [
    'a', 'b', 'blockquote', 'br', 'code', 'del', 'div', 'em', 'h1', 'h2',
    'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'ol', 'p', 'pre',
    'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'th', 'thead',
    'tr', 'u', 'ul',
  ],
  ALLOWED_ATTR: [
    'alt', 'class', 'colspan', 'height', 'href', 'rel', 'rowspan', 'src',
    'title', 'width',
  ],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[#/]|\.{1,2}\/|[a-z0-9][a-z0-9._~!$&'()*+,;=@%-]*(?:[/?#]|$))/i,
}

const sanitizeStatementHtml = value => DOMPurify.sanitize(
  typeof value === 'string' ? value : '',
  STATEMENT_HTML_POLICY,
)

export const sanitizeProblemStatement = problem => ({
  ...problem,
  description: sanitizeStatementHtml(problem?.description),
  inputDescription: sanitizeStatementHtml(problem?.inputDescription),
  outputDescription: sanitizeStatementHtml(problem?.outputDescription),
})
