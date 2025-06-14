import { describe, it, expect } from "vitest";
import dedent from "dedent";
// import * as prettier from "prettier";

import { processMdx, processMdxRaw } from "./util/index.mdx";

describe("reyhpe-image-hack, with MDX sources", () => {
  // ******************************************
  it("Basic MDX source", async () => {
    const input = dedent`
      <h2>Hi</h2>

      ![](image.png)

      <img src="image.png" alt=""/>
    `;

    const output = `
      "<h2>Hi</h2>
      <p><img src="image.png" alt=""/></p>
      <img src="image.png" alt=""/>"
    `;

    expect(await processMdxRaw(input, "md")).toMatchInlineSnapshot(output);
    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(output);
  });

  // ******************************************
  it("Basic MDX source, eleminates empty titles", async () => {
    const input = dedent`
      ![](image.png " > ")

      <img src="image.png" alt="" title=" > "/>
    `;

    const output = `
      "<p><img src="image.png" alt=""/></p>
      <img src="image.png" alt=""/>"
    `;

    expect(await processMdxRaw(input, "md")).toMatchInlineSnapshot(output);
    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(output);
  });

  // ******************************************
  it("MDX source, handle autolinks", async () => {
    const input = dedent`
      ![]([image.png])

      ![]((image.png))

      handle ![]([image.png]) ![]((image.png)) in a paragraph

      <img src="[image.png]" alt=""/>

      <img src="(image.png)" alt=""/>

      <img src="[image.png]" alt=""/> text

      <img src="(image.png)" alt=""/> text

      handle <img src="[image.png]" alt=""/> <img src="(image.png)" alt=""/> in a paragraph
    `;

    const output = `
      "<p><a href="image.png" target="_blank"><img src="image.png" alt=""/></a></p>
      <p><a href="image.png" target="_blank"><img src="image.png" alt=""/></a></p>
      <p>handle <a href="image.png" target="_blank"><img src="image.png" alt=""/></a> <a href="image.png" target="_blank"><img src="image.png" alt=""/></a> in a paragraph</p>
      <a href="image.png" target="_blank"><img src="image.png" alt=""/></a>
      <a href="image.png" target="_blank"><img src="image.png" alt=""/></a>
      <p><a href="image.png" target="_blank"><img src="image.png" alt=""/></a> text</p>
      <p><a href="image.png" target="_blank"><img src="image.png" alt=""/></a> text</p>
      <p>handle <a href="image.png" target="_blank"><img src="image.png" alt=""/></a> <a href="image.png" target="_blank"><img src="image.png" alt=""/></a> in a paragraph</p>"
    `;

    expect(await processMdxRaw(input, "md")).toMatchInlineSnapshot(output);
    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(output);
  });

  // ******************************************
  it("MDX source, autolinks && caption already in a link - 1", async () => {
    const input = dedent`
      [![]([image.png])](https://example.com)
      [![]((image.png))](https://example.com)

      [![^Caption]([image.png])](https://example.com)
      [![^Caption]((image.png))](https://example.com)

      <a href="https://example.com"><img src="[image.png]" alt=""/></a>
      <a href="https://example.com"><img src="(image.png)" alt=""/></a>

      here is the image <a href="https://example.com"><img src="[image.png]" alt=""/></a>
      here is the image <a href="https://example.com"><img src="(image.png)" alt=""/></a>

      <a href="https://example.com"><img src="[image.png]" alt="^Caption"/></a>
      <a href="https://example.com"><img src="(image.png)" alt="^Caption"/></a>
    `;

    expect(await processMdxRaw(input, "md")).toMatchInlineSnapshot(`
      "<p><a href="https://example.com"><img src="image.png" alt=""/></a>
      <a href="https://example.com"><img src="image.png" alt=""/></a></p>
      <a href="https://example.com"><figure><img src="image.png" alt="Caption"/><figcaption>Caption</figcaption></figure></a>
      <a href="https://example.com"><figure><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a><figcaption>Caption</figcaption></figure></a>
      <p><a href="https://example.com"><img src="image.png" alt=""/></a>
      <a href="https://example.com"><img src="image.png" alt=""/></a></p>
      <p>here is the image <a href="https://example.com"><img src="image.png" alt=""/></a>
      here is the image <a href="https://example.com"><img src="image.png" alt=""/></a></p>
      <a href="https://example.com"><figure><img src="image.png" alt="Caption"/><figcaption>Caption</figcaption></figure></a>
      <a href="https://example.com"><figure><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a><figcaption>Caption</figcaption></figure></a>"
    `);

    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(`
      "<p><a href="https://example.com"><img src="image.png" alt=""/></a>
      <a href="https://example.com"><img src="image.png" alt=""/></a></p>
      <a href="https://example.com"><figure><img src="image.png" alt="Caption"/><figcaption>Caption</figcaption></figure></a>
      <a href="https://example.com"><figure><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a><figcaption>Caption</figcaption></figure></a>
      <a href="https://example.com"><img src="image.png" alt=""/></a>
      <a href="https://example.com"><img src="image.png" alt=""/></a>
      <p>here is the image <a href="https://example.com"><img src="image.png" alt=""/></a>
      here is the image <a href="https://example.com"><img src="image.png" alt=""/></a></p>
      <a href="https://example.com"><figure><img src="image.png" alt="Caption"/><figcaption>Caption</figcaption></figure></a>
      <a href="https://example.com"><figure><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a><figcaption>Caption</figcaption></figure></a>"
    `);
  });

  // ******************************************
  it("MDX source, autolinks already in a link and/or a figure - 2", async () => {
    const input = dedent`
      <a href="https://example.com">
        <figure><img src="[image.png]" alt=""/></figure>
      </a>
      <a href="https://example.com">
        <figure><img src="(image.png)" alt=""/></figure>
      </a>
      
      <figure><a href="https://example.com"><img src="[image.png]" alt=""/></a></figure>
      <figure><a href="https://example.com"><img src="(image.png)" alt=""/></a></figure>
    `;

    expect(await processMdxRaw(input, "md")).toMatchInlineSnapshot(`
      "<a href="https://example.com">
        <figure><img src="image.png" alt=""/></figure>
      </a>
      <a href="https://example.com">
        <figure><a href="image.png" target="_blank"><img src="image.png" alt=""/></a></figure>
      </a>
      <figure><a href="https://example.com"><img src="image.png" alt=""/></a></figure>
      <figure><a href="https://example.com"><img src="image.png" alt=""/></a></figure>"
    `);

    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(`
      "<a href="https://example.com"><figure><img src="image.png" alt=""/></figure></a>
      <a href="https://example.com"><figure><a href="image.png" target="_blank"><img src="image.png" alt=""/></a></figure></a>
      <figure><a href="https://example.com"><img src="image.png" alt=""/></a></figure>
      <figure><a href="https://example.com"><img src="image.png" alt=""/></a></figure>"
    `);
  });

  // TODO handle if the grandparent is already a figure element, the last couple
  // ******************************************
  it("MDX source, autolinks && caption already in a link and/or a figure - 3", async () => {
    const input = dedent`
      <a href="https://example.com">
        <figure><img src="[image.png]" alt="^Caption"/></figure>
      </a>
      <a href="https://example.com">
        <figure><img src="(image.png)" alt="^Caption"/></figure>
      </a>
      
      <figure><a href="https://example.com"><img src="[image.png]" alt="^Caption"/></a></figure>
      <figure><a href="https://example.com"><img src="(image.png)" alt="^Caption"/></a></figure>
    `;

    expect(await processMdxRaw(input, "md")).toMatchInlineSnapshot(`
      "<a href="https://example.com">
        <figure><img src="image.png" alt="Caption"/><figcaption>Caption</figcaption></figure>
      </a>
      <a href="https://example.com">
        <figure><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a><figcaption>Caption</figcaption></figure>
      </a>
      <figure><a href="https://example.com"><figure><img src="image.png" alt="Caption"/><figcaption>Caption</figcaption></figure></a></figure>
      <figure><a href="https://example.com"><figure><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a><figcaption>Caption</figcaption></figure></a></figure>"
    `);

    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(`
      "<a href="https://example.com"><figure><img src="image.png" alt="Caption"/><figcaption>Caption</figcaption></figure></a>
      <a href="https://example.com"><figure><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a><figcaption>Caption</figcaption></figure></a>
      <figure><a href="https://example.com"><figure><img src="image.png" alt="Caption"/><figcaption>Caption</figcaption></figure></a></figure>
      <figure><a href="https://example.com"><figure><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a><figcaption>Caption</figcaption></figure></a></figure>"
    `);
  });

  // ******************************************
  it("MDX source, autolinks && does NOT add figure due to be in a figure already", async () => {
    const input = dedent`
      <figure><img src="image.png" alt="^^Caption"/></figure>
      <figure><img src="image.png" alt="^Caption"/></figure>

      <figure><img src="[image.png]" alt="^^Caption"/></figure>
      <figure><img src="[image.png]" alt="^Caption"/></figure>
      
      <figure><img src="(image.png)" alt="^^Caption"/></figure>
      <figure><img src="(image.png)" alt="^Caption"/></figure>
    `;

    const output = `
      "<figure><img src="image.png" alt="Caption"/></figure>
      <figure><img src="image.png" alt="Caption"/><figcaption>Caption</figcaption></figure>
      <a href="image.png" target="_blank"><figure><img src="image.png" alt="Caption"/></figure></a>
      <a href="image.png" target="_blank"><figure><img src="image.png" alt="Caption"/><figcaption>Caption</figcaption></figure></a>
      <figure><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a></figure>
      <figure><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a><figcaption>Caption</figcaption></figure>"
    `;

    expect(await processMdxRaw(input, "md")).toMatchInlineSnapshot(output);
    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(output);
  });

  // ******************************************
  it("MDX source, autolinks && does NOT add figure due to be in a figure already, figcaption is above", async () => {
    const input = dedent`
      <figure><img src="image.png" alt="^^Caption"/></figure>
      <figure><img src="image.png" alt="^Caption"/></figure>

      <figure><img src="[image.png]" alt="^^Caption"/></figure>
      <figure><img src="[image.png]" alt="^Caption"/></figure>
      
      <figure><img src="(image.png)" alt="^^Caption"/></figure>
      <figure><img src="(image.png)" alt="^Caption"/></figure>
    `;

    const output = `
      "<figure><img src="image.png" alt="Caption"/></figure>
      <figure><figcaption>Caption</figcaption><img src="image.png" alt="Caption"/></figure>
      <a href="image.png" target="_blank"><figure><img src="image.png" alt="Caption"/></figure></a>
      <a href="image.png" target="_blank"><figure><figcaption>Caption</figcaption><img src="image.png" alt="Caption"/></figure></a>
      <figure><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a></figure>
      <figure><figcaption>Caption</figcaption><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a></figure>"
    `;

    expect(
      await processMdxRaw(input, "md", { figureCaptionPosition: "above" }),
    ).toMatchInlineSnapshot(output);

    expect(
      await processMdx(input, "mdx", { figureCaptionPosition: "above" }),
    ).toMatchInlineSnapshot(output);
  });

  // ******************************************
  it("MDX source, handle caption for images", async () => {
    const input = dedent`
      ![^^Hello](image.png)

      ![^Hello](image.png)

      ![figcap:Hello](image.png)

      <img src="image.png" alt="^^Hello"/>

      <img src="image.png" alt="^Hello"/>

      <img src="image.png" alt="figcap:Hello"/>
    `;

    const output = `
      "<figure><img src="image.png" alt="Hello"/></figure>
      <figure><img src="image.png" alt="Hello"/><figcaption>Hello</figcaption></figure>
      <figure><img src="image.png" alt="Hello"/><figcaption>Hello</figcaption></figure>
      <figure><img src="image.png" alt="Hello"/></figure>
      <figure><img src="image.png" alt="Hello"/><figcaption>Hello</figcaption></figure>
      <figure><img src="image.png" alt="Hello"/><figcaption>Hello</figcaption></figure>"
    `;

    expect(await processMdxRaw(input, "md")).toMatchInlineSnapshot(output);
    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(output);
  });

  // ******************************************
  it("MDX source, handle caption for videos and images to be converted into videos", async () => {
    const input = dedent`
      ![^^Hello](video.mp4)

      ![^Hello](video.mp4)

      ![figcap:Hello](video.mp4)

      <img src="video.mp4" alt="^^Hello"/>

      <img src="video.mp4" alt="^Hello"/>

      <img src="video.mp4" alt="figcap:Hello"/>

      <video src="video.mp4" alt="^^Hello"></video>

      <video src="video.mp4" alt="^Hello"></video>

      <video src="video.mp4" alt="figcap:Hello"></video>
    `;

    const output = `
      "<figure><video><source src="video.mp4" type="video/mp4"/></video></figure>
      <figure><video><source src="video.mp4" type="video/mp4"/></video><figcaption>Hello</figcaption></figure>
      <figure><video><source src="video.mp4" type="video/mp4"/></video><figcaption>Hello</figcaption></figure>
      <figure><video><source src="video.mp4" type="video/mp4"/></video></figure>
      <figure><video><source src="video.mp4" type="video/mp4"/></video><figcaption>Hello</figcaption></figure>
      <figure><video><source src="video.mp4" type="video/mp4"/></video><figcaption>Hello</figcaption></figure>
      <figure><video src="video.mp4"></video></figure>
      <figure><video src="video.mp4"></video><figcaption>Hello</figcaption></figure>
      <figure><video src="video.mp4"></video><figcaption>Hello</figcaption></figure>"
    `;

    expect(await processMdxRaw(input, "md")).toMatchInlineSnapshot(output);
    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(output);
  });

  // ******************************************
  it("MDX source, handle caption for audio and images to be converted into audio", async () => {
    const input = dedent`
      ![^^Hello](audio.mp3)

      ![^Hello](audio.mp3)

      ![figcap:Hello](audio.mp3)

      <img src="audio.mp3" alt="^^Hello"/>

      <img src="audio.mp3" alt="^Hello"/>

      <img src="audio.mp3" alt="figcap:Hello"/>

      <audio src="audio.mp3" alt="^^Hello"></audio>

      <audio src="audio.mp3" alt="^Hello"></audio>

      <audio src="audio.mp3" alt="figcap:Hello"></audio>
    `;

    const output = `
      "<figure><audio><source src="audio.mp3" type="audio/mpeg"/></audio></figure>
      <figure><audio><source src="audio.mp3" type="audio/mpeg"/></audio><figcaption>Hello</figcaption></figure>
      <figure><audio><source src="audio.mp3" type="audio/mpeg"/></audio><figcaption>Hello</figcaption></figure>
      <figure><audio><source src="audio.mp3" type="audio/mpeg"/></audio></figure>
      <figure><audio><source src="audio.mp3" type="audio/mpeg"/></audio><figcaption>Hello</figcaption></figure>
      <figure><audio><source src="audio.mp3" type="audio/mpeg"/></audio><figcaption>Hello</figcaption></figure>
      <figure><audio src="audio.mp3"></audio></figure>
      <figure><audio src="audio.mp3"></audio><figcaption>Hello</figcaption></figure>
      <figure><audio src="audio.mp3"></audio><figcaption>Hello</figcaption></figure>"
    `;

    expect(await processMdxRaw(input, "md")).toMatchInlineSnapshot(output);
    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(output);
  });

  // ******************************************
  it("MDX source, handle adding attributes utilizing title attribute", async () => {
    const input = dedent`
      ![](image.png "title > width=2rem height=1rem")
      <img src="image.png" alt="" title="title > width=2rem height=1rem"/>

      ![](image.png "> 400x300 loading=lazy")
      <img src="image.png" alt="" title="> 400x300 loading=lazy"/>

      ![](image.png "title > 50%x3rem")
      <img src="image.png" alt="" title="title > 50%x3rem"/>

      ![](video.mp4 "title > width=200 height=100 muted")
      <img src="video.mp4" alt="" title="title > width=200 height=100 muted"/>
      <video src="video.mp4" alt="" title="title > width=200 height=100 muted"></video>

      ![](audio.mp3 "title > #audio-id .audio-class autoplay")
      <img src="audio.mp3" alt="" title="title > #audio-id .audio-class autoplay"/>
      <audio src="audio.mp3" alt="" title="title > #audio-id .audio-class autoplay"></audio>
    `;

    expect(await processMdxRaw(input, "md")).toMatchInlineSnapshot(`
      "<p><img src="image.png" alt="" title="title" style="width:2rem;height:1rem"/>
      <img src="image.png" alt="" title="title" style="width:2rem;height:1rem"/></p>
      <p><img src="image.png" alt="" width="400" height="300" loading="lazy"/>
      <img src="image.png" alt="" width="400" height="300" loading="lazy"/></p>
      <p><img src="image.png" alt="" title="title" style="width:50%;height:3rem"/>
      <img src="image.png" alt="" title="title" style="width:50%;height:3rem"/></p>
      <video title="title" width="200" height="100" muted=""><source src="video.mp4" type="video/mp4"/></video>
      <video title="title" width="200" height="100" muted=""><source src="video.mp4" type="video/mp4"/></video>
      <video src="video.mp4" alt="" title="title" width="200" height="100" muted=""></video>
      <audio title="title" id="audio-id" class="audio-class" autoplay=""><source src="audio.mp3" type="audio/mpeg"/></audio>
      <audio title="title" id="audio-id" class="audio-class" autoplay=""><source src="audio.mp3" type="audio/mpeg"/></audio>
      <audio src="audio.mp3" alt="" title="title" id="audio-id" class="audio-class" autoplay=""></audio>"
    `);

    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(`
      "<p><img src="image.png" alt="" title="title" style="width:2rem;height:1rem"/></p>
      <img src="image.png" alt="" title="title" style="width:2rem;height:1rem"/>
      <p><img src="image.png" alt="" width="400" height="300" loading="lazy"/></p>
      <img src="image.png" alt="" width="400" height="300" loading="lazy"/>
      <p><img src="image.png" alt="" title="title" style="width:50%;height:3rem"/></p>
      <img src="image.png" alt="" title="title" style="width:50%;height:3rem"/>
      <video title="title" width="200" height="100" muted=""><source src="video.mp4" type="video/mp4"/></video>
      <video title="title" width="200" height="100" muted=""><source src="video.mp4" type="video/mp4"/></video>
      <video src="video.mp4" alt="" title="title" width="200" height="100" muted=""></video>
      <audio title="title" id="audio-id" class="audio-class" autoplay=""><source src="audio.mp3" type="audio/mpeg"/></audio>
      <audio title="title" id="audio-id" class="audio-class" autoplay=""><source src="audio.mp3" type="audio/mpeg"/></audio>
      <audio src="audio.mp3" alt="" title="title" id="audio-id" class="audio-class" autoplay=""></audio>"
    `);
  });

  // ******************************************
  it("patch classnames and styles", async () => {
    const inputMd = dedent`
      <img src="image.png" alt="" title="title > style=color:red;padding:5px~10px"/>
      <img src="image.png" style="border:none" alt="" title="> style=color:red;padding:5px~10px"/>
      <img src="image.png" class="ex1" alt="" title="title > .new"/>
      <img src="image.png" class="ex1 ex2" alt="" title="title > .new"/>
      <img src="image.png" loading="eager" title="title > loading=lazy"/>
    `;

    const inputMdx = dedent`
      <img src="image.png" alt="" title="title > style=color:red;padding:5px~10px"/>
      <img src="image.png" style={{border: "none"}} alt="" title="> style=color:red;padding:5px~10px"/>
      <img src="image.png" className="ex1" alt="" title="title > .new"/>
      <img src="image.png" className="ex1 ex2" alt="" title="title > .new"/>
      <img src="image.png" loading="eager" title="title > loading=lazy"/>
    `;

    const output = `
      "<img src="image.png" alt="" title="title" style="color:red;padding:5px 10px"/>
      <img src="image.png" style="border:none;color:red;padding:5px 10px" alt=""/>
      <img src="image.png" class="ex1 new" alt="" title="title"/>
      <img src="image.png" class="ex1 ex2 new" alt="" title="title"/>
      <img src="image.png" loading="lazy" title="title"/>"
    `;

    expect(await processMdxRaw(inputMd, "md")).toMatchInlineSnapshot(output);
    expect(await processMdx(inputMdx, "mdx")).toMatchInlineSnapshot(output);
  });

  // ******************************************
  it("handle attribute value expressions in MDX - 1", async () => {
    const input = dedent`
      <img src={"image.png"}/>
      <img src={"image.png"} alt={""}/>
      <img src={"image.png"} alt={"^^Alt"}/>
      <img src={"image.png"} alt={"^Caption"}/>
      <img src={"(image.png)"} alt={""}/>
      <img src={"(image.png)"} alt={"^^Alt"}/>
      <img src={"(image.png)"} alt={"^Caption"}/>
      <img src={"[image.png]"} alt={""}/>
      <img src={"[image.png]"} alt={"^^Alt"}/>
      <img src={"[image.png]"} alt={"^Caption"}/>
    `;

    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(`
      "<img src="image.png"/>
      <img src="image.png" alt=""/>
      <figure><img src="image.png" alt="Alt"/></figure>
      <figure><img src="image.png" alt="Caption"/><figcaption>Caption</figcaption></figure>
      <a href="image.png" target="_blank"><img src="image.png" alt=""/></a>
      <figure><a href="image.png" target="_blank"><img src="image.png" alt="Alt"/></a></figure>
      <figure><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a><figcaption>Caption</figcaption></figure>
      <a href="image.png" target="_blank"><img src="image.png" alt=""/></a>
      <a href="image.png" target="_blank"><figure><img src="image.png" alt="Alt"/></figure></a>
      <a href="image.png" target="_blank"><figure><img src="image.png" alt="Caption"/><figcaption>Caption</figcaption></figure></a>"
    `);
  });

  // ******************************************
  it("handle attribute value expressions in MDX - 2", async () => {
    const input = dedent`
      <img src={"image.png"} className={"ex1"} alt={""} title={"title > .new"}/>
      <img src={"image.png"} className={"ex1 ex2"} alt={""} title={"title > .new"}/>
      <img src={"image.png"} loading={"eager"} title={"title > loading=lazy download"}/>
      <video src={"video.mp4"} controls title={"title > controls=undefined"}/>
    `;

    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(`
      "<img src="image.png" class="ex1 new" alt="" title="title"/>
      <img src="image.png" class="ex1 ex2 new" alt="" title="title"/>
      <img src="image.png" loading="lazy" title="title" download=""/>
      <video src="video.mp4" title="title"></video>"
    `);
  });

  // ******************************************
  it("disable MdxJsx, doesn't touch MdxJsxElements, but first one which is normal markdown syntax", async () => {
    const input = dedent`
      ![^caption](image.png)
      <p>![^caption](image.png)</p>
      <p><img src="image.png" alt="^caption"/></p>
      <img src="image.png" alt="^caption"/>
    `;

    expect(await processMdx(input, "mdx", { enableMdxJsx: false })).toMatchInlineSnapshot(`
      "<figure><img src="image.png" alt="caption"/><figcaption>caption</figcaption></figure>
      <p>
      <p><figure><img src="image.png" alt="caption"/><figcaption>caption</figcaption></figure></p></p>
      <p><img src="image.png" alt="^caption"/></p>
      <img src="image.png" alt="^caption"/>"
    `);
  });

  // TODO handle if the grandparent is already a figure element
  // ******************************************
  it("fix it !", async () => {
    const input = dedent`
      <figure><a href="https://example.com"><img src="[image.png]" alt="^Caption"/></a></figure>
      <figure><a href="https://example.com"><img src="(image.png)" alt="^Caption"/></a></figure>
    `;

    expect(await processMdxRaw(input, "md")).toMatchInlineSnapshot(`
      "<figure><a href="https://example.com"><figure><img src="image.png" alt="Caption"/><figcaption>Caption</figcaption></figure></a></figure>
      <figure><a href="https://example.com"><figure><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a><figcaption>Caption</figcaption></figure></a></figure>"
    `);

    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(`
      "<figure><a href="https://example.com"><figure><img src="image.png" alt="Caption"/><figcaption>Caption</figcaption></figure></a></figure>
      <figure><a href="https://example.com"><figure><a href="image.png" target="_blank"><img src="image.png" alt="Caption"/></a><figcaption>Caption</figcaption></figure></a></figure>"
    `);
  });

  // TODO weird
  // ******************************************
  it("fix it 2 !", async () => {
    const input = dedent`
      Hi
      <p>![^caption](image.png)</p>
    `;

    expect(await processMdxRaw(input, "md")).toMatchInlineSnapshot(`
      "<p>Hi</p>
      <p>![^caption](image.png)</p>"
    `);

    expect(await processMdx(input, "mdx")).toMatchInlineSnapshot(`
      "<p>Hi
      <p><figure><img src="image.png" alt="caption"/><figcaption>caption</figcaption></figure></p></p>"
    `);
  });
});
