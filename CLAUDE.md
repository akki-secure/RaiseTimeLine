# CLAUDE.md

RaiseTimeLine（X風タイムラインSNSアプリ、学習目的）のコーディング規約。

## バックエンド（MyBatis Mapper）

- SQLが複数行になる場合は、`@Select`/`@Insert`等のアノテーションではなく、XMLマッパー（`backend/src/main/resources/mapper/*Mapper.xml`）で管理する。
  - Javaの `*Mapper.java` インターフェースはメソッドシグネチャのみを定義し、アノテーションでSQLを書かない。
  - 1行に収まる単純なSQL（例: `SELECT COUNT(*) FROM ...` 程度）であっても、同じMapper内の他メソッドがXML管理なら統一のためXMLに寄せる。
- 共通で使う列リストや句（SELECT列、JOIN、GROUP BY等）は `<sql id="...">` として切り出し、`<include refid="...">` で再利用する（例: [PostMapper.xml](backend/src/main/resources/mapper/PostMapper.xml)）。
- 所有権チェックと更新/削除をアトミックに行うSQL（TOCTOU対策）など、設計意図が非自明なSQLにはXML内にコメントを残す。

## 命名規約（メソッド名）

- メソッド名は基本的に英語で命名する。
- 日本語メソッド名は、分岐が多い複雑なドメインロジックや、所有権チェックのアトミック処理など設計意図が非自明な処理で、英語名だと意図を要約しづらい場合の可読性向上手段として限定的に使う。単純な処理（1メソッド=1目的のCRUD操作など）には使わない。
