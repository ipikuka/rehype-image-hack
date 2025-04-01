import type { Plugin } from "unified";
import type { Element, Root } from "hast";
import { CONTINUE, visit, type VisitorResult } from "unist-util-visit";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { MdxJsxFlowElement } from "mdast-util-mdx-jsx";

type Prettify<T> = { [K in keyof T]: T[K] } & {};

type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

declare module "hast" {
  interface Properties {
    src?: string;
    title?: string;
    alt?: string;
    markedAsToBeTransformed?: string;
  }
}

export type ImageHackOptions = {
  figureCaptionPosition?: "above" | "below";
  alwaysAddControlsForVideos?: boolean;
  alwaysAddControlsForAudio?: boolean;
};

const DEFAULT_SETTINGS: ImageHackOptions = {
  figureCaptionPosition: "below",
  alwaysAddControlsForVideos: false,
  alwaysAddControlsForAudio: false,
};

type PartiallyRequiredImageHackOptions = Prettify<
  PartiallyRequired<
    ImageHackOptions,
    "figureCaptionPosition" | "alwaysAddControlsForVideos" | "alwaysAddControlsForAudio"
  >
>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const video = {
  a: "autoplay",
  c: "controls",
  l: "loop",
  m: "muted",
  s: "src",
  w: "width",
  h: "height",
  p: "poster",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const audio = {
  a: "autoplay",
  c: "controls",
  l: "loop",
  m: "muted",
  s: "src",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const img = {
  a: "alt",
  s: "src",
  ss: "srcset",
  sz: "sizes",
  w: "width",
  h: "height",
  l: "loading",
};

const videoMimeTypes: Record<string, string> = {
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  ogv: "video/ogg",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
};

const audioMimeTypes: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  aac: "audio/aac",
  flac: "audio/flac",
  m4a: "audio/mp4",
};

const mimeTypesMap = { ...videoMimeTypes, ...audioMimeTypes };

const videoExtensions = Object.keys(videoMimeTypes);
const audioExtensions = Object.keys(audioMimeTypes);

const isVideoExt = (ext: string) => videoExtensions.indexOf(ext) >= 0;
const isAudioExt = (ext: string) => audioExtensions.indexOf(ext) >= 0;

/**
 *
 * Function to get the file extension from a link / source
 *
 */
const getExtension = (src: string | undefined): string | undefined => {
  // Match the file extension; consider may has a trailing query or hash
  const RE = /\.([a-zA-Z0-9]+)(?=[?#]|$)/i;

  const match = src?.match(RE);

  return match?.[1];
};

/**
 *
 * enhance markdown image syntax and MDX media elements (img, audio, video) by adding attributes,
 * figure captions, auto-linking to originals, supporting extended syntax for rich media and
 * converting images to video/audio based on the file extension.
 */
const plugin: Plugin<[ImageHackOptions?], Root> = (options) => {
  const settings = Object.assign(
    {},
    DEFAULT_SETTINGS,
    options,
  ) as PartiallyRequiredImageHackOptions;

  /**
   * Transform.
   */
  return (tree: Root): undefined => {
    // console.dir(tree, { depth: 8 });

    /**
     * unravel image elements to be transformed or to be captioned in paragraphs;
     * and mark the elements to be transformed
     * and delete caption directives for other images
     * and delete auto link directives for videos/audios
     *
     * mutates children !
     */
    visit(tree, "element", function (node, index, parent): VisitorResult {
      if (!parent || index === undefined || node.tagName !== "p") {
        return;
      }

      let elementToBeUnraveled: Element | undefined;

      for (let i = 0; i < node.children.length; i++) {
        const element = node.children[i];
        const isLastChild = i === node.children.length - 1;

        if (element.type === "element" && element.tagName === "img") {
          const alt = element.properties.alt;
          const startsWithPlus = alt?.startsWith("+");
          const startsWithStar = alt?.startsWith("*");
          const startsWithCaption = alt?.startsWith("caption:");
          const needsCaption = startsWithCaption || startsWithStar || startsWithPlus;

          if (alt && needsCaption) {
            const figcaptionText =
              startsWithStar || startsWithPlus ? alt.slice(1) : alt.slice(8);

            if (isLastChild) {
              elementToBeUnraveled = element;
            } else {
              element.properties.alt = figcaptionText;
            }
          }

          let src: string | undefined;
          const originalSrc = (src = element.properties.src);

          const hasBracket = originalSrc && /%5B.*%5D/.test(originalSrc);
          if (hasBracket) {
            src = originalSrc.slice(3, -3);
          }

          const extension = getExtension(src);
          const needsTransformation =
            extension && (isVideoExt(extension) || isAudioExt(extension));

          if (needsTransformation && hasBracket) {
            // if has bracket but needs transformation (audio/video), remove brackets in src
            element.properties.src = src;
          }

          if (needsTransformation && isLastChild) {
            element.properties.markedAsToBeTransformed = isVideoExt(extension)
              ? `video/${extension}`
              : `audio/${extension}`;

            elementToBeUnraveled ??= element;
          }
        } else if (element.type === "element" && element.tagName === "a") {
          const subElement = element.children[0];

          if (subElement.type === "element" && subElement.tagName === "img") {
            const alt = subElement.properties.alt;
            const startsWithPlus = alt?.startsWith("+");
            const startsWithStar = alt?.startsWith("*");
            const startsWithCaption = alt?.startsWith("caption:");
            const needsCaption = startsWithCaption || startsWithStar || startsWithPlus;

            if (alt && needsCaption) {
              const figcaptionText =
                startsWithStar || startsWithPlus ? alt.slice(1) : alt.slice(8);

              if (isLastChild) {
                elementToBeUnraveled = element;
              } else {
                subElement.properties.alt = figcaptionText;
              }
            }

            let src: string | undefined;
            const originalSrc = (src = subElement.properties.src);

            const hasBracket = originalSrc && /%5B.*%5D/.test(originalSrc);
            if (hasBracket) {
              src = originalSrc.slice(3, -3);
            }

            const extension = getExtension(src);
            const needsTransformation =
              extension && (isVideoExt(extension) || isAudioExt(extension));

            if (needsTransformation && hasBracket) {
              // if has bracket but needs transformation (audio/video), remove brackets in src
              subElement.properties.src = src;
            }

            if (needsTransformation && isLastChild) {
              subElement.properties.markedAsToBeTransformed = isVideoExt(extension)
                ? `video/${extension}`
                : `audio/${extension}`;

              elementToBeUnraveled ??= element;
            }
          }
        }
      }

      if (elementToBeUnraveled) {
        if (node.children.length === 1) {
          // replace the node paragraph with the image
          parent.children.splice(index, 1, elementToBeUnraveled);
        } else {
          // move the image after node paragraph
          parent.children.splice(index + 1, 0, elementToBeUnraveled);
          // remove the image from node paragraph
          node.children.pop();
        }
      }
    });

    /**
     * add caption for the assets wrapping with <figure> element
     *
     * mutates children !
     */
    visit(tree, "element", function (node, index, parent): VisitorResult {
      if (!parent || index === undefined || !["img", "video", "audio"].includes(node.tagName)) {
        return;
      }

      const alt = node.properties.alt;
      const startsWithPlus = alt?.startsWith("+");
      const startsWithStar = alt?.startsWith("*");
      const startsWithCaption = alt?.startsWith("caption:");
      const needsCaption = startsWithCaption || startsWithStar || startsWithPlus;

      if (alt && needsCaption) {
        const figcaptionText = startsWithStar || startsWithPlus ? alt.slice(1) : alt.slice(8);
        node.properties.alt = node.tagName === "img" ? figcaptionText : undefined;

        const figcaptionElement: Element = {
          type: "element",
          tagName: "figcaption",
          properties: {},
          children: [{ type: "text", value: figcaptionText }],
        };

        const figureElement: Element = {
          type: "element",
          tagName: "figure",
          properties: {},
          children: !startsWithPlus
            ? settings.figureCaptionPosition === "above"
              ? [figcaptionElement, node]
              : [node, figcaptionElement]
            : [node],
        };

        // replace the image with figure element
        parent.children.splice(index, 1, figureElement);
      }
    });

    /**
     * transform image syntax to <video> / <audio> elements
     *
     * mutates children !
     */
    visit(tree, "element", function (node, index, parent): VisitorResult {
      if (!parent || index === undefined || node.tagName !== "img") {
        return;
      }

      const markedAsToBeTransformed = node.properties.markedAsToBeTransformed;
      if (!markedAsToBeTransformed) return CONTINUE;

      const [newTagName, extension] = markedAsToBeTransformed.split("/");

      const src = node.properties.src;
      /* v8 ignore next */
      if (!src) return CONTINUE; // just for type narrowing

      node.properties.src = undefined;
      node.properties.alt = undefined;
      node.properties.markedAsToBeTransformed = undefined;

      const properties = structuredClone(node.properties);

      if (settings.alwaysAddControlsForVideos && newTagName === "video") {
        properties["controls"] = true;
      }

      if (settings.alwaysAddControlsForAudio && newTagName === "audio") {
        properties["controls"] = true;
      }

      const newNode: Element = {
        type: "element",
        tagName: newTagName,
        properties,
        children: [
          {
            type: "element",
            tagName: "source",
            properties: {
              src,
              type: mimeTypesMap[extension],
            },
            children: [],
          },
        ],
      };

      // replace the image with the transformed node
      parent.children.splice(index, 1, newNode);
    });

    /**
     * add additional properties into assets utilizing the title prop
     *
     * add auto link for images not videos and audio.
     */
    visit(tree, "element", function (node, index, parent): VisitorResult {
      if (!parent || index === undefined || !["img", "video", "audio"].includes(node.tagName)) {
        return;
      }

      const title = node.properties.title;
      if (title?.includes(">")) {
        const [mainTitle, directives] = title.split(">");
        node.properties.title = mainTitle.trim() || undefined;

        const attrs = directives.trim().split(" ").filter(Boolean);
        attrs.forEach((attr) => {
          if (attr.startsWith("#")) {
            node.properties.id = attr.slice(1);
          } else if (attr.startsWith(".")) {
            /* v8 ignore next 4 */
            if (Array.isArray(node.properties.className)) {
              node.properties.className.push(attr.slice(1));
            } else if (typeof node.properties.className === "string") {
              node.properties.className = [node.properties.className, attr.slice(1)];
            } else {
              node.properties.className = [attr.slice(1)];
            }
          } else if (attr.includes("=")) {
            const [key, value] = attr.split("=");
            if (key === "width" || key === "height") {
              const match = value.match(/^(\d+)(?:px)?$/);
              if (match) {
                node.properties[key] = Number(match[1]);
              } else {
                node.properties.style = (node.properties.style || "") + `${key}:${value};`;
              }
            } else if (key === "style") {
              node.properties.style = (node.properties.style || "") + `${value};`;
            } else {
              node.properties[key] = value;
            }
          } else if (attr.includes("x")) {
            const [width, height] = attr.split("x");

            if (width) {
              const matchWidth = width.match(/^(\d+)(?:px)?$/);
              if (matchWidth) {
                node.properties["width"] = Number(matchWidth[1]);
              } else {
                node.properties.style = (node.properties.style || "") + `width:${width};`;
              }
            }

            if (height) {
              const matchHeight = height.match(/^(\d+)(?:px)?$/);
              if (matchHeight) {
                node.properties["height"] = Number(matchHeight[1]);
              } else {
                node.properties.style = (node.properties.style || "") + `height:${height};`;
              }
            }
          } else {
            node.properties[attr] = true;
          }
        });
      }

      const srcOriginal = node.properties.src;
      if (!srcOriginal) return CONTINUE;

      if (/%5B.*%5D/.test(srcOriginal)) {
        // slice encoded brackets
        const src = srcOriginal.slice(3, -3);
        node.properties.src = src;

        if (parent.type === "element" && parent.tagName === "a") {
          // if the parent is already anchor link, just pass.
          return CONTINUE;
        }

        const httpsRegex = /^https?:\/\/[^/]+/i; // HTTP or HTTPS links
        const rootRelativeRegex = /^\/[^/]+/; // Root-relative links (e.g., /image.png)
        const wwwRegex = /^www\./i; // www links
        const fileLinkRegex = /^[a-zA-Z0-9-_]+\.(png|jpe?g|gif|webp|svg)(?=[?#]|$)/i;

        // Check if the src matches any of the types
        const isValidLink =
          httpsRegex.test(src) ||
          rootRelativeRegex.test(src) ||
          wwwRegex.test(src) ||
          fileLinkRegex.test(src);

        // Check if the source refers to an image (by file extension)
        const imageFileRegex = /\.(png|jpe?g|gif|webp|svg)(?=[?#]|$)/i;
        const isImage = imageFileRegex.test(src);

        if (isValidLink && isImage) {
          parent.children[index] = {
            type: "element",
            tagName: "a",
            properties: { href: src, target: "_blank" },
            children: [node],
          };
        }
      }
    });

    // visit(tree, "mdxJsxFlowElement", function (node, index, parent): VisitorResult {
    //   /* v8 ignore next 3 */
    //   if (!parent || index === undefined || node.type !== "mdxJsxFlowElement") {
    //     return;
    //   }

    //   // handle for mdx elements in MDX format
    // });
  };
};

export default plugin;
