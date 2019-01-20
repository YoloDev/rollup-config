const spaces = (indent: number) => {
  if (indent <= 0) return '';
  let s = '';
  for (let i = 0; i < indent; i++) {
    s += ' ';
  }

  return s;
};

export const indent = (str: string, indent: number) =>
  str
    .split('\n')
    .map(s => spaces(indent) + s)
    .join('\n');
