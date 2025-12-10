import { describe, expect, it } from "bun:test";
import { DefaultDocImporter, type DocExtractor, type HtmlFetcher } from "../src/services/doc-importer";

class MockFetcher implements HtmlFetcher {
  calls: string[] = [];
  constructor(private html: string) {}
  fetch(url: string): Promise<string> {
    this.calls.push(url);
    return Promise.resolve(this.html);
  }
}

class MockExtractor implements DocExtractor {
  calls: Array<{ html: string; url: string; name: string }> = [];
  constructor(private result: { title?: string; summary?: string; content: string }) {}
  extract(input: { html: string; url: string; name: string }) {
    this.calls.push(input);
    return Promise.resolve(this.result);
  }
}

describe("DocImporter", () => {
  it("uses provided fetcher and extractor and saves the doc", async () => {
    const fetcher = new MockFetcher("<html><body><h1>Title</h1><pre><code>code();</code></pre></body></html>");
    const extractor = new MockExtractor({
      title: "Mock Title",
      summary: "Mock summary",
      content: "Content from extractor\n```js\ncode();\n```",
    });

    const importer = new DefaultDocImporter(fetcher, extractor);
    const imported = await importer.importDoc({ name: "My Doc", url: "https://example.com/path" });

    expect(fetcher.calls).toEqual(["https://example.com/path"]);
    expect(extractor.calls).toHaveLength(1);
    expect(imported.title).toBe("Mock Title");
    expect(imported.content).toContain("code();");
  });
});
