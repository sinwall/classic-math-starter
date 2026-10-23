-- psql "$DATABASE_URL_UNPOOLED" -f schema.sql
CREATE SCHEMA IF NOT EXISTS texts;

CREATE TABLE IF NOT EXISTS texts.sections (
  id             integer  NOT NULL, 
  book_title_id  text     NOT NULL,
  book_title_name text    NOT NULL,
  author_id      text     NOT NULL,
  author_name    text     NOT NULL,
  section_id     text     NOT NULL,
  section_name   text     NOT NULL,
  has_layer_elh  smallint NOT NULL, 
  has_layer_kor  smallint NOT NULL,
  has_layer_mat  smallint NOT NULL,
  image_names    text     NOT NULL DEFAULT '', -- ';'로 이은 파일명 (TSV와 동일)
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS texts.paragraphs (
  id              integer NOT NULL, 
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