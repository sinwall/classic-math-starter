import dotenv from "dotenv";
dotenv.config({path: ".env.local"});
const TOKEN = process.env.GITHUB_PAT;  //
if (!TOKEN) {
  throw new Error("No github token found.");
}

interface GithubDirEntry {
  name: string;
  type: string;
}

interface FetchFileResult {
  ok: boolean;
  content: string;
}

interface FetchDirResult {
  ok: boolean;
  content: GithubDirEntry[];
}

function isGithubDirEntry(value: unknown): value is GithubDirEntry {
  return (
    typeof value === "object" && value !== null &&
    "name" in value && typeof value.name === "string" &&
    "type" in value && typeof value.type === "string"
  );
}

function fetchContents(user: string, repo: string, path: string): Promise<Response> {
  // https://docs.github.com/en/rest/repos/contents?apiVersion=2026-03-10#get-repository-content
  return fetch(
    `https://api.github.com/repos/${user}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github.raw+json",
      },
    }
  );
}

// https://docs.github.com/en/rest/repos/contents?apiVersion=2026-03-10#get-repository-content--status-codes
// 실패(!res.ok)는 예외 대신 ok: false로 알린다.
async function fetchGithubFile(user: string, repo: string, path: string): Promise<FetchFileResult> {
  const res = await fetchContents(user, repo, path);
  if (res.ok) {
    return { ok: true, content: await res.text() };
  } else {
    return { ok: false, content: "" };
  }
}

async function fetchGithubDir(user: string, repo: string, path: string): Promise<FetchDirResult> {
  const res = await fetchContents(user, repo, path);
  if (res.ok) {
    const json: unknown = await res.json();
    if (!Array.isArray(json) || !json.every(isGithubDirEntry)) {
      throw new Error(`Unexpected directory listing for ${path}.`);
    }
    return { ok: true, content: json };
  } else {
    return { ok: false, content: [] };
  }
}

export {
  fetchGithubFile,
  fetchGithubDir,
  type GithubDirEntry,
  type FetchFileResult,
  type FetchDirResult,
};
