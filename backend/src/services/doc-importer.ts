import { chromium, type Browser } from "playwright";
import { OpenRouter } from "@openrouter/sdk";

export type ExtractedDoc = {
  title?: string;
  summary?: string;
  content?: string;
};

export type DocImportInput = {
  name: string;
  url: string;
};

export type ImportedDocData = {
  title?: string;
  summary?: string;
  content: string;
};

export interface HtmlFetcher {
  fetch(url: string): Promise<string>;
}

export interface DocExtractor {
  extract(input: { html: string; url: string; name: string }): Promise<ExtractedDoc>;
}

export class DocImporter {
  constructor(private fetcher: HtmlFetcher, private extractor: DocExtractor) {}

  async importDoc(input: DocImportInput) {
    const html = await this.fetcher.fetch(input.url);
    const extracted = await this.extractor.extract({ html, url: input.url, name: input.name });
    const content = extracted.content?.trim();

    if (!content || content.length === 0) {
      throw new Error("Model did not return any content");
    }

    const title = extracted.title?.trim() || input.name;
    const summary = extracted.summary?.trim() || content.slice(0, 200);

    return {
      title,
      summary,
      content,
    };
  }
}

export class PlaywrightHtmlFetcher implements HtmlFetcher {
  async fetch(url: string): Promise<string> {
    const browser: Browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: "load" });
      await page.waitForTimeout(5000);
      return await page.content();
    } finally {
      await browser.close();
    }
  }
}

type MinimalChatResponse = {
  choices: Array<{ message: { content?: unknown } }>;
};

function isChatResponse(value: unknown): value is MinimalChatResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { choices?: unknown }).choices) &&
    (value as { choices?: unknown[] }).choices?.length !== undefined
  );
}

function parseAssistantContent(response: MinimalChatResponse): string {
  const content = response.choices[0]?.message.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const text = content
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && "text" in item) return (item as { text: string }).text;
        return "";
      })
      .join("");
    if (text.trim().length > 0) return text;
  }
  throw new Error("Model response did not include assistant content");
}

export class OpenRouterDocExtractor implements DocExtractor {
  private client: OpenRouter;
  private model: string | undefined;

  constructor(config: { apiKey: string; model?: string; referer?: string; title?: string }) {
    this.client = new OpenRouter({
      apiKey: config.apiKey,
      httpReferer: config.referer,
      xTitle: config.title,
    });
    this.model = config.model;
  }

  async extract({ html, url, name }: { html: string; url: string; name: string }): Promise<ExtractedDoc> {
    const prompt = `
You are a technical writer. Given the FULL HTML for a page, produce a documentation entry.

Return ONLY a JSON object with keys:
- title: short, human-readable title for the doc
- summary: one sentence summary
- content: markdown body capturing the main article/tutorial/reference content. Keep the full page content but ignore navigation menus, headers/footers, cookie banners, popups, and ads. Preserve all code blocks from the page. Include important links as markdown links.

Rules:
- Keep content under 800 words.
- Maintain headings and code fences where appropriate.
- Do not include the original HTML or any extra keys outside the required object.

Doc name hint: ${name}
Source URL: ${url}
`;

    const trimmedHtml = html.length > 60000 ? `${html.slice(0, 60000)}\n<!-- truncated -->` : html;

    const rawResponse = await this.client.chat.send({
      model: this.model ?? "openai/gpt-4o-mini",
      responseFormat: { type: "json_object" },
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: `HTML:\n${trimmedHtml}` },
      ],
    });

    if (!isChatResponse(rawResponse)) {
      throw new Error("Invalid response from OpenRouter");
    }

    const rawContent = parseAssistantContent(rawResponse);
    const parsed = JSON.parse(rawContent) as ExtractedDoc;
    return parsed;
  }
}

export function createDefaultDocImporter(
  config: { apiKey: string; model?: string; referer?: string; title?: string },
): DocImporter {
  const fetcher = new PlaywrightHtmlFetcher();
  const extractor = new OpenRouterDocExtractor(config);
  return new DocImporter(fetcher, extractor);
}
