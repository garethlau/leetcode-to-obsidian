const puppeteer = require("puppeteer");
const TurndownService = require("turndown");
const turndownService = new TurndownService();
const proc = require("child_process").spawn("pbcopy");

(async () => {
  const url = process.argv[2];
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  await page.waitForSelector(".description__24sA");

  const { titleHTML, questionContentHTML } = await page.evaluate(() => {
    const titleHTML = document.querySelectorAll('[data-cy="question-title"]')[0]
      .innerHTML;

    const questionContentHTML = document.querySelectorAll(
      ".question-content__JfgR"
    )[0].innerHTML;

    return {
      titleHTML,
      questionContentHTML,
    };
  });
  await browser.close();

  // replace codeblock
  turndownService.addRule("codeblock", {
    filter: "pre",
    replacement: function (content) {
      return "\n```\n" + content + "```\n";
    },
  });
  const taskDescription = turndownService.turndown(questionContentHTML);

  // custom format for obsidian
  const markdown =
    `# ${titleHTML}\n\n## Task\n${taskDescription}\n\n## Solution\n`
      .replace(/\*\*Input:\*\*/g, "Input:")
      .replace(/\*\*Output:\*\*/g, "Output:")
      .replace(/\*\*Explanation:\*\*/g, "Explanation:")
      .replace(/\\\[/g, "[")
      .replace(/\\\]/g, "]") +
    "```ts\n\n```" +
    "\n---\nTags:\n\n[[LeetCode]]";

  // copy to clipboard
  proc.stdin.write(markdown);
  proc.stdin.end();
})();
