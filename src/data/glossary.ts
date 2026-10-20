import { code, term, text } from './helpers';
import type { GlossaryDictionary, GlossaryEntry } from './types';

export const glossary = {
  localVariable: {
    term: 'ローカル変数',
    category: '変数',
    short: [text('メソッドやコンストラクタの本体、ブロック内などで宣言する変数。')],
    detail: [
      {
        type: 'text',
        content: [
          term('defaultValue', 'デフォルト値'),
          text('による自動初期化はされない。値を読み出す地点で'),
          term('definiteAssignment', '確実に代入済み'),
          text('であることがコンパイル時に求められる。'),
        ],
      },
    ],
    related: ['defaultValue', 'definiteAssignment', 'scope'],
  },
  defaultValue: {
    term: 'デフォルト値',
    category: '変数',
    short: [text('フィールドや配列要素に自動設定される、型ごとの初期値。')],
    detail: [
      {
        type: 'text',
        content: [
          text('例：'),
          code('int'),
          text('は'),
          code('0'),
          text('、'),
          code('boolean'),
          text('は'),
          code('false'),
          text('、参照型は'),
          code('null'),
          text('。'),
          term('localVariable', 'ローカル変数'),
          text('には設定されない。'),
        ],
      },
    ],
    related: ['localVariable', 'reference'],
  },
  postIncrement: {
    term: '後置インクリメント',
    category: '演算子',
    short: [
      code('x++'),
      text('のように書く。変数を1増やし、式の値としては増やす前の値を返す。'),
    ],
    detail: [
      {
        type: 'text',
        content: [
          code('int y = x++;'),
          text('では、増やす前の'),
          code('x'),
          text('の値が'),
          code('y'),
          text('に代入される。一方、'),
          code('x'),
          text('自身は後置インクリメント式の評価によって1増加する。'),
        ],
      },
    ],
  },
  reference: {
    term: '参照',
    category: '参照型',
    short: [text('オブジェクトを指す値。参照型変数はオブジェクトへの参照、または'), code('null'), text('を保持する。')],
    detail: [
      {
        type: 'text',
        content: [
          text('参照型変数への代入では参照がコピーされる。同じオブジェクトを複数の変数から参照でき、オブジェクト自体が複製されるわけではない。'),
        ],
      },
    ],
    related: ['defaultValue'],
  },
  // Check this entry explicitly: "constructor" overlaps an Object property.
  constructor: {
    term: 'コンストラクタ',
    category: 'クラス',
    short: [text('インスタンス生成時の初期化に使う宣言。クラスと同じ名前を持ち、戻り値の型は書かない。')],
    detail: [
      {
        type: 'text',
        content: [
          code('void'),
          text('も書かない。別のコンストラクタへの委譲には'),
          term('explicitConstructorInvocation', '明示的コンストラクタ呼び出し'),
          text('を使う。'),
        ],
      },
    ],
    related: ['explicitConstructorInvocation'],
  } satisfies GlossaryEntry,
  explicitConstructorInvocation: {
    term: '明示的コンストラクタ呼び出し',
    category: 'クラス',
    short: [
      code('this(...)'),
      text('で同じクラスの別の'),
      term('constructor', 'コンストラクタ'),
      text('を、'),
      code('super(...)'),
      text('で直接のスーパークラスのコンストラクタを呼び出す。'),
    ],
    detail: [
      {
        type: 'text',
        content: [
          text('Java SE 17ではコンストラクタ本体の先頭に書く。同じ本体で両方は書けない。どちらも書かない場合、'),
          code('Object'),
          text('以外では引数なしの'),
          code('super()'),
          text('が暗黙に呼ばれるため、呼び出せる引数なしコンストラクタが必要。'),
        ],
      },
    ],
    related: ['constructor'],
  },
  primitiveType: {
    term: 'プリミティブ型',
    category: '型',
    short: [text('整数系（charを含む）・浮動小数点型・booleanからなる8種類の基本型。変数はプリミティブ値を保持する。')],
    detail: [
      { type: 'text', content: [text('プリミティブ型（primitive type）はプリミティブ値（primitive value）を保持する型。')] },
      { type: 'text', content: [code('byte'), text('、'), code('short'), text('、'), code('int'), text('、'), code('long'), text('、'), code('char'), text('、'), code('float'), text('、'), code('double'), text('、'), code('boolean'), text('の8種類。')] },
      { type: 'text', content: [code('String'), text('は含まれず、クラス型（参照型）に分類される。参照型（reference type）の変数が保持する参照値（reference value）は、オブジェクトへの'), term('reference', '参照'), text('、または'), code('null'), text('であり、プリミティブ値とは区別する。')] },
    ],
    related: ['reference'],
  },
  scope: {
    term: 'スコープ',
    category: '変数',
    short: [text('宣言した名前を単純名で参照できるプログラム上の範囲。代入済みかどうかとは別の条件。')],
    detail: [
      { type: 'text', content: [text('スコープ（scope）は名前を単純名で参照できる範囲。ブロック内で宣言した'), term('localVariable', 'ローカル変数'), text('では、宣言自身の初期化式から同じブロックの終わりまでがスコープになる。名前を単純名で参照するとは、'), code('x'), text('のように名前だけで参照すること。')] },
      { type: 'text', content: [code('int x = x;'), text('の右辺はスコープ内だが、まだ'), term('definiteAssignment', '確実に代入済み'), text('ではないのでコンパイルエラーになる。名前の有効範囲と、値を読み出せるかは分けて考える。')] },
    ],
    related: ['localVariable', 'definiteAssignment'],
  },
  definiteAssignment: {
    term: '確実な代入',
    category: '変数',
    short: [text('変数の値を読む地点で、そこへ至る経路の代入がコンパイル時の規則により保証されていること。')],
    detail: [
      { type: 'text', content: [text('確実な代入（definite assignment）は、使用地点で確実に代入済み（definitely assigned）であることを保証するための規則。')] },
      { type: 'text', content: [term('localVariable', 'ローカル変数'), text('は値を読み出す前に確実に代入済みである必要がある。コンパイラは文・式の構造に沿って解析し、分岐後では各経路の代入状態を確認する。')] },
      { type: 'text', content: [text('boolean定数式などには特別な規則があるが、一般には実行時の値を予測して経路を除外しない。'), code('boolean flag = true;'), text('の'), code('flag'), text('を条件にしたifだけでの代入は、分岐後の代入保証にならない。')] },
    ],
    related: ['localVariable', 'scope'],
  },
  localVariableTypeInference: {
    term: 'ローカル変数の型推論',
    category: '変数',
    short: [code('var'), text('を使ったローカル変数宣言では、初期化式を基にコンパイル時に型が推論される。')],
    detail: [
      { type: 'text', content: [term('localVariable', 'ローカル変数'), text('を'), code('var'), text('で宣言するには初期化式が必須。'), code('var value = 10;'), text('では初期化式が'), code('int'), text('型なので、'), code('value'), text('も'), code('int'), text('型になる。')] },
      { type: 'text', content: [text('推論された型は固定され、実行時に型が切り替わるわけではない。'), code('var'), text('自体が変数の型になるわけでもない。')] },
    ],
    related: ['localVariable'],
  },
  remainderOperator: {
    term: '剰余演算子',
    category: '演算子',
    short: [code('%'), text('は除算の余りを求める演算子。')],
    detail: [
      { type: 'text', content: [text('整数の剰余では、結果が0でない場合、その符号は左辺（被除数）に従う。'), code('7 % 3'), text('は'), code('1'), text('だが、'), code('-7 % 3'), text('は'), code('-1'), text('になる。常に0以上の余りになるわけではない。')] },
    ],
  },
  prefixIncrement: {
    term: '前置インクリメント',
    category: '演算子',
    short: [code('++x'), text('のように書き、値を1増やしてから、更新後の値を式の値とする。')],
    detail: [
      { type: 'text', content: [code('x'), text('が'), code('2'), text('のとき、'), code('int a = ++x;'), text('では'), code('x'), text('も'), code('a'), text('も'), code('3'), text('になる。')] },
      { type: 'text', content: [text('同じ初期値で'), term('postIncrement', '後置インクリメント'), code('int a = x++;'), text('を使うと、'), code('x'), text('は'), code('3'), text('になるが、式の値は更新前の'), code('2'), text('なので'), code('a'), text('は'), code('2'), text('になる。変数の更新と式の値を区別する。')] },
    ],
    related: ['postIncrement'],
  },
  binaryNumericPromotion: {
    term: '二項数値昇格',
    category: '型',
    short: [text('2つの数値オペランドに演算を適用する際、規則に従って型を変換すること。')],
    detail: [
      { type: 'text', content: [text('二項数値昇格（binary numeric promotion）では、通常の二項算術演算の'), code('byte'), text('、'), code('short'), text('、'), code('char'), text('は少なくとも'), code('int'), text('へ昇格する。一方が'), code('double'), text('なら'), code('double'), text('、そうでなく一方が'), code('float'), text('なら'), code('float'), text('、そうでなく一方が'), code('long'), text('なら'), code('long'), text('、それ以外は'), code('int'), text('に両オペランドの型をそろえる。')] },
      { type: 'text', content: [code('short a = 10; short b = 20;'), text('の'), code('a + b'), text('では両方が'), code('int'), text('へ昇格し、式の結果も'), code('int'), text('になる。変数'), code('a'), text('と'), code('b'), text('自身の宣言された型が変わるわけではない。')] },
    ],
    related: ['primitiveType'],
  },
  compoundAssignment: {
    term: '複合代入演算子',
    category: '演算子',
    short: [code('+='), text('など、演算と代入を組み合わせた演算子。')],
    detail: [
      { type: 'text', content: [text('演算後の結果を左辺の型へ暗黙に変換して代入する。'), code('short a = 10;'), text('に対する'), code('a += 20;'), text('は、概念的には'), code('a = (short) (a + 20);'), text('と説明できる。通常の'), code('a = a + 20;'), text('では演算結果が'), code('int'), text('なので、そのまま代入できない。')] },
      { type: 'text', content: [text('複合代入は左辺を1回だけ評価する。左辺に副作用のある式が含まれる場合まで、通常の代入への単純な書き換えと完全に同一とは限らない。変換は結果が左辺の型の範囲内かどうかにかかわらず行われ、縮小変換で情報を失うこともある。')] },
    ],
    related: ['binaryNumericPromotion'],
  },
  explicitCast: {
    term: 'キャスト',
    category: '型',
    short: [code('(int) value'), text('のように、変換先の型を明示して値を変換する構文。')],
    detail: [
      { type: 'text', content: [text('数値のプリミティブ型では、拡大変換は代入などで暗黙に行えるが、'), code('double'), text('から'), code('int'), text('のような縮小変換には明示的なキャストが必要。キャストは縮小変換だけでなく、拡大変換にも使える。')] },
      { type: 'text', content: [text('浮動小数点型から整数型への変換では、有限かつ変換先の表現範囲内の値について小数部分を0方向へ切り詰める。'), code('(int) 3.9'), text('は'), code('3'), text('、'), code('(int) -3.9'), text('は'), code('-3'), text('になる。四捨五入ではない。')] },
    ],
  },
  shortCircuitEvaluation: {
    term: '短絡評価',
    category: '演算子',
    short: [code('&&'), text('または'), code('||'), text('で、左辺の結果によって右辺の評価を省略すること。')],
    detail: [
      { type: 'text', content: [text('まず左辺を評価し、右辺が必要な場合だけ評価する。省略された右辺では、インクリメントなどの副作用も起きない。')] },
      { type: 'comparison', columns: [
        { key: 'operator', label: '演算子（booleanオペランド）' },
        { key: 'right', label: '右辺を評価する条件' },
      ], rows: [
        { id: 'and', cells: { operator: [code('&&')], right: [text('左辺がtrueのときだけ（falseなら省略）')] } },
        { id: 'or', cells: { operator: [code('||')], right: [text('左辺がfalseのときだけ（trueなら省略）')] } },
        { id: 'non-short-circuit', cells: { operator: [code('&')], right: [text('左辺が正常に評価されたら、真偽にかかわらず評価する')] } },
      ] },
      { type: 'text', content: [text('booleanオペランドに対する'), code('&'), text('は論理ANDとして働き、'), code('&&'), text('と違って左辺がfalseでも右辺を評価する。')] },
    ],
  },
  conditionalOperator: {
    term: '条件演算子',
    category: '演算子',
    short: [code('条件 ? 式1 : 式2'), text('の形で、条件によって評価する式を選ぶ演算子。')],
    detail: [
      { type: 'text', content: [text('第1オペランドの条件を先に評価し、trueなら第2オペランド（式1）、falseなら第3オペランド（式2）を評価する。選択された片方だけを評価し、もう片方は評価しない。')] },
      { type: 'text', content: [code('n == 0 ? 10 : ++n'), text('で'), code('n'), text('が'), code('0'), text('なら、'), code('10'), text('が選ばれる。'), code('++n'), text('は評価されず、'), code('n'), text('は変わらない。')] },
    ],
  },
  danglingElse: {
    term: 'elseの対応関係',
    category: '制御構文',
    short: [text('elseは、対応するelseを持たない最も近いifと結びつく。')],
    detail: [
      { type: 'text', content: [text('波括弧のない入れ子のifでは、elseは内側の未対応のifに対応する。字下げで対応先は変わらない。外側のifに対応させるには、内側のifをブロックで囲んで文の構造を明示する。')] },
    ],
  },
  switchFallThrough: {
    term: 'フォールスルー',
    category: '制御構文',
    short: [code('case :'), text('形式で、後続のcaseやdefaultのラベルを越えて処理が続くこと。')],
    detail: [
      { type: 'text', content: [text('一致するラベルから実行を始めた後、breakなどで制御を移さなければ、後続のラベルでも条件を再判定せず処理を続ける。defaultも通過先になる。ラベルなしのbreakは最も内側のswitch文またはループを終了する。')] },
      { type: 'text', content: [term('switchRule', 'switchルール'), text('（'), code('->'), text('形式）にはフォールスルーがない。switch式で結果の値を渡すにはbreakではなく'), term('yieldStatement', 'yield文'), text('を使う。')] },
    ],
    related: ['switchRule', 'switchExpression', 'yieldStatement', 'labeledJump'],
  },
  switchRule: {
    term: 'switchルール',
    category: '制御構文',
    short: [code('case 値 ->'), text('や'), code('default ->'), text('の形式。選ばれたルールから次のルールへフォールスルーしない。')],
    detail: [
      { type: 'text', content: [text('switch文と'), term('switchExpression', 'switch式'), text('の両方で使える。矢印の右側には式・ブロック・throw文を書けるが、switch文で式を書く場合は文として使える式に限られる。'), code('->'), text('だけでswitch式と判断しない。')] },
      { type: 'text', content: [text('Java SE 17の標準仕様でセレクタに使える型はbyte・short・char・int、Byte・Short・Character・Integer、String、enum。longやパターンを使ったswitchは、この標準仕様の範囲に含まれない。caseは定数式またはenum定数名で、同じswitchブロック内で値を重複させられない。')] },
    ],
    related: ['switchFallThrough', 'switchExpression'],
  },
  switchExpression: {
    term: 'switch式',
    category: '制御構文',
    short: [text('switch全体が値を生成し、代入や引数などに利用できる式。')],
    detail: [
      { type: 'text', content: [text('switch文は処理を分岐させる文、switch式は結果の値を持つ式。switch式では'), term('switchExhaustiveness', '網羅性'), text('が必要で、結果の値を生成せず正常終了する経路は許されない。throwなどで正常終了しない経路は許される。')] },
      { type: 'text', content: [code('case 1 -> 10;'), text('は10を結果とする。ブロック内から結果を渡すには'), term('yieldStatement', 'yield文'), text('を使う。'), code('case :'), text('形式も使えるが、その場合も正常に評価を終えるにはyieldで値を渡す。')] },
    ],
    related: ['switchRule', 'yieldStatement', 'switchExhaustiveness'],
  },
  yieldStatement: {
    term: 'yield文',
    category: '制御構文',
    short: [code('yield 式;'), text('の形で、最も内側のswitch式に結果の値を渡す。')],
    detail: [
      { type: 'text', content: [code('yield'), text('は式を評価し、その値で対象の'), term('switchExpression', 'switch式'), text('の評価を終える。メソッドを終了するreturnとは異なり、switch式の後の処理は続く。')] },
      { type: 'text', content: [text('breakはswitch文やループなどから抜けるための文で、結果の値は渡さない。yieldはswitch文の終了には使えず、breakをswitch式の結果生成の代わりにも使えない。')] },
    ],
    related: ['switchExpression', 'labeledJump'],
  },
  switchExhaustiveness: {
    term: 'switch式の網羅性',
    category: '制御構文',
    short: [text('switch式は、セレクタが取り得るすべての値を扱える必要がある。')],
    detail: [
      { type: 'text', content: [text('Java SE 17の標準仕様では、enum以外のセレクタを使う'), term('switchExpression', 'switch式'), text('にはdefaultが必要。enumでは全定数をcaseに列挙すれば、defaultなしでも網羅性を満たす。変数の初期値が特定のcaseと一致していても、網羅性の条件は省略されない。')] },
      { type: 'text', content: [text('この条件を満たさないコードはコンパイルエラーになる。網羅性はnullをcaseで扱うことを意味しない。Java SE 17の標準仕様では、セレクタの評価結果がnullなら実行時にNullPointerExceptionが発生する。')] },
    ],
    related: ['switchExpression', 'switchRule'],
  },
  enhancedFor: {
    term: '拡張for文',
    category: '制御構文',
    short: [code('for (型 変数 : 対象)'), text('の形で、配列やIterableの要素を順に取り出す文。')],
    detail: [
      { type: 'text', content: [text('各反復で要素の値をループ変数に代入する。'), term('primitiveType', 'プリミティブ型'), text('ならプリミティブ値、参照型なら'), term('reference', '参照'), text('がコピーされる。ループ変数への再代入は、元の配列要素を置き換えない。')] },
      { type: 'text', content: [text('参照型の要素では、ループ変数を通して参照先のオブジェクトの状態を変更できる場合がある。変数への再代入と、参照先の状態変更を区別する。')] },
    ],
    related: ['primitiveType', 'reference', 'labeledJump'],
  },
  labeledJump: {
    term: 'ラベル付きbreak / continue',
    category: '制御構文',
    short: [text('breakは指定したラベルの文を終了し、continueは指定したラベルのループの次の反復へ進む。')],
    detail: [
      { type: 'text', content: [text('ラベルなしのbreakは最も内側のswitch文またはループを終了する。'), code('break outer;'), text('は、それを囲むouterラベルの文を終了する。ラベルの対象はループだけでなく、ブロックなどの文でもよい。')] },
      { type: 'text', content: [text('ラベルなしのcontinueは最も内側のループを継続する。'), code('continue outer;'), text('の対象は、それを囲むouterラベルのループである必要がある。基本forなら更新式へ、whileやdo-whileなら条件判定へ進み、ループ自体は終了しない。')] },
      { type: 'text', content: [text('任意の位置へ移動するgotoではない。また、breakやcontinueでswitch式の外へ飛び出すことはできない。switch式に結果を渡すには'), term('yieldStatement', 'yield文'), text('を使う。')] },
    ],
    related: ['switchFallThrough', 'yieldStatement', 'enhancedFor'],
  },
} satisfies GlossaryDictionary;
