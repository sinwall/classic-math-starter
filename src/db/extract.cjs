'use strict';
const assert = require('node:assert');
const fs = require('fs');
const { DOMParser } = require('@xmldom/xmldom');
const xpath = require('xpath');
const {fetchGithub} = require('./github.js')

const TEI_NS = "http://www.tei-c.org/ns/1.0";
const XML_NS = "http://www.w3.org/XML/1998/namespace";
const GITHUB_ID = "sinwall";
const GITHUB_REPO = "classics_in_mathematics_texts";

// TEI 네임스페이스를 인식하는 xpath 셀렉터
const select = xpath.useNamespaces({ tei: TEI_NS, xml: XML_NS });

/** xml:id 속성값을 네임스페이스 인지 방식으로 안전하게 읽는다. */
function getXmlId(el) {
  return el.getAttributeNS(XML_NS, 'id') || el.getAttribute('xml:id') || null;
}

const LAYER_TYPE_MAP = new Map([
  ["ELH", "GRK"], 
  ["KOR", "KOR"],
  ["MAT", "Math"],
  // ["CMT", "Comment"]
]);

function extractTEIMetadata(xmlString) {
  const doc = new DOMParser({
    onError: (level, msg) => {
      if (level === 'error' || level === 'fatalError') {
        throw new Error(`XML ${level}: ${msg}`);
      }
    },
  }).parseFromString(xmlString, 'text/xml');

  // 1) 제목: <title> 중 xml:id를 가진 것 (예: type="main")
  const book_title = select("//tei:titleStmt/tei:title//tei:title[@xml:id and @type=\"main\"]", doc)[0];
  assert(getXmlId(book_title).startsWith("title-"), "Unexpected title id format: ", book_title);
  const book_title_id = getXmlId(book_title).substring("title-".length);
  const book_title_name = book_title.textContent.trim();

  // 2) role="original"인 저자
  const author = select('//tei:titleStmt/tei:author[@role=\"original\"]', doc)[0];
  assert(getXmlId(author).startsWith("author-"), "Unexpected author id format: ", author);
  const author_id = getXmlId(author).substring("author-".length);
  const author_name = author.textContent.trim();

  // console.log(book_title_id, book_title_name, author_id, author_name)
  // 3) 각 section 
  const sections = select('//tei:div[@type="section"]', doc);
  const sections_id = sections.map(getXmlId);
  assert(sections_id.every(id => id.startsWith("section-")), "Unexpected section id format: ", sections_id);
  const n_sections = sections.length;

  const basic_data = {
    book_title_id,
    book_title_name, 
    author_id,
    author_name,
    section_id_name_map: new Map()
  };
  const sections_data = {
    id: Array.from({ length: n_sections }, (_, i) => i),

    book_title_id: Array(n_sections).fill(book_title_id), 
    book_title_name: Array(n_sections).fill(book_title_name),

    author_id: Array(n_sections).fill(author_id), 
    author_name: Array(n_sections).fill(author_name), 

    section_id: sections.map((el) => (getXmlId(el).substring("section-".length))),
    section_name: sections.map((el) => (el.getAttribute("n"))),

    has_layer_ELH: sections.map((el) => Math.min(1,select(".//tei:div[@type=\"layer\" and @n=\"ELH\"]", el).length) ),
    has_layer_KOR: sections.map((el) => Math.min(1,select(".//tei:div[@type=\"layer\" and @n=\"KOR\"]", el).length) ),

    has_layer_MAT: Array(n_sections).fill(0), 

    image_names: Array(n_sections).fill(""),
  };
  const paragraphs_data = {
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
  for (let el of sections) {
    for (let layer of select('./tei:div[@type="layer"]', el)) {
      const cumsz = paragraphs_data.id.length;
      const paragraphs = select('./tei:p', layer);
      const layer_type_id = layer.getAttribute("n");
      if (!LAYER_TYPE_MAP.has(layer_type_id)) { 
        continue;
      }
      const layer_type_name = LAYER_TYPE_MAP.get(layer_type_id);

      paragraphs_data.id.push(...Array.from({ length: paragraphs.length }, (_, i) => cumsz+i));

      paragraphs_data.book_title_id.push(...Array(paragraphs.length).fill(book_title_id));
      paragraphs_data.book_title_name.push(...Array(paragraphs.length).fill(book_title_name));

      paragraphs_data.author_id.push(...Array(paragraphs.length).fill(author_id));
      paragraphs_data.author_name.push(...Array(paragraphs.length).fill(author_name));

      paragraphs_data.section_id.push(...Array(paragraphs.length).fill(getXmlId(el).substring("section-".length)));
      paragraphs_data.section_name.push(...Array(paragraphs.length).fill(el.getAttribute("n")));

      paragraphs_data.paragraph_no.push(...Array.from({ length: paragraphs.length }, (_, i) => i));

      paragraphs_data.layer_type_id.push(...Array(paragraphs.length).fill(layer_type_id));
      paragraphs_data.layer_type_name.push(...Array(paragraphs.length).fill(layer_type_name));

      paragraphs_data.content.push(...paragraphs.map((p) => p.textContent.trim()));

      // basic_data.section_id_name_map.set(book_title_id) = book_title_name;
      // basic_data.section_id_name_map.set(author_id) = author_name;
      basic_data.section_id_name_map.set(getXmlId(el).substring("section-".length), el.getAttribute("n"));
    }
  }

  return {sections_data, paragraphs_data, basic_data};
}

function rearrangeImageInfo(image_name_list, metadata_TEI) {
  let image_names = Array(metadata_TEI.id.length).fill("");
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

function stripLatexComments(text) {
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

function findMatchingBrace(str, startIndex) {
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

function parseBraceArgument(str, afterCommandIndex) {
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

function findSectionBlocks(text) {
  const blocks = [];
  const beginRe = new RegExp(`\\\\begin\\{${SECTION_ENVIRONMENT_NAME}\\}`, 'g');
  let match;
 
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

function extractParagraphList(body) {
  const results = [];
  const cmdRe = new RegExp(`\\\\${PARAGRAPH_COMMAND_NAME}`, 'g');
  let match;
 
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

function extractParagraphBySection(texContent) {
  const blocks = findSectionBlocks(texContent);
  const result = [];
 
  for (const { id, body } of blocks) {
    result.push({ id, paragraphs: extractParagraphList(body) });
  }
 
  return result;
}

function writeTSV(object, keys, filePath) {
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
];
const PARAGRAPH_KEYS = [
  'id', 'book_title_id', 'book_title_name', 'author_id', 'author_name',
  'section_id', 'section_name', 'layer_type_id', 'layer_type_name', 'paragraph_no',
  'content'
];

// 테이블·열 이름은 SQL에서 파라미터로 넘길 수 없다. 그래서 여기 적힌 이름만 허용해서
// 이름이 곧 SQL에 들어가도 안전하게 한다. 값은 아래에서 항상 파라미터($1, $2, ...)로만 넘긴다.
// (schema.sql의 열 타입과 맞춰 둔다.)
const TABLE_SPECS = {
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

async function connectNeon() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL_UNPOOLED (또는 DATABASE_URL) 환경변수가 설정되어 있지 않습니다.');
  }
  const { Client } = require('pg'); // --tsv 모드에서는 pg가 없어도 되도록 필요할 때만 불러온다
  const db = new Client({ connectionString: url });
  await db.connect();
  return db;
}

/**
 * writeTSV의 대체. 같은 모양의 열 단위 object를 받아 tableName 테이블에 적재한다.
 * 기존 행은 지우지 않고 INSERT만 한다. 중복을 피하려면 호출하는 쪽(main)이 먼저 DELETE해야 한다.
 * 여러 책의 행이 섞여 있어도 된다.
 * 트랜잭션은 호출하는 쪽(main)이 BEGIN/COMMIT으로 감싼다.
 * @returns {Promise<number>} 적재한 행 수
 */
async function writeNeon(db, object, keys, tableName) {
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

async function main() {
  const book_title = "on-spirals";
  const {ok: existsMainXML, content: mainXML} = await fetchGithub(GITHUB_ID, GITHUB_REPO, `${book_title}/text.xml`, "file");
  if (!existsMainXML) {
    throw new Error(`Main XML file not found for book: ${book_title}`);
  }
  const { 
    sections_data: metadata_TEI, 
    paragraphs_data: paragraphs_TEI, 
    basic_data,
  } = extractTEIMetadata(mainXML);

  const { ok: existsImageFolder, content: image_name_list} = await fetchGithub(GITHUB_ID, GITHUB_REPO, `${book_title}/images`, "dir");
  if (existsImageFolder) {
    metadata_TEI.image_names = rearrangeImageInfo(
      image_name_list.filter((item) => (item["type"] === "file")).map(item => item["name"]), 
      metadata_TEI
    );
  }
  const { ok: existsModern, content: modernTeX } = await fetchGithub(GITHUB_ID, GITHUB_REPO, `${book_title}/modern.tex`, "file");
  if (existsModern) {
    for (let {id:sectionId, paragraphs: paragraphList} of extractParagraphBySection(stripLatexComments(modernTeX))) {
      for (let i = 0; i < metadata_TEI.section_id.length; i++) {
        if (metadata_TEI.section_id[i] === sectionId) {
          metadata_TEI.has_layer_MAT[i] = paragraphList.length > 0 ? 1 : 0;

          const baseNo = paragraphs_TEI.id.length;
          paragraphs_TEI.id.push(...Array.from({ length: paragraphList.length }, (_, i) => baseNo + i));

          paragraphs_TEI.author_id.push(...Array(paragraphList.length).fill(basic_data.author_id));
          paragraphs_TEI.author_name.push(...Array(paragraphList.length).fill(basic_data.author_name));
          
          paragraphs_TEI.book_title_id.push(...Array(paragraphList.length).fill(basic_data.book_title_id));
          paragraphs_TEI.book_title_name.push(...Array(paragraphList.length).fill(basic_data.book_title_name));

          paragraphs_TEI.section_id.push(...Array(paragraphList.length).fill(sectionId));
          paragraphs_TEI.section_name.push(...Array(paragraphList.length).fill(basic_data.section_id_name_map.get(sectionId)));

          paragraphs_TEI.paragraph_no.push(...Array.from({ length: paragraphList.length }, (_, i) => i));
          
          paragraphs_TEI.layer_type_id.push(...Array(paragraphList.length).fill('MAT'));
          paragraphs_TEI.layer_type_name.push(...Array(paragraphList.length).fill('Math'));

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

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { main, writeTSV, writeNeon, connectNeon, SECTION_KEYS, PARAGRAPH_KEYS };