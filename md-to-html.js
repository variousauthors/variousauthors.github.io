const rules = {
  "#": "h1",
  "##": "h2",
  "###": "h3",
};

const tokens = lexicalTokenizer(`
# Title

## Section One

This is an example of some text that I would like to turn into HTML.

This would be a new paragraph.

### Sub-Section One

Hello again this is another example.

Very simple stuff.
`);

const result = [
  ["h1", "Title"],
  ["h2", "Section One"],
  ["p", "This is an example of some text that I would like to turn into HTML."],
  ["p", "This would be a new paragraph."],
  ["h3", "Sub-Section One"],
  ["p", "Hello again this is another example."],
  ["p", "Very simple stuff."],
];

function equals(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

const good = tokens.every((token, i) => equals(result[i], token));

function lexicalTokenizer(data) {
  const tokens = data.trim().split(/ |\n/);

  let state = "";

  const lexicalTokens = tokens.reduce((acc, token) => {
    /**
     * @TODO if we are in "" state and we encounter ""
     * then we should add a ['br', '']
     */
    if (token === "") {
      state = "";
      return acc;
    }

    if (rules[token]) {
      state = rules[token];
      acc.push([rules[token], ""]);
      return acc;
    }

    const current = acc[acc.length - 1];

    if (state === "") {
      state = "p";
      acc.push(["p", token]);
    } else {
      acc[acc.length - 1] = [
        current[0],
        (current[1] + " " + token).trimStart(),
      ];
    }

    return acc;
  }, []);

  return lexicalTokens;
}

function toHTML(lexicalTokens) {
  return lexicalTokens
    .reduce((acc, token) => {
      const tag = token[0];

      acc.push(`<${tag}>${token[1]}</${tag}>`);

      return acc;
    }, [])
    .join("\n");
}

async function main() {
  const [_a, _b, path] = Bun.argv;

  const foo = Bun.file(path);

  console.log(foo, await foo.text());

  const html = toHTML(lexicalTokenizer(await foo.text()));

  await Bun.write("test.html", html);
}

main();
