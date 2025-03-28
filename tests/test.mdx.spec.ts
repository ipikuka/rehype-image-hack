import { describe, it, expect } from "vitest";
import dedent from "dedent";
import * as prettier from "prettier";

import { processMdx } from "./util/reference.mdx";

describe("reyhpe-image-hack, with MDX sources", () => {
  // ******************************************
  it("Basic MDX source", async () => {
    const input = dedent`
      ![](image.png)

      <img src="image.png" alt="" />
    `;

    const html = await processMdx(input, "mdx");

    expect(html).toMatchInlineSnapshot(`
      "<p><img src="image.png" alt=""/></p>
      <img src="image.png" alt=""/>"
    `);

    expect(await prettier.format(html, { parser: "mdx" })).toMatchInlineSnapshot(`
      "<p>
        <img src="image.png" alt="" />
      </p>
      <img src="image.png" alt="" />
      "
    `);
  });
});

// for reference

// const element = {
//   type: "element",
//   tagName: "img",
//   properties: { src: "image.png", alt: "" },
//   children: [],
// };

// const mdxJsxFlowElement = {
//   type: "mdxJsxFlowElement",
//   name: "img",
//   attributes: [
//     {
//       type: "mdxJsxAttribute",
//       name: "src",
//       value: "image.png",
//     },
//     {
//       type: "mdxJsxAttribute",
//       name: "alt",
//       value: "",
//     },
//   ],
//   data: { _mdxExplicitJsx: true },
//   children: [],
// };
