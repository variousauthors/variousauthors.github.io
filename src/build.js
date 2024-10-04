import template from './templates/template.html' with { type: "text" };
import { readdir } from "node:fs/promises";
import { parse } from 'path';

const rules = {
  "#": "h1",
  "##": "h2",
  "###": "h3",
  "[[": "a"
};

function lexicalTokenizer(data) {
  const tokens = data.trim().split(/ |\n/);
  console.log(tokens)

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

    const linky = token.match(/\[\[(.*)\]\]/)

    if (linky) {
      const content = linky[1]
      acc.push(["a", content]);
      return acc
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

      if (tag === 'a') {
        acc.push(`<${tag} href='/pages/${token[1]}'>${token[1]}</${tag}>`);
      } else {
        acc.push(`<${tag}>${token[1]}</${tag}>`);
      }

      return acc;
    }, [])
    .join("\n");
}

const root = "_test"

async function main() {
  const files = await readdir(root, { recursive: true });
  const markdownFiles = files.filter((file) => file.match(/\.md$/))

  console.log(markdownFiles)

  await markdownFiles.forEach(async (path) => {
    const foo = Bun.file(`${root}/${path}`);

    const content = toHTML(lexicalTokenizer(await foo.text()));

    const html = template.replace('<!-- your content here... -->', content)

    const htmlPath = `${path.replace('.md', '.html')}`

    await Bun.write(htmlPath, html);
  })

}

main();