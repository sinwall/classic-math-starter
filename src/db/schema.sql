-- psql "$DATABASE_URL_UNPOOLED" -f schema.sql
CREATE SCHEMA IF NOT EXISTS texts;

CREATE TABLE IF NOT EXISTS texts.books (
  id                integer  GENERATED ALWAYS AS IDENTITY, -- 연번 (자동 증가)
  author_id         text     NOT NULL,
  author_name       text     NOT NULL,
  book_title_id     text     NOT NULL,
  book_title_name   text     NOT NULL,
  default_section_id text    NOT NULL,
  public            smallint NOT NULL CHECK (public IN (0, 1)),
  available         smallint NOT NULL CHECK (available IN (0, 1)),
  complete          smallint NOT NULL CHECK (complete IN (0, 1)),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS texts.sections (
  id             integer  GENERATED ALWAYS AS IDENTITY,
  book_title_id  text     NOT NULL,
  book_title_name text    NOT NULL,
  author_id      text     NOT NULL,
  author_name    text     NOT NULL,
  section_id     text     NOT NULL,
  section_name   text     NOT NULL,
  has_layer_elh  smallint NOT NULL CHECK (has_layer_elh IN (0, 1)),
  has_layer_kor  smallint NOT NULL CHECK (has_layer_kor IN (0, 1)),
  has_layer_mat  smallint NOT NULL CHECK (has_layer_mat IN (0, 1)),
  image_names    text     NOT NULL DEFAULT '', -- ';'로 이은 파일명 (TSV와 동일)
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS texts.paragraphs (
  id              integer GENERATED ALWAYS AS IDENTITY,
  book_title_id   text    NOT NULL,
  book_title_name text    NOT NULL,
  author_id       text    NOT NULL,
  author_name     text    NOT NULL,
  section_id      text    NOT NULL,
  section_name    text    NOT NULL,
  layer_type_id   text    NOT NULL,           -- ELH / KOR / MAT
  layer_type_name text    NOT NULL,           -- GRK / KOR / Math
  paragraph_no    integer NOT NULL,           -- 섹션·레이어 안에서의 순번 (0부터)
  content         text    NOT NULL,
  PRIMARY KEY (id)
);