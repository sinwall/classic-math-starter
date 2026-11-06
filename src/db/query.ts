import dotenv from "dotenv";
import pg, { type QueryResultRow } from "pg";
dotenv.config({path: ".env.local"});

// Next 개발 서버는 파일을 고칠 때마다 모듈을 다시 불러온다. 모듈 변수에 풀을 두면 그때마다 새 풀이 생기므로,
// 다시 불러와도 남아 있는 globalThis에 풀을 보관한다.
const globalForPool = globalThis as unknown as { pgPool?: pg.Pool };

// 풀은 처음 필요할 때 한 번만 만들어 계속 재사용한다.
function getPool(): pg.Pool {
  if (!globalForPool.pgPool) {
    const url = process.env.STORAGE_DATABASE_URL;
    if (!url) {
      throw new Error('STORAGE_DATABASE_URL 환경변수가 설정되어 있지 않습니다.');
    }
    globalForPool.pgPool = new pg.Pool({ connectionString: url });
  }
  return globalForPool.pgPool;
}

/**
 * Neon(Postgres)의 풀링 연결로 질의문을 실행하고 조회된 행들을 반환한다.
 * 풀링 주소(STORAGE_DATABASE_URL)는 연결을 질의마다 바꿔 쓸 수 있어서 search_path 같은 세션 설정이 유지되지 않는다.
 * 그러니 테이블 이름에는 스키마를 붙인다. (예: texts.sections)
 * 값은 SQL 문자열에 직접 넣지 말고 values로 넘긴다. (text 안에서는 $1, $2, ... 로 참조)
 * @returns 조회된 행들. 열 이름은 DB 쪽 이름 그대로(소문자: has_layer_elh)다.
 */
async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []): Promise<T[]> {
  const result = await getPool().query<T>(text, values);
  return result.rows;
}

/**
 * 풀을 닫는다. node로 직접 실행하는 스크립트는 풀이 열려 있으면 프로세스가 끝나지 않으므로 마지막에 부른다.
 * 닫은 뒤에 query를 다시 부르면 새 풀이 만들어진다.
 */
async function closePool(): Promise<void> {
  const current = globalForPool.pgPool;
  globalForPool.pgPool = undefined;
  await current?.end();
}

export {query, closePool};
