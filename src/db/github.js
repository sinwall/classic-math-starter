import dotenv from "dotenv";
dotenv.config({path: ".env.local"});
const TOKEN = process.env.GITHUB_PAT;
if (!TOKEN) {
  throw new Error("No github token found.");
}

async function fetchGithub(user, repo, path, fileOrDir) {
  // https://docs.github.com/en/rest/repos/contents?apiVersion=2026-03-10#get-repository-content
  if (!(fileOrDir === "file" || fileOrDir === "dir")) {
    throw new Error(`Invalid fileOrDir: ${fileOrDir}. Must be "file" or "dir".`);
  }
  const res = await fetch(
    `https://api.github.com/repos/${user}/${repo}/contents/${path}`,
    {
      headers: {
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github.raw+json",
      },
    }
  );
  // https://docs.github.com/en/rest/repos/contents?apiVersion=2026-03-10#get-repository-content--status-codes
  // if (!res.ok) {
  //   throw new Error(`Failed to fetch file: ${res.status} ${res.statusText}`);
  // }
  if (res.ok) {
    return { ok: true, content: await (fileOrDir === "file" ? res.text() : res.json()) };
  } else {
    return { ok: false, content: fileOrDir === "file" ? "" : [] };
  }
}

export {fetchGithub};