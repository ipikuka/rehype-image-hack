# rehype-image-hack

[![npm version][badge-npm-version]][url-npm-package]
[![npm downloads][badge-npm-download]][url-npm-package]
[![publish to npm][badge-publish-to-npm]][url-publish-github-actions]
[![code-coverage][badge-codecov]][url-codecov]
[![type-coverage][badge-type-coverage]][url-github-package]
[![typescript][badge-typescript]][url-typescript]
[![license][badge-license]][url-license]

This package is a **[unified][unified]** (**[rehype][rehype]**) plugin that **enhances markdown image syntax and MDX media elements (`img`, `audio`, `video`) by adding attributes, figure captions, auto-linking to originals, supporting extended syntax for rich media and converting images to video/audio based on the file extension.**

**[unified][unified]** is a project that transforms content with abstract syntax trees (ASTs) using the new parser **[micromark][micromark]**. **[remark][remark]** adds support for markdown to unified. **[mdast][mdast]** is the Markdown Abstract Syntax Tree (AST) which is a specification for representing markdown in a syntax tree. **[rehype][rehype]** is a tool that transforms HTML with plugins. **[hast][hast]** stands for HTML Abstract Syntax Tree (HAST) that rehype uses.

Markdown natively supports images but lacks built-in syntax for videos and audio. **`rehype-image-hack`** extends image syntax, automatically transforming it into `<video>` or `<audio>` elements based on file extensions, supporting additional attributes, providing custom directives for auto link to originals, wrapping media with `figure` and adding caption.

## When should I use this?

As far as I can see, other Remark/Rehype plugins related with markdown images apply their features to all images within the content without offering selectivity. For example, I may not want every image to be wrapped in a `<figure>` element, have a caption, or be automatically linked to its original source. In some cases, I need certain images to be excluded from these transformations.

That's why, while developing **`rehype-image-hack`**, I ensured that each feature could be controlled individually through directives. **This is the most distinct advantage of `rehype-image-hack` compared to others.** Additionally, I designed it with an **"all-in-one for images"** approach to provide all the essential features related to Markdown image syntax in a single solution.

**`rehype-image-hack`** is ideal for:
+ **Adding videos/audio using Markdown image syntax** – No need for HTML or custom MDX components.
+ **Adding attributes to images/videos/audio** – Easily add classes, IDs, styles, and other attributes.
+ **Adding `<figure>` and caption** – Easily wrap in a `<figure>` element with an optional caption.
+ **Adding auto link to the original image** - Control which images should be automatically linked to their original source.

## Installation

This package is suitable for ESM only. In Node.js (version 16+), install with npm:

```bash
npm install rehype-image-hack
```

or

```bash
yarn add rehype-image-hack
```

## Usage with markdown

Say we have the following markdown file, `example.md`:

```markdown
It converts images to audio/videos. ![](video.mp4) 

It adds auto link. ![alt]([https://example.com/image.png])

It adds caption. ![*Image Caption](image.png)

It adds attributes. ![](video.mp4 "title > 640x480 autoplay")
```

Our module, `example.js`, looks as follows:

```javascript
import { read } from "to-vfile";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeImageHack from "rehype-image-hack";
import rehypeStringify from "rehype-stringify";

main();

async function main() {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeImageHack)
    .use(rehypeStringify)
    .process(await read("example.md"));

  console.log(String(file));
}
```

Now, running `node example.js` you will see.

```html
<p>It converts images to audio/videos.</p>
<video>
  <source src="video.mp4" type="video/mp4" />
</video>
<p>
  It adds auto link.
  <a href="https://example.com/image.png" target="_blank">
    <img src="https://example.com/image.png" alt="alt"/>
  </a>
</p>
<p>It adds caption.</p>
<figure>
  <img src="image.png" alt="Image Caption" />
  <figcaption>Image Caption</figcaption>
</figure>
<p>It adds attributes.</p>
<video title="title" width="640" height="480" autoplay>
  <source src="video.mp4" type="video/mp4" />
</video>
```

Without `rehype-image-hack` the output would be:

```html
<p>
  It converts images to audio/videos. <img src="video.mp4" alt="" />
</p>
<p>
  It adds auto link. <img src="%5Bhttps://example.com/image.png%5D" alt="alt" />
</p>
<p>
  It adds caption. <img src="image.png" alt="*Image Caption" />
</p>
<p>
  It adds attributes. <img src="video.mp4" alt="" title="title > 640x480 autoplay" />
</p>
```

## Features

### Convert image syntax to videos and audio

Markdown lacks built-in support for video and audio, only providing syntax for images. **`rehype-image-hack`** repurposes the image syntax to render video and audio elements based on file extensions.

+ `![](example.mp4)` is transformed into `<video>` element

```html
<video>
  <source src="example.mp4" type="video/mp4">
</video>
```

+ `![](example.mp3)` is transformed into `<audio>` element

```html
<audio>
  <source src="example.mp3" type="audio/mpeg">
</audio>
```

Since `<video>` and `<audio>` elements are block-level by default, the syntax will be transformed only if it is the sole child in a paragraph, or the last of the child; otherwise will not be transformed.

### Use the `title` attribute to customize images, videos, and audio

Markdown’s image syntax supports an optional **`title`** attribute: **`![](image.png "title")`**

**`rehype-image-hack`** extends this by recognizing **custom directives after greater operator (`>`)** in title.

```markdown
![](my-video.mp4 "Video Title > controls autoplay loop .classname #id width=640 height=480")
```

`width` and `hight` attributes must be in pixel unit for example `320` or `320px`. The units other than pixel will go to the style attribute.

**If no title is needed, start with just greater operator (`>`).**

```markdown
![](my-video.mov "> width=30rem height=20rem poster=image.png")
```

**Directives must be separated by a single space, with no spaces within attribute values and no quotes.**

```markdown
![](my-video.mp4 "My Title > .classname style=width:640px;height:480px; controls")

![image alt](foo.jpg "> #id .class width=30px height=20px")
```

However, you may not need to specify attributes for images, videos and audio, as you can override `<img>`, `<video>`, and `<audio>` elements by providing custom MDX components.

**Use a simple syntax for width and hight using lowercase "x" chracter between**.\
*In this syntax, the pixel units should be a number, do not use `px`.*

```markdown
// Both dimension
![alt](image.png "> 640x480")

// Both dimension WRONG!
![alt](image.png "> 640pxx480px") X WRONG!

// Only width
![alt](image.png "> 640x")

// Only height
![alt](image.png "> x480")

// Both dimension, will go to the style attribute
![alt](image.png "> 50%x10rem")
```

The width and height attributes on images are treated specially. When used without a unit, the unit is assumed to be pixels. However, any of the CSS unit identifiers can be used. There shouldn't be any space between the number and the unit. 

### Create an auto link for images

**Wrap the link of the source in brackets.** It is valid for only if the image source starts with protokol-like links like **`http://`**, web sites start with **`www.`**, root relative links start with a slash **`/`** and if just an image name like **`image.png`**.

```markdown
// pay attention to brackets around the link
![alt]([http://example.com/image.png] "title")
```
will produce the output below:
```html
<p>
  <a href="http://example.com/image.png">
    <img src="http://example.com/image.png" alt="alt" title="title">
  </a>
</p>
```

### Add caption for images/videos/audio (Explicit Figures)

Add a star **`*`** or **`caption:`** directives to the alt attribute in the beginning. It is valid for only if the asset is the sole child of an paragraph, or the last of the child otherwise the star **`*`** or/and **`caption:`** directive will be removed and will still be an inline image without caption.

```markdown
![*Caption of the image](image.png "title")

![caption:Caption of the image](image.png "title")
```

will produce the same html output:

```html
<figure>
  <img src="image.png" alt="Caption of the image" title="title" />
  <figcaption>Caption of the image</figcaption>
</figure>
```

Consider, the image is the last thing in the paragraph.

```markdown
Here is the image. ![*Caption of the image](image.png "title")

Here is the image. ![caption:Caption of the image](image.png "title")
```

will produce the same html output:

```html
<p>Here is the image.</p>
<figure>
  <img src="image.png" alt="Caption of the image" title="title" />
  <figcaption>Caption of the image</figcaption>
</figure>
```

If you want to wrap the asset with `<figure>` element but not to include a caption; add plus **`+`** directive to the alt attribue in the begining.

```markdown
![+alt](image.png "title")

Here is the image. ![+alt](image.png "title")
```

will produce the html output:

```html
<figure>
  <img src="image.png" alt="alt" title="title" />
</figure>
<p>Here is the image.</p>
<figure>
  <img src="image.png" alt="alt" title="title" />
</figure>
```

If you just want a regular inline image, just make sure it is not the sole or the last thing in the paragraph or do not use any `caption:` or `*` or `+` directives in the begining.

```markdown
![This image won't be within a figure and no caption](image.png)
```

## Options

All options are **optional** and have **default values**.

```typescript
type ImageHackOptions = {
  figureCaptionPosition?: "above" | "below";
  alwaysAddControlsForVideos?: boolean;
  alwaysAddControlsForAudio?: boolean;
};

use(rehypeImageHack, ImageHackOptions);
```

#### figureCaptionPosition

It is a **"above" | "below"** union string option which is for placing the caption below or above of the asset.

By default, it is `below`.

```javascript
use(rehypeImageHack, {
  figureCaptionPosition: "above",
});
```

Now, the caption will be the above of the asset.

#### alwaysAddControlsForVideos

It is a **boolean** option which is for adding **`controls`** property to `video` elements by default. 

By default, it is `false`.

```javascript
use(rehypeImageHack, {
  alwaysAddControlsForVideos: true,
});
```

Now, video elements will have `controls` attribute by default.

```html
<video controls>
  <source src="example.mp4" type="video/mp4">
</video>
```

#### alwaysAddControlsForAudio

It is a **boolean** option which is for adding **`controls`** property to `audio` elements by default. 

By default, it is `false`.

```javascript
use(rehypeImageHack, {
  alwaysAddControlsForAudios: true,
});
```

Now, audio elements will have `controls` attribute by default.

```html
<audio controls>
  <source src="example.mp3" type="audio/mpeg">
</audio>
```

### Examples:

## Syntax tree

This plugin modifies the `hast` (HTML abstract syntax tree).

## Types

This package is fully typed with [TypeScript][url-typescript]. The plugin exports the type `ImageHackOptions`.

## Compatibility

This plugin works with `rehype-parse` version 1+, `rehype-stringify` version 1+, `rehype` version 1+, and unified version `4+`.

## Security

Use of `rehype-image-hack` involves rehype (hast), but doesn't lead to cross-site scripting (XSS) attacks.

## My Plugins

I like to contribute the Unified / Remark / MDX ecosystem, so I recommend you to have a look my plugins.

### My Remark Plugins

- [`remark-flexible-code-titles`](https://www.npmjs.com/package/remark-flexible-code-titles)
  – Remark plugin to add titles or/and containers for the code blocks with customizable properties
- [`remark-flexible-containers`](https://www.npmjs.com/package/remark-flexible-containers)
  – Remark plugin to add custom containers with customizable properties in markdown
- [`remark-ins`](https://www.npmjs.com/package/remark-ins)
  – Remark plugin to add `ins` element in markdown
- [`remark-flexible-paragraphs`](https://www.npmjs.com/package/remark-flexible-paragraphs)
  – Remark plugin to add custom paragraphs with customizable properties in markdown
- [`remark-flexible-markers`](https://www.npmjs.com/package/remark-flexible-markers)
  – Remark plugin to add custom `mark` element with customizable properties in markdown
- [`remark-flexible-toc`](https://www.npmjs.com/package/remark-flexible-toc)
  – Remark plugin to expose the table of contents via `vfile.data` or via an option reference
- [`remark-mdx-remove-esm`](https://www.npmjs.com/package/remark-mdx-remove-esm)
  – Remark plugin to remove import and/or export statements (mdxjsEsm)

### My Rehype Plugins

- [`rehype-pre-language`](https://www.npmjs.com/package/rehype-pre-language)
  – Rehype plugin to add language information as a property to `pre` element
- [`rehype-highlight-code-lines`](https://www.npmjs.com/package/rehype-highlight-code-lines)
  – Rehype plugin to add line numbers to code blocks and allow highlighting of desired code lines
- [`rehype-code-meta`](https://www.npmjs.com/package/rehype-code-meta)
  – Rehype plugin to copy `code.data.meta` to `code.properties.metastring`
- [`rehype-image-hack`](https://www.npmjs.com/package/rehype-image-hack)
  – Rehype plugin to enhance markdown image syntax and MDX media elements (`img`, `audio`, `video`) by adding attributes, figure captions, auto-linking to originals, supporting extended syntax for rich media and converting images to video/audio based on the file extension.

### My Recma Plugins

- [`recma-mdx-escape-missing-components`](https://www.npmjs.com/package/recma-mdx-escape-missing-components)
  – Recma plugin to set the default value `() => null` for the Components in MDX in case of missing or not provided so as not to throw an error
- [`recma-mdx-change-props`](https://www.npmjs.com/package/recma-mdx-change-props)
  – Recma plugin to change the `props` parameter into the `_props` in the `function _createMdxContent(props) {/* */}` in the compiled source in order to be able to use `{props.foo}` like expressions. It is useful for the `next-mdx-remote` or `next-mdx-remote-client` users in `nextjs` applications.
- [`recma-mdx-change-imports`](https://www.npmjs.com/package/recma-mdx-change-imports)
  – Recma plugin to convert import declarations for assets and media with relative links into variable declarations with string URLs, enabling direct asset URL resolution in compiled MDX.
- [`recma-mdx-import-media`](https://www.npmjs.com/package/recma-mdx-import-media)
  – Recma plugin to turn media relative paths into import declarations for both markdown and html syntax in MDX.
- [`recma-mdx-import-react`](https://www.npmjs.com/package/recma-mdx-import-react)
  – Recma plugin to ensure getting `React` instance from the arguments and to make the runtime props `{React, jsx, jsxs, jsxDev, Fragment}` is available in the dynamically imported components in the compiled source of MDX.
- [`recma-mdx-html-override`](https://www.npmjs.com/package/recma-mdx-html-override)
  – Recma plugin to allow selected raw HTML elements to be overridden via MDX components.

## License

[MIT License](./LICENSE) © ipikuka

[unified]: https://github.com/unifiedjs/unified
[micromark]: https://github.com/micromark/micromark
[remark]: https://github.com/remarkjs/remark
[remarkplugins]: https://github.com/remarkjs/remark/blob/main/doc/plugins.md
[mdast]: https://github.com/syntax-tree/mdast
[rehype]: https://github.com/rehypejs/rehype
[rehypeplugins]: https://github.com/rehypejs/rehype/blob/main/doc/plugins.md
[hast]: https://github.com/syntax-tree/hast
[rehype-highlight]: https://github.com/rehypejs/rehype-highlight

[badge-npm-version]: https://img.shields.io/npm/v/rehype-image-hack
[badge-npm-download]:https://img.shields.io/npm/dt/rehype-image-hack
[url-npm-package]: https://www.npmjs.com/package/rehype-image-hack
[url-github-package]: https://github.com/ipikuka/rehype-image-hack

[badge-license]: https://img.shields.io/github/license/ipikuka/rehype-image-hack
[url-license]: https://github.com/ipikuka/rehype-image-hack/blob/main/LICENSE

[badge-publish-to-npm]: https://github.com/ipikuka/rehype-image-hack/actions/workflows/publish.yml/badge.svg
[url-publish-github-actions]: https://github.com/ipikuka/rehype-image-hack/actions/workflows/publish.yml

[badge-typescript]: https://img.shields.io/npm/types/rehype-image-hack
[url-typescript]: https://www.typescriptlang.org

[badge-codecov]: https://codecov.io/gh/ipikuka/rehype-image-hack/graph/badge.svg?token=5qXNZ8iuYV
[url-codecov]: https://codecov.io/gh/ipikuka/rehype-image-hack

[badge-type-coverage]: https://img.shields.io/badge/dynamic/json.svg?label=type-coverage&prefix=%E2%89%A5&suffix=%&query=$.typeCoverage.atLeast&uri=https%3A%2F%2Fraw.githubusercontent.com%2Fipikuka%2Frehype-image-hack%2Fmain%2Fpackage.json