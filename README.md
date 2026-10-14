# Silver Sprint

Java Silver SE 17 Drill。今回の実装は教材データの土台と起動確認画面のみ。

## 開発

Node.js 24系で確認。依存バージョンは `package-lock.json` に固定。

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
npm run preview
```

開発サーバーの `/silver-sprint/` を開くと、問題数・用語数・整合性検証結果が表示される。
検証エラー時は各エラーの `path` と `message` を画面で確認できる。
`npm test` は単発実行、`npm run test:watch` は監視実行。

## 構成

```text
src/
├ app/
│  ├ App.tsx
│  └ App.module.css
├ data/
│  ├ types.ts
│  ├ helpers.ts
│  ├ questions.ts
│  ├ glossary.ts
│  ├ validate.ts
│  └ validate.test.ts
├ styles/
│  └ global.css
└ main.tsx
```

## 教材の記述

- `Question` の `prompt` は text / code、`explanation` は text / code / steps / comparison。
- `answer` と文章内の要素は `InlineNode[]`。text / code / glossary を組み合わせる。
- `text("文章")`、`code("x++")`、`term("localVariable", "ローカル変数")` でInlineを記述する。`code()` はInline用で、CodeBlockは直接記述する。
- 比較表は `columns` の順序で表示する想定。各行の `cells` は列keyで対応づける。
- 用語IDは `glossary` オブジェクトのkeyだけで管理する。
- 問題と用語は `satisfies` で型チェックする。

`Question.category` はその問題で主に何を問うかを表す単一値。
A = 概念理解、B = 実行順・状態遷移、C = Java固有ルール、D = API・語彙として分類する。
サンプルもこの分類に合わせているが、A〜D全体の正式な問題体系はまだ整備していない。

`constructor` という用語IDはObjectの同名プロパティと重なり、辞書全体の
`satisfies GlossaryDictionary` だけでは内部のBlockの `type` が文字列に広がる。
この項目には追加で `satisfies GlossaryEntry` を指定し、型チェックを維持している。

新しいBlockを追加するときは、型定義とvalidatorの `switch` を更新する。
validatorは網羅性を型チェックするため、未対応のBlockを追加するとコンパイルエラーになる。

## 整合性検証

`validateContent(questions, glossary)` は `{ valid, issues }` を返す。例外で最初のエラーだけを報告せず、すべての問題を収集する。

- Question ID重複。
- prompt / answer / explanation、用語short / detailのGlossary参照先。
- stepsの各項目、comparisonの全セル内にあるGlossary参照先。
- comparisonの列key重複、必要なcellの不足、列にない余分なcell。
- 同一comparison内の行ID重複。異なるcomparison同士で同じ行IDを使うことは許可する。
- 用語の `related` の参照先。

エラー位置の例：`questions[4].explanation[1].rows[0].cells["target"][1].glossaryId`。
辞書keyとcell keyは自前のプロパティとして存在することを確認し、継承されたオブジェクトのプロパティは認めない。

このvalidatorはTypeScriptで定義済みの教材同士の整合性を検証するもの。
外部JSONなどの不明な値の型・形状を検証するParserではない。
`npm test` には実際のサンプルデータの検証を含めている。ビルドは型チェックとViteビルドを実行し、整合性テストは `npm test` で別途実行する。

## サンプル教材の根拠

Java SE 17の言語仕様に合わせて記述。

- [変数の初期値（JLS 4.12.5）](https://docs.oracle.com/javase/specs/jls/se17/html/jls-4.html#jls-4.12.5)
- [参照型変数（JLS 4.12.2）](https://docs.oracle.com/javase/specs/jls/se17/html/jls-4.html#jls-4.12.2)
- [後置インクリメント（JLS 15.14.2）](https://docs.oracle.com/javase/specs/jls/se17/html/jls-15.html#jls-15.14.2)
- [クラス継承・実装（JLS 8.1.4 / 8.1.5）](https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html#jls-8.1.4)
- [インタフェース継承（JLS 9.1.3）](https://docs.oracle.com/javase/specs/jls/se17/html/jls-9.html#jls-9.1.3)
- [コンストラクタ本体・明示的呼び出し（JLS 8.8.7 / 8.8.7.1）](https://docs.oracle.com/javase/specs/jls/se17/html/jls-8.html#jls-8.8.7)

## 次工程で確認する点

- A〜Dの分類に沿ったコース内容・問題の網羅性は今後整備する。
- `timeWeight` の値域・基準時間との関係は未定義。サンプルでは複合問題に `1.5` を設定したが、validatorで数値範囲は検証していない。
- 空の配列・空文字列は今回の検証対象外。描画を実装するときに必要な制約を決める。
- 用語間の相互参照は許可している。detailを展開するUIでは再帰的に用語を自動展開するかどうかを決める。

## GitHub Pages

`vite.config.ts` の `base` はリポジトリ名に合わせて `/silver-sprint/`。
`npm run build` が生成する `dist/` を公開対象にできる。
今回、公開・デプロイ設定・React Router・ドリル・タイマー・戦績・永続化は実装していない。
