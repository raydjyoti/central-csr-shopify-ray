export const markdownStyles = `
.markdown-content {
  line-height: 1.6;
  width: 100%;
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  letter-spacing: 0%;
  overflow: hidden;
  min-width: 0;
}

.markdown-content p {
  margin-bottom: 14px;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  font-weight: 400;
  font-family: 'Inter', sans-serif;
}

.markdown-content h1 {
  font-size: 1.75em;
}

.markdown-content h2 {
  font-size: 1.5em;
}

.markdown-content h3 {
  font-size: 1.25em;
}

.markdown-content ul,
.markdown-content ol {
  margin-left: 0.5em;
  margin-bottom: 1em;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
}

.markdown-content li {
  margin-bottom: 0.5em;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
}

.markdown-content pre {
  background-color: #f6f8fa;
  border-radius: 0.375em;
  padding: 1em;
  overflow-x: auto;
  max-width: 100%;
  margin: 1em 0;
  white-space: pre-wrap;
  word-break: break-all;
  min-width: 0;
  box-sizing: border-box;
}

.markdown-content code {
  background-color: #f6f8fa;
  border-radius: 0.25em;
  padding: 0.2em 0.4em;
  font-family: monospace;
  word-break: break-all;
  overflow-wrap: break-word;
  max-width: 100%;
  display: inline-block;
  box-sizing: border-box;
}

.markdown-content pre code {
  background-color: transparent;
  padding: 0;
}

.markdown-content blockquote {
  border-left: 4px solid #dfe2e5;
  padding-left: 1em;
  margin-left: 0;
  margin-right: 0;
  color: #6a737d;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  max-width: 100%;
  margin-bottom: 1em;
  display: block;
  overflow-x: auto;
  white-space: nowrap;
  min-width: 0;
  box-sizing: border-box;
}

.markdown-content table tbody,
.markdown-content table thead,
.markdown-content table tr {
  display: table;
  width: 100%;
  table-layout: fixed;
  min-width: 0;
}

.markdown-content table th,
.markdown-content table td {
  border: 1px solid #dfe2e5;
  padding: 0.5em 1em;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 0;
  min-width: 0;
  box-sizing: border-box;
}

.markdown-content table th {
  background-color: #f6f8fa;
}

.markdown-content hr {
  height: 0.25em;
  margin: 1.5em 0;
  background-color: #e1e4e8;
  border: 0;
}

.markdown-content a {
  color: #0366d6;
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.user-message {
  color: black;
  width: auto;
  max-width: 100%;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 20px;
  line-height: 30px;
  margin-bottom: 12px;
}

.assistant-message {
  width: 100%;
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  min-width: 0;
  overflow: hidden;
}

.tool-result-content {
  color: #57595C;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 20px;
  width: 100%;
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  overflow: hidden;
  min-width: 0;
}

.tool-result-content * {
  color: #57595C !important;
}

.tool-result-content h1,
.tool-result-content h2,
.tool-result-content h3,
.tool-result-content h4,
.tool-result-content h5,
.tool-result-content h6 {
  font-weight: bold !important;
  color: #57595C !important;
  margin-top: 1.5em;
  margin-bottom: 0.75em;
  font-family: 'Inter', sans-serif;
}

.tool-result-content h1 {
  font-size: 1.75em;
}

.tool-result-content h2 {
  font-size: 1.5em;
}

.tool-result-content h3 {
  font-size: 1.25em;
}

.tool-result-content strong,
.tool-result-content b {
  font-weight: bold !important;
  color: #57595C !important;
}

.tool-result-content ul,
.tool-result-content ol {
  margin-left: 1.5em;
  margin-bottom: 1em;
  color: #57595C !important;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 20px;
}

.tool-result-content li {
  margin-bottom: 0.5em;
  color: #57595C !important;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 20px;
}

.tool-result-content p {
  margin-bottom: 14px;
  color: #57595C !important;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 20px;
}

.tool-result-content a {
  color: #0366d6 !important;
  text-decoration: none;
}

.tool-result-content a:hover {
  text-decoration: underline;
}

.tool-result-content pre {
  background-color: #f6f8fa;
  border-radius: 0.375em;
  padding: 1em;
  overflow-x: auto;
  max-width: 100%;
  margin: 1em 0;
  white-space: pre-wrap;
  word-break: break-all;
  min-width: 0;
  box-sizing: border-box;
}

.tool-result-content code {
  background-color: #f6f8fa;
  border-radius: 0.25em;
  padding: 0.2em 0.4em;
  font-family: monospace;
  color: #57595C !important;
  word-break: break-all;
  overflow-wrap: break-word;
  max-width: 100%;
  display: inline-block;
  box-sizing: border-box;
}

.tool-result-content pre code {
  background-color: transparent;
  padding: 0;
}

.tool-result-content blockquote {
  border-left: 4px solid #dfe2e5;
  padding-left: 1em;
  margin-left: 0;
  margin-right: 0;
  color: #57595C !important;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 20px;
}

.tool-result-content table {
  border-collapse: collapse;
  width: 100%;
  max-width: 100%;
  margin-bottom: 1em;
  display: block;
  overflow-x: auto;
  white-space: nowrap;
  min-width: 0;
  box-sizing: border-box;
}

.tool-result-content table tbody,
.tool-result-content table thead,
.tool-result-content table tr {
  display: table;
  width: 100%;
  table-layout: fixed;
  min-width: 0;
}

.tool-result-content table th,
.tool-result-content table td {
  border: 1px solid #dfe2e5;
  padding: 0.5em 1em;
  color: #57595C !important;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  line-height: 20px;
  word-break: break-word;
  overflow-wrap: break-word;
  max-width: 0;
  min-width: 0;
  box-sizing: border-box;
}

.tool-result-content table th {
  background-color: #f6f8fa;
  font-weight: bold !important;
}

.tool-result-content hr {
  height: 0.25em;
  margin: 1.5em 0;
  background-color: #e1e4e8;
  border: 0;
}

.message-container {
  margin-bottom: 20px;
  width: 100%;
  min-width: 0;
  overflow: hidden;
}
`;
