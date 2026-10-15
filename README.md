# Silver Sprint

Java Silver SE 17 Drill。教材データを問題一覧・用語一覧で参照し、用語の説明を確認できる学習アプリの土台。

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

HashRouterを使用し、`/silver-sprint/#/` はHome、`#/questions` は問題一覧、`#/glossary` は用語一覧。
Homeには問題数・用語数・整合性検証結果を表示する。検証エラー時は各エラーの `path` と `message` を確認でき、両一覧の教材は描画しない。
問題一覧はcategoryとtopic（categoryを変えたとき、新しいcategoryに存在しないtopicは自動で解除する）、用語一覧は検索とcategoryでAND条件の絞り込みができる。フィルタはページ内stateのみで、ページを離れるとリセットされる。
`npm test` は単発実行、`npm run test:watch` は監視実行。

## 構成

```text
src/
├ app/
│  ├ App.tsx
│  ├ App.module.css
│  ├ Layout.tsx
│  └ router.tsx
├ components/
│  ├ InlineRenderer.tsx
│  ├ InlineRenderer.module.css
│  ├ PlainInlineRenderer.tsx
│  ├ InvalidContentNotice.tsx
│  ├ QuestionPreview.tsx
│  ├ QuestionPreview.module.css
│  ├ renderers.test.tsx
│  └ blocks/
│     ├ BlockRenderer.tsx
│     ├ TextBlockView.tsx
│     ├ CodeBlockView.tsx
│     ├ StepsBlockView.tsx
│     ├ ComparisonBlockView.tsx
│     └ Blocks.module.css
├ drill/
│  ├ drillTypes.ts
│  ├ drillReducer.ts
│  ├ drillSelectors.ts
│  ├ tempo.ts
│  ├ useDrillTimer.ts
│  └ *.test.ts
├ stats/
│  ├ statsTypes.ts
│  ├ statsService.ts
│  ├ statsSelectors.ts
│  ├ statsFormatting.ts
│  ├ statsRepository.ts
│  ├ localStorageStatsRepository.ts
│  ├ useStats.ts
│  └ *.test.ts
├ pages/
│  ├ HomePage.tsx
│  ├ QuestionListPage.tsx
│  ├ GlossaryPage.tsx
│  ├ DrillPage.tsx（Drill / Review共用）
│  ├ drill/（TempoSelector・DrillTimerBar・RatingButtons）
│  ├ StatsPage.tsx
│  └ *.module.css / *.test.tsx
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

`src/pages/` にHome・Question List・Glossary List・Drill、`src/glossary/` に共通Provider・用語interaction・詳細dialogを配置している。

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

## Drill

`#/drill` はREADYでCourse（A〜D / Mixed）とOrder（Sequential / Random）を選び、1問ずつ出題するDrill。初期値はMixed / Sequential / Normalで、全問を教材定義順に出題する。
`src/drill/sessionSequence.ts` がカテゴリで絞り込み、ID抽出後に順序を適用する。Randomは乱数源を注入できるFisher–Yatesで、元教材を変更しない。
READYでCourse / Orderを変えると対象件数とsequenceを更新する。開始後はsession snapshotを固定し、完了後の「もう一度」で同じ設定から再生成する（Randomは再shuffle）。対象0問では開始できない。設定は保存しない。
進行は `src/drill/drillReducer.ts` の状態機械
（`ready → question → answer → question … → finished`、`RESET` で `ready`）が管理する。
「答えを見る」でAnswer・Explanationを表示し、「次へ」で進む。最後の問題では「完了」になる。
出題順の選択や保存などの副作用はreducerの外に置く。自動採点は行わず、自己評価による戦績保存を行う。
教材の検証エラー時は開始できない。

READYでTempoを選び、Question / Answerの時間切れでも自動進行する。
`src/drill/tempo.ts` に基準時間を集約している（Slow: 10秒 / 10秒、Normal: 6秒 / 7秒、Fast: 3秒 / 4秒）。
両phaseとも基準時間 × `Question.timeWeight`（未指定は1）を使用する。
`timeWeight` は有限で0より大きい数であることをvalidatorが検証する。それでも計算結果が非正数・非有限になった場合は基準時間へ戻す。

`useDrillTimer` はdeadlineと現在時刻の差で残時間を約100msごとに更新し、期限通知を1期間に1回だけ行う。
DrillPageが通知を `TIMER_EXPIRED` としてdispatchし、reducerがQuestionならAnswer、Answerなら次問またはFinishedへ進める。
現在の問題ID・index・phaseまたはduration変更でTimerをリセットする。
「一時停止」やGlossary詳細表示中は残時間を保持し、再開後はそこから続く。
手動pauseは問題・phase変更時に解除される。Glossary short tooltipは時間へ影響しない。
Timer・Tempo・pauseはDrillStateの外で管理し、unmount時にTimerを解除する。
hookとDrill連携の時間経過テストにはfake timersを使用している。

ANSWERには「○ 分かった」「△ 怪しい」「× 分からなかった」の自己評価を表示する。
評価時だけ問題ごとのknown / unsure / unknown件数と、最後の評価・ISO日時を保存して `NEXT` へ進む。
「次へ」「完了」やTimer expiryは未評価として進み、戦績を変更しない。
問題が切り替わると、評価ボタンが消えてもキーボード操作を続けられるよう、問題見出しへフォーカスを移す。

`src/stats/statsService.ts` の `recordRating` は日時を引数で受け取り、元Statsを変更せず集計するpure function。
`useStats` がDrill進行とは別にStatsを保持し、初期化時の読み込みと評価イベント時の保存を担当する。
保存先は `StatsRepository` で抽象化し、Storageを注入できるlocalStorage実装を使用する。
keyは `silverSprint:v1:stats`、保存schemaは `{ version: 1, questions: ... }`。
各recordには `knownCount`, `unsureCount`, `unknownCount`, `lastRating`, `lastAnsweredAt` を保存する。
UIラベルや派生合計は保存しない。

読み込み時はversion・object形状・各recordのカウントと評価・日時を検証する。不正なrecordだけを除外し、有効なrecordは残す。形状が壊れている・JSONが不正・非対応versionの場合は空Statsとして扱う。
除外や空扱いが発生したときは、上書きされる前に元の文字列を `silverSprint:v1:stats:backup` へ退避する（最後の1件のみ・best effort）。読み込み自体が失敗した場合も空Statsで続行する。
継承プロパティを問題IDとして扱わず、`constructor` / `toString` / `__proto__` も自前のIDとして安全に扱う。
Storage getterや保存が失敗してもDrillとメモリ上の集計は続け、「戦績を保存できませんでした。」を表示する。
次の保存が成功すればメモリ上の累積Statsを保存し、表示を解除する。
永続保存に失敗した分はページを離れると失われる。複数タブの同時更新の競合解決やschema migrationは未実装。
`#/stats` は現在の教材だけを対象に集計・未評価件数・弱点候補・最近の最終評価5件・全問題の戦績を表示する。
orphan記録は集計から除外し、弱点は最終評価がunsure / unknownの問題を教材順で抽出する。
確認付きの戦績クリアに対応し、Drill・Review・Statsは各mount時に同じlocalStorageを読み込む。
`#/review` は既存Drillをreview modeで使用し、弱点IDを教材順のsession snapshotとして保持する。
評価でStatsが変わっても進行中のsequenceは固定し、完了後の「弱点を再取得」で最新Statsから再構成する。
弱点がない場合は開始不可。StatsのWeak QuestionsからもReviewへ移動できる。コース選択は未実装。

## 静的Renderer

`QuestionPreview → BlockRenderer → 各Block View → InlineRenderer` の順で描画する。
QuestionPreviewはcategory・topic・Question・Answer・Explanationを表示し、Inlineの内部構造は扱わない。

- Inlineのtextは要素wrapperなしの文字列、codeは `<code>`、glossaryは用語button。用語IDは `data-glossary-id` に保持し、hover/focusでshort、click/tapで詳細dialogを表示する。
- TextBlockは `<p>`、CodeBlockは改行・字下げを保持する `<pre><code>`、StepsBlockは `<ol><li>`。
- ComparisonBlockは `<table>`。見出しとセルを `columns` 順で描画し、行keyは `row.id`、`highlight` 行は背景と太字で区別する。
- コードと比較表は横スクロールできる。色はsystem colorを使用する。
- BlockRendererとInlineRendererは `never` で分岐の網羅性をチェックする。PromptはQuestion型の `PromptBlock[]` 制約を維持したままBlockRendererへ渡す。
- 教材中の文字列はReactの通常のテキスト描画を使い、HTMLとして挿入しない。

問題一覧の答え・解説は標準の `details` で初期状態を折りたたむ。用語一覧のshortは非interactiveなPlainInlineRenderer（`components/`。InlineRendererもtext・codeの描画に共用）で表示し、詳細ボタンから共通dialogを開く。
Glossary詳細は既存BlockRendererを使い、detail内の用語やrelatedを選ぶと同じdialogの内容を切り替える。Glossary自体はDrill進行や戦績保存を扱わない。

描画テストは既存の `react-dom/server` の `renderToStaticMarkup` を使い、Node環境のVitestで実行する。
主要分岐・列順・highlight・用語ID・QuestionPreviewの描画を確認する。ページと用語のinteraction testはjsdomとTesting Library、ルーティングのテストはMemoryRouterを使用する。
スクロールや実際のCSSレイアウトはブラウザで確認する。

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
- `timeWeight` は両phaseの基準時間への倍率。サンプルの複合問題は `1.5`。validatorで有限かつ0より大きいことを検証する（上限は未定義）。
- 空の配列・空文字列は今回の検証対象外。描画を実装するときに必要な制約を決める。
- Block・Inline・stepsにはIDがないため、静的Rendererのkeyは配列indexを使用している。将来、要素の並べ替えや要素ごとの状態を持つ場合はkeyの方針を検討する。
- 比較表のcell不足は型だけでは禁止できない。validatorで検出し、Appは正常な教材だけをプレビューする。個別Rendererを他の画面で使うときも検証済み教材を渡す。
- 用語間の相互参照は許可している。detailを展開するUIでは再帰的に用語を自動展開するかどうかを決める。

## GitHub Pages

`vite.config.ts` の `base` はリポジトリ名に合わせて `/silver-sprint/`。
`npm run build` が生成する `dist/` を公開対象にできる。
公開・デプロイ設定は実装していない。自己評価の戦績はlocalStorageへ保存する。
