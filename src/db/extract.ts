import assert from 'node:assert';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DOMParser } from '@xmldom/xmldom';
import xpath from 'xpath';
import type { Client } from 'pg';
import { fetchGithubFile, fetchGithubDir } from './github.ts';

const TEI_NS = "http://www.tei-c.org/ns/1.0";
const XML_NS = "http://www.w3.org/XML/1998/namespace";
const GITHUB_ID = "sinwall";
const GITHUB_REPO = "classics_in_mathematics_texts";

type Column = string | number | null;

interface SectionsData {
  id: number[];
  book_title_id: string[];
  book_title_name: string[];
  author_id: string[];
  author_name: string[];
  section_id: string[];
  section_name: (string | null)[];
  has_layer_ELH: number[];
  has_layer_KOR: number[];
  has_layer_MAT: number[];
  image_names: string[];
}

interface ParagraphsData {
  id: number[];
  book_title_id: string[];
  book_title_name: string[];
  author_id: string[];
  author_name: string[];
  section_id: string[];
  section_name: (string | null)[];
  paragraph_no: number[];
  layer_type_id: string[];
  layer_type_name: string[];
  content: string[];
}

interface BasicData {
  book_title_id: string;
  book_title_name: string;
  author_id: string;
  author_name: string;
  section_id_name_map: Map<string, string | null>;
}

// TEI 네임스페이스를 인식하는 xpath 셀렉터
const select = xpath.useNamespaces({ tei: TEI_NS, xml: XML_NS });

function isElement(node: unknown): node is Element {
  return typeof node === 'object' && node !== null && 'nodeType' in node && node.nodeType === 1;
}

/** xmldom의 노드 타입은 DOM lib의 Node와 달라서, 런타임 검사를 거쳐 xpath가 받는 Node로 좁힌다. */
function toXPathNode(value: unknown): Node {
  if (typeof value !== 'object' || value === null || !('nodeType' in value) || typeof value.nodeType !== 'number') {
    throw new Error('Expected an XML node.');
  }
  return value as Node;
}

/** xpath 결과가 노드 집합이고 모두 Element인지 확인하고 돌려준다. */
function selectElements(expression: string, node: Node): Element[] {
  const result = select(expression, node);
  if (!Array.isArray(result)) {
    throw new Error(`XPath did not return a node set: ${expression}`);
  }
  return result.map((item) => {
    if (!isElement(item)) {
      throw new Error(`XPath returned a non-element node: ${expression}`);
    }
    return item;
  });
}

function selectFirstElement(expression: string, node: Node): Element {
  const [first] = selectElements(expression, node);
  if (!first) {
    throw new Error(`No element matches XPath: ${expression}`);
  }
  return first;
}

/** xml:id 속성값을 네임스페이스 인지 방식으로 안전하게 읽는다. */
function getXmlId(el: Element): string | null {
  return el.getAttributeNS(XML_NS, 'id') || el.getAttribute('xml:id') || null;
}

/** xml:id가 prefix로 시작하는지 확인하고 prefix를 뗀 나머지를 돌려준다. */
function stripXmlIdPrefix(el: Element, prefix: string, what: string): string {
  const id = getXmlId(el);
  assert(id !== null && id.startsWith(prefix), `Unexpected ${what} id format: ${id}`);
  return id.substring(prefix.length);
}

function repeat<T>(value: T, n: number): T[] {
  return Array.from({ length: n }, () => value);
}

function range(n: number, start = 0): number[] {
  return Array.from({ length: n }, (_, i) => start + i);
}

const LAYER_TYPE_MAP = new Map([
  ["ELH", "GRK"],
  ["KOR", "KOR"],
  ["MAT", "Math"],
  // ["CMT", "Comment"]
]);

function extractTEIMetadata(xmlString: string) {
  const doc = new DOMParser({
    onError: (level, msg) => {
      if (level === 'error' || level === 'fatalError') {
        throw new Error(`XML ${level}: ${msg}`);
      }
    },
  }).parseFromString(xmlString, 'text/xml');
  const root = toXPathNode(doc);

  // 1) 제목: <title> 중 xml:id를 가진 것 (예: type="main")
  const book_title = selectFirstElement("//tei:titleStmt/tei:title//tei:title[@xml:id and @type=\"main\"]", root);
  const book_title_id = stripXmlIdPrefix(book_title, "title-", "title");
  const book_title_name = (book_title.textContent ?? '').trim();

  // 2) role="original"인 저자
  const author = selectFirstElement('//tei:titleStmt/tei:author[@role=\"original\"]', root);
  const author_id = stripXmlIdPrefix(author, "author-", "author");
  const author_name = (author.textContent ?? '').trim();

  // console.log(book_title_id, book_title_name, author_id, author_name)
  // 3) 각 section
  const sections = selectElements('//tei:div[@type="section"]', root);
  const sections_id = sections.map((el) => stripXmlIdPrefix(el, "section-", "section"));
  const n_sections = sections.length;

  const basic_data: BasicData = {
    book_title_id,
    book_title_name,
    author_id,
    author_name,
    section_id_name_map: new Map()
  };
  const sections_data: SectionsData = {
    id: range(n_sections),

    book_title_id: repeat(book_title_id, n_sections),
    book_title_name: repeat(book_title_name, n_sections),

    author_id: repeat(author_id, n_sections),
    author_name: repeat(author_name, n_sections),

    section_id: sections_id,
    section_name: sections.map((el) => (el.getAttribute("n"))),

    has_layer_ELH: sections.map((el) => Math.min(1, selectElements(".//tei:div[@type=\"layer\" and @n=\"ELH\"]", el).length) ),
    has_layer_KOR: sections.map((el) => Math.min(1, selectElements(".//tei:div[@type=\"layer\" and @n=\"KOR\"]", el).length) ),

    has_layer_MAT: repeat(0, n_sections),

    image_names: repeat("", n_sections),
  };
  const paragraphs_data: ParagraphsData = {
    id: [],

    book_title_id: [],
    book_title_name: [],

    author_id: [],
    author_name: [],

    section_id: [],
    section_name: [],

    paragraph_no: [],

    layer_type_id: [],
    layer_type_name: [],

    content: []
  };
  for (const [sectionIndex, el] of sections.entries()) {
    for (const layer of selectElements('./tei:div[@type="layer"]', el)) {
      const cumsz = paragraphs_data.id.length;
      const paragraphs = selectElements('./tei:p', layer);
      const layer_type_id = layer.getAttribute("n");
      const layer_type_name = layer_type_id === null ? undefined : LAYER_TYPE_MAP.get(layer_type_id);
      if (layer_type_id === null || layer_type_name === undefined) {
        continue;
      }

      paragraphs_data.id.push(...range(paragraphs.length, cumsz));

      paragraphs_data.book_title_id.push(...repeat(book_title_id, paragraphs.length));
      paragraphs_data.book_title_name.push(...repeat(book_title_name, paragraphs.length));

      paragraphs_data.author_id.push(...repeat(author_id, paragraphs.length));
      paragraphs_data.author_name.push(...repeat(author_name, paragraphs.length));

      paragraphs_data.section_id.push(...repeat(sections_id[sectionIndex], paragraphs.length));
      paragraphs_data.section_name.push(...repeat(el.getAttribute("n"), paragraphs.length));

      paragraphs_data.paragraph_no.push(...range(paragraphs.length));

      paragraphs_data.layer_type_id.push(...repeat(layer_type_id, paragraphs.length));
      paragraphs_data.layer_type_name.push(...repeat(layer_type_name, paragraphs.length));

      paragraphs_data.content.push(...paragraphs.map((p) => (p.textContent ?? '').trim()));

      // basic_data.section_id_name_map.set(book_title_id) = book_title_name;
      // basic_data.section_id_name_map.set(author_id) = author_name;
      basic_data.section_id_name_map.set(sections_id[sectionIndex], el.getAttribute("n"));
    }
  }

  return {sections_data, paragraphs_data, basic_data};
}

function rearrangeImageInfo(image_name_list: string[], metadata_TEI: SectionsData): string[] {
  const image_names: string[] = repeat("", metadata_TEI.id.length);
  for (let i = 0; i < metadata_TEI.section_id.length; i++) {
    const title_id = metadata_TEI.section_id[i];
    image_names[i] = image_name_list.filter((image_name) => image_name.startsWith(title_id)).join(";");
  }
  return image_names;
}

const TITLE_COMMAND_NAME = "whatIsTitle";
const AUTHOR_COMMAND_NAME = "whoIsAuthor";
const SECTION_ENVIRONMENT_NAME = "sectio";
const PARAGRAPH_COMMAND_NAME = "paragraphus";

function stripLatexComments(text: string): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    // 백슬래시 다음 문자는 이스케이프된 것으로 보고 그대로 복사 (\%, \\, \{ 등)
    if (ch === '\\' && i + 1 < text.length) {
      result += ch + text[i + 1];
      i += 2;
      continue;
    }

    // 이스케이프되지 않은 '%' → 개행문자까지(개행문자 포함) 통째로 건너뜀
    if (ch === '%') {
      while (i < text.length && text[i] !== '\n') {
        i++;
      }
      if (i < text.length) {
        i++; // 개행문자(\n)까지 함께 삼킴
      }
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}

function findMatchingBrace(str: string, startIndex: number): number {
  if (str[startIndex] !== '{') {
    throw new Error(`Expected '{' at index ${startIndex}, got '${str[startIndex]}'`);
  }
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    const ch = str[i];
    // 백슬래시로 이스케이프된 중괄호(\{ 또는 \})는 건너뛴다.
    if (ch === '\\' && (str[i + 1] === '{' || str[i + 1] === '}')) {
      i++; // 다음 문자(이스케이프된 중괄호)까지 함께 건너뜀
      continue;
    }

    if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }

  return -1; // 짝이 맞지 않음
}

function parseBraceArgument(str: string, afterCommandIndex: number): { content: string; endIndex: number } {
  let i = afterCommandIndex;

  // 명령어와 '{' 사이의 공백/개행 허용
  while (i < str.length && /\s/.test(str[i])) {
    i++;
  }

  if (str[i] !== '{') {
    return { content: "", endIndex: i };
  }

  const closeIndex = findMatchingBrace(str, i);
  if (closeIndex === -1) {
    return { content: "", endIndex: i };
  }

  const content = str.slice(i + 1, closeIndex);
  return { content, endIndex: closeIndex };
}

function findSectionBlocks(text: string): { id: string; body: string }[] {
  const blocks: { id: string; body: string }[] = [];
  const beginRe = new RegExp(`\\\\begin\\{${SECTION_ENVIRONMENT_NAME}\\}`, 'g');
  let match: RegExpExecArray | null;

  while ((match = beginRe.exec(text)) !== null) {
    const beginTagEnd = match.index + match[0].length;

    // \begin{sectio} 바로 뒤에 오는 {id} 인자 파싱
    const idArg = parseBraceArgument(text, beginTagEnd);
    if (!idArg) {
      throw new Error(`\\begin{${SECTION_ENVIRONMENT_NAME}} 뒤에서 id 인자를 찾지 못했습니다 (index ${match.index}).`);
    }

    const id = idArg.content.trim();
    const bodyStart = idArg.endIndex + 1;

    // 대응하는 \end{sectio} 찾기
    const endRe = new RegExp(`\\\\end\\{${SECTION_ENVIRONMENT_NAME}\\}`, 'g');
    endRe.lastIndex = bodyStart;
    const endMatch = endRe.exec(text);

    if (!endMatch) {
      throw new Error(`\\end{${SECTION_ENVIRONMENT_NAME}}를 찾지 못했습니다 (index ${bodyStart}).`);
    }

    const body = text.slice(bodyStart, endMatch.index);
    blocks.push({ id, body });
    // 다음 \begin{sectio} 탐색은 이 \end{sectio} 이후부터 재개
    beginRe.lastIndex = endMatch.index + endMatch[0].length;
  }
  return blocks;
}

function extractParagraphList(body: string): string[] {
  const results: string[] = [];
  const cmdRe = new RegExp(`\\\\${PARAGRAPH_COMMAND_NAME}`, 'g');
  let match: RegExpExecArray | null;

  while ((match = cmdRe.exec(body)) !== null) {
    const afterCmd = match.index + match[0].length;
    const arg = parseBraceArgument(body, afterCmd);

    if (!arg) {
      throw new Error(`\\paragraphus 뒤에서 {..} 인자를 찾지 못했습니다 (index ${match.index}).`);
    }
    results.push(
      arg.content.trim()
        .replace(/\\\s+/g, ' ') // \ 다음 공백 → 공백
        .replace(/~+/g, ' ')    // ~ → 공백
        .replace(/\\\n/g, ' ')   // \n → 공백
        .replace(/\s+/g, ' ')    // 연속 공백 → 공백
        .trim()
    );

    // 다음 탐색 위치를 이 인자 끝 이후로 이동
    cmdRe.lastIndex = arg.endIndex + 1;
  }
  return results;
}

function extractParagraphBySection(texContent: string): { id: string; paragraphs: string[] }[] {
  const blocks = findSectionBlocks(texContent);
  const result: { id: string; paragraphs: string[] }[] = [];

  for (const { id, body } of blocks) {
    result.push({ id, paragraphs: extractParagraphList(body) });
  }

  return result;
}

function writeTSV<K extends string>(object: Record<K, readonly Column[]>, keys: readonly K[], filePath: string): void {
  const header = keys.join('\t');
  const rows = object[keys[0]].map((_, i) => keys.map((key) => object[key][i]).join('\t'));
  const tsvContent = [header, ...rows].join('\n');
  fs.writeFileSync(filePath, tsvContent, 'utf-8');
}

// ---------------------------------------------------------------------------
// Neon(Postgres) 적재
// ---------------------------------------------------------------------------

const SECTION_KEYS = [
  'id', 'book_title_id', 'book_title_name', 'author_id', 'author_name',
  'section_id', 'section_name', 'has_layer_ELH', 'has_layer_KOR', 'has_layer_MAT',
  'image_names'
] as const satisfies readonly (keyof SectionsData)[];
const PARAGRAPH_KEYS = [
  'id', 'book_title_id', 'book_title_name', 'author_id', 'author_name',
  'section_id', 'section_name', 'layer_type_id', 'layer_type_name', 'paragraph_no',
  'content'
] as const satisfies readonly (keyof ParagraphsData)[];

type TableName = 'sections' | 'paragraphs';
type PgType = 'integer' | 'smallint' | 'text';

// 테이블·열 이름은 SQL에서 파라미터로 넘길 수 없다. 그래서 여기 적힌 이름만 허용해서
// 이름이 곧 SQL에 들어가도 안전하게 한다. 값은 아래에서 항상 파라미터($1, $2, ...)로만 넘긴다.
// (schema.sql의 열 타입과 맞춰 둔다.)
const TABLE_SPECS: Record<TableName, Record<string, PgType>> = {
  sections: {
    id: 'integer', book_title_id: 'text', book_title_name: 'text',
    author_id: 'text', author_name: 'text', section_id: 'text', section_name: 'text',
    has_layer_ELH: 'smallint', has_layer_KOR: 'smallint', has_layer_MAT: 'smallint',
    image_names: 'text',
  },
  paragraphs: {
    id: 'integer', book_title_id: 'text', book_title_name: 'text',
    author_id: 'text', author_name: 'text', section_id: 'text', section_name: 'text',
    layer_type_id: 'text', layer_type_name: 'text', paragraph_no: 'integer',
    content: 'text',
  },
};

async function connectNeon(): Promise<Client> {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL_UNPOOLED (또는 DATABASE_URL) 환경변수가 설정되어 있지 않습니다.');
  }
  const pg = await import('pg'); // --tsv 모드에서는 pg가 없어도 되도록 필요할 때만 불러온다
  const db = new pg.default.Client({ connectionString: url });
  await db.connect();
  return db;
}

/**
 * writeTSV의 대체. 같은 모양의 열 단위 object를 받아 tableName 테이블에 적재한다.
 * 기존 행은 지우지 않고 INSERT만 한다. 중복을 피하려면 호출하는 쪽(main)이 먼저 DELETE해야 한다.
 * 여러 책의 행이 섞여 있어도 된다.
 * 트랜잭션은 호출하는 쪽(main)이 BEGIN/COMMIT으로 감싼다.
 * @returns 적재한 행 수
 */
async function writeNeon<K extends string>(
  db: Client,
  object: Record<K, readonly Column[]>,
  keys: readonly K[],
  tableName: TableName,
): Promise<number> {
  const spec = TABLE_SPECS[tableName];
  if (!spec) throw new Error(`알 수 없는 테이블: ${tableName}`);
  for (const key of keys) {
    if (!(key in spec)) throw new Error(`${tableName} 테이블에 없는 열: ${key}`);
  }

  const nRows = object[keys[0]].length;
  if (nRows === 0) {
    // 가져오기 실패 등으로 빈 데이터가 오면 기존 데이터를 지우지 않고 멈춘다.
    throw new Error(`${tableName}: 적재할 행이 없습니다.`);
  }
  for (const key of keys) {
    if (object[key].length !== nRows) {
      throw new Error(`${tableName}: 열 '${key}'의 길이(${object[key].length})가 ${nRows}와 다릅니다.`);
    }
  }

  const table = `"${tableName}"`;
  // JS 쪽 키는 TSV 헤더 그대로(has_layer_ELH)지만, DB 열 이름은 Postgres 관례대로 소문자(has_layer_elh)다.
  // 그래야 나중에 SQL을 쓸 때 따옴표 없이 has_layer_elh라고 쓸 수 있다.
  const columns = keys.map((key) => `"${key.toLowerCase()}"`).join(', ');
  // 열마다 배열 하나를 파라미터로 넘기고 unnest로 행으로 펼친다. 행 수가 늘어도 파라미터는 열 수만큼이다.
  const arrays = keys.map((key, i) => `$${i + 1}::${spec[key]}[]`).join(', ');

  await db.query(
    `INSERT INTO ${table} (${columns}) SELECT * FROM unnest(${arrays})`,
    keys.map((key) => object[key]),
  );
  return nRows;
}

async function main(): Promise<number> {
  const book_title = "on-spirals";
  const {ok: existsMainXML, content: mainXML} = await fetchGithubFile(GITHUB_ID, GITHUB_REPO, `${book_title}/text.xml`);
  if (!existsMainXML) {
    throw new Error(`Main XML file not found for book: ${book_title}`);
  }
  const {
    sections_data: metadata_TEI,
    paragraphs_data: paragraphs_TEI,
    basic_data,
  } = extractTEIMetadata(mainXML);

  const { ok: existsImageFolder, content: image_name_list} = await fetchGithubDir(GITHUB_ID, GITHUB_REPO, `${book_title}/images`);
  if (existsImageFolder) {
    metadata_TEI.image_names = rearrangeImageInfo(
      image_name_list.filter((item) => (item.type === "file")).map(item => item.name),
      metadata_TEI
    );
  }
  const { ok: existsModern, content: modernTeX } = await fetchGithubFile(GITHUB_ID, GITHUB_REPO, `${book_title}/modern.tex`);
  if (existsModern) {
    for (const {id:sectionId, paragraphs: paragraphList} of extractParagraphBySection(stripLatexComments(modernTeX))) {
      for (let i = 0; i < metadata_TEI.section_id.length; i++) {
        if (metadata_TEI.section_id[i] === sectionId) {
          metadata_TEI.has_layer_MAT[i] = paragraphList.length > 0 ? 1 : 0;

          const baseNo = paragraphs_TEI.id.length;
          paragraphs_TEI.id.push(...range(paragraphList.length, baseNo));

          paragraphs_TEI.author_id.push(...repeat(basic_data.author_id, paragraphList.length));
          paragraphs_TEI.author_name.push(...repeat(basic_data.author_name, paragraphList.length));

          paragraphs_TEI.book_title_id.push(...repeat(basic_data.book_title_id, paragraphList.length));
          paragraphs_TEI.book_title_name.push(...repeat(basic_data.book_title_name, paragraphList.length));

          paragraphs_TEI.section_id.push(...repeat(sectionId, paragraphList.length));
          paragraphs_TEI.section_name.push(...repeat(basic_data.section_id_name_map.get(sectionId) ?? null, paragraphList.length));

          paragraphs_TEI.paragraph_no.push(...range(paragraphList.length));

          paragraphs_TEI.layer_type_id.push(...repeat('MAT', paragraphList.length));
          paragraphs_TEI.layer_type_name.push(...repeat('Math', paragraphList.length));

          paragraphs_TEI.content.push(...paragraphList);
          break;
        }
      }
    }
  }

  if (process.argv.includes('--tsv')) {
    // 디버깅·비교용: 예전처럼 TSV 파일로 저장한다.
    writeTSV(metadata_TEI, SECTION_KEYS, 'sections.tsv');
    writeTSV(paragraphs_TEI, PARAGRAPH_KEYS, 'paragraphs.tsv');
    return 0;
  }

  const db = await connectNeon();
  try {
    await db.query('BEGIN');
    await db.query('SET LOCAL search_path TO texts')
    await db.query('DELETE FROM paragraphs');
    await db.query('DELETE FROM sections');
    const nSections = await writeNeon(db, metadata_TEI, SECTION_KEYS, 'sections');
    const nParagraphs = await writeNeon(db, paragraphs_TEI, PARAGRAPH_KEYS, 'paragraphs');
    await db.query('COMMIT');
    console.log(`[${book_title}] sections ${nSections}행, paragraphs ${nParagraphs}행 적재 완료`);
  } catch (err) {
    await db.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await db.end();
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { main, writeTSV, writeNeon, connectNeon, SECTION_KEYS, PARAGRAPH_KEYS };
