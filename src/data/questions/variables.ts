import { code, term, text } from '../helpers';
import type { Question } from '../types';

// 「変数・型・scope v1」の新規11問。既存のlocal-variable-initializationと合わせて12問。
// Java SE 17の根拠:
// https://docs.oracle.com/javase/specs/jls/se17/html/jls-4.html#jls-4.1
// https://docs.oracle.com/javase/specs/jls/se17/html/jls-3.html#jls-3.10.2
// https://docs.oracle.com/javase/specs/jls/se17/html/jls-5.html#jls-5.2
// https://docs.oracle.com/javase/specs/jls/se17/html/jls-6.html#jls-6.3
// https://docs.oracle.com/javase/specs/jls/se17/html/jls-16.html
export const additionalVariableQuestions = [
  {
    id: 'primitive-reference-kind',
    category: 'A',
    topic: '型の大分類',
    prompt: [
      { type: 'text', content: [text('次の変数は、それぞれプリミティブ値と参照値のどちらを保持する？')] },
      { type: 'code', language: 'java', code: 'int x = 10;\nString s = "Java";' },
    ],
    answer: [code('x'), text('はプリミティブ値、'), code('s'), text('は参照値を保持する。')],
    explanation: [
      { type: 'text', content: [text('変数には型があり、その型によって保持できる値が決まる。'), term('primitiveType', 'プリミティブ型'), text('の変数はプリミティブ値を、参照型の変数は参照値を保持する。')] },
      { type: 'comparison', columns: [
        { key: 'type', label: '型の大分類' },
        { key: 'example', label: '変数の例' },
        { key: 'value', label: '保持する値' },
      ], rows: [
        { id: 'primitive', cells: { type: [text('プリミティブ型')], example: [code('int x')], value: [text('プリミティブ値（例：'), code('10'), text('）')] } },
        { id: 'reference', cells: { type: [text('参照型')], example: [code('String s')], value: [text('参照値（オブジェクトへの'), term('reference', '参照'), text('、または'), code('null'), text('）')] } },
      ] },
      { type: 'text', content: [code('String'), text('はクラス型なので参照型。'), code('s'), text('に文字列オブジェクトそのものが格納されるわけではない。')] },
    ],
  },
  {
    id: 'primitive-types',
    category: 'D',
    topic: 'プリミティブ型',
    prompt: [{ type: 'text', content: [code('int'), text('、'), code('boolean'), text('、'), code('char'), text('、'), code('String'), text('のうち、プリミティブ型ではないものはどれ？')] }],
    answer: [code('String')],
    explanation: [
      { type: 'text', content: [term('primitiveType', 'プリミティブ型'), text('は'), code('byte'), text('、'), code('short'), text('、'), code('int'), text('、'), code('long'), text('、'), code('char'), text('、'), code('float'), text('、'), code('double'), text('、'), code('boolean'), text('の8種類。')] },
      { type: 'text', content: [code('String'), text('はクラス型であり参照型。プリミティブ型の変数がプリミティブ値を保持するのに対し、'), code('String'), text('型の変数は文字列オブジェクトへの'), term('reference', '参照'), text('、または'), code('null'), text('を保持する。')] },
    ],
  },
  {
    id: 'byte-constant-assignment',
    category: 'C',
    topic: '整数型の代入',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くとコンパイルできる？')] },
      { type: 'code', language: 'java', code: 'byte a = 127;\nbyte b = 128;' },
    ],
    answer: [code('b'), text('の宣言でコンパイルエラー。')],
    explanation: [
      { type: 'text', content: [code('127'), text('も'), code('128'), text('も型は'), code('int'), text('の整数リテラル。代入時には、右辺の式の型が左辺へ代入可能かコンパイル時に検査される。')] },
      { type: 'text', content: [code('int'), text('型のコンパイル時定数は、値が'), code('byte'), text('の範囲（'), code('-128'), text('〜'), code('127'), text('）内なら'), code('byte'), text('へ代入できる。'), code('a'), text('の初期化はこの条件を満たすが、'), code('128'), text('は範囲外なので'), code('b'), text('の初期化は認められない。')] },
      { type: 'text', content: [text('リテラルの型が'), code('byte'), text('になるわけではない。このコード全体はコンパイルに失敗するため、実行には進まない。')] },
    ],
  },
  {
    id: 'float-literal-assignment',
    category: 'C',
    topic: '浮動小数点リテラル',
    prompt: [
      { type: 'text', content: [text('次のローカル変数宣言はコンパイルできる？')] },
      { type: 'code', language: 'java', code: 'float x = 1.0;' },
    ],
    answer: [text('コンパイルできない。')],
    explanation: [
      { type: 'text', content: [text('接尾辞のない浮動小数点リテラル'), code('1.0'), text('は'), code('double'), text('型。'), code('double'), text('から、精度と表現範囲が小さい'), code('float'), text('への暗黙の縮小変換は代入時に認められず、コンパイルエラーになる。')] },
      { type: 'text', content: [code('F'), text('（または'), code('f'), text('）を付けるとリテラル自体が'), code('float'), text('型になり、次の宣言はコンパイルできる。数値の見た目だけでなく、式・リテラルにも型がある。')] },
      { type: 'code', language: 'java', code: 'float x = 1.0F;' },
    ],
  },
  {
    id: 'definite-assignment-if',
    category: 'B',
    topic: '確実な代入（definite assignment）',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くと、正常に出力される？ それともコンパイルエラーになる？')] },
      { type: 'code', language: 'java', code: `int x;
boolean flag = true;

if (flag) {
    x = 10;
}

System.out.println(x);` },
    ],
    answer: [text('コンパイルエラー。'), code('println'), text('で'), code('x'), text('の代入が保証されていない。')],
    explanation: [
      { type: 'steps', items: [
        [code('int x;'), text('は宣言のみ。この時点では'), code('x'), text('は未代入。')],
        [code('if'), text('側では'), code('x = 10;'), text('によって代入済みになる。')],
        [code('else'), text('がないため、条件がfalseの経路では'), code('x'), text('に代入されない。')],
        [text('コンパイラの'), term('definiteAssignment', '確実な代入の解析'), text('では、分岐後の使用地点で代入済みと保証できない。実行に進まず、出力はない。')],
      ] },
      { type: 'text', content: [code('flag'), text('は'), code('final'), text('ではないため、この'), code('flag'), text('という条件式はコンパイル時定数式ではない。初期値が'), code('true'), text('でも、解析はその値からfalse側の経路を除外しない。実行時の値だけでコンパイル可否を判断しない。')] },
    ],
  },
  {
    id: 'definite-assignment-if-else',
    category: 'B',
    topic: '確実な代入（definite assignment）',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くとコンパイルできる？ できる場合、何が出力される？')] },
      { type: 'code', language: 'java', code: `int x;
boolean flag = true;

if (flag) {
    x = 10;
} else {
    x = 20;
}

System.out.println(x);` },
    ],
    answer: [text('コンパイルでき、'), code('10'), text('を出力する。')],
    explanation: [
      { type: 'steps', items: [
        [text('宣言直後の'), code('x'), text('は未代入。')],
        [code('if'), text('側では'), code('x = 10;'), text('によって代入済みになる。')],
        [code('else'), text('側でも'), code('x = 20;'), text('によって代入済みになる。')],
        [text('どちらの経路から来ても'), code('println'), text('地点で'), code('x'), text('は代入済み。'), term('definiteAssignment', '確実な代入の解析'), text('を満たし、コンパイルできる。')],
        [text('実行時には'), code('flag'), text('が'), code('true'), text('なのでif側を通り、'), code('10'), text('を出力する。')],
      ] },
      { type: 'text', content: [code('else'), text('のない問題との違いは、コンパイル時にすべての分岐経路で代入を保証できること。実行時に選ばれる経路とは分けて考える。')] },
    ],
  },
  {
    id: 'block-scope',
    category: 'C',
    topic: 'スコープ',
    prompt: [
      { type: 'text', content: [text('ほかに同名の変数やフィールドはないものとする。次のコードをメソッド内に書くとどうなる？')] },
      { type: 'code', language: 'java', code: `{
    int x = 10;
}

System.out.println(x);` },
    ],
    answer: [text('ブロック外の'), code('println'), text('でコンパイルエラー。')],
    explanation: [
      { type: 'text', content: [term('scope', 'スコープ'), text('は、その宣言の名前を単純名（'), code('x'), text('だけ）で参照できる範囲。ここで宣言した'), term('localVariable', 'ローカル変数'), code('x'), text('のスコープは宣言自身の初期化式から同じブロックの終わりまで。代入済みでもブロックの外からは参照できない。')] },
      { type: 'code', language: 'java', code: `{
    int x = 10;
    // ここではxを参照できる
}
// ここはxのscope外` },
      { type: 'text', content: [text('未代入ではなく名前の有効範囲の問題。コンパイルに失敗するため実行に進まない。')] },
    ],
  },
  {
    id: 'for-variable-scope',
    category: 'C',
    topic: 'スコープ',
    prompt: [
      { type: 'text', content: [text('ほかに同名の変数やフィールドはないものとする。次のコードをメソッド内に書くとコンパイルできる？')] },
      { type: 'code', language: 'java', code: `for (int i = 0; i < 3; i++) {
    System.out.println(i);
}

System.out.println(i);` },
    ],
    answer: [text('最後の'), code('println'), text('でコンパイルエラー。')],
    explanation: [
      { type: 'text', content: [code('for'), text('初期化部で宣言した'), code('i'), text('の'), term('scope', 'スコープ'), text('は、自身の初期化式を含む初期化部の残り・条件部・更新部・本体。for文終了後はスコープ外になる。')] },
      { type: 'text', content: [text('ループ本体の'), code('println(i)'), text('では参照できるが、最後の'), code('println(i)'), text('では参照できない。コード全体がコンパイルに失敗するので、途中まで実行して'), code('0'), text('、'), code('1'), text('、'), code('2'), text('を出力するわけではない。')] },
    ],
  },
  {
    id: 'declaration-initializer-scope',
    category: 'C',
    topic: 'スコープと初期化',
    prompt: [
      { type: 'text', content: [text('次のローカル変数宣言はコンパイルできる？ スコープと代入済みかどうかを分けて考えよう。')] },
      { type: 'code', language: 'java', code: 'int x = x;' },
    ],
    answer: [text('コンパイルエラー。右辺の'), code('x'), text('はスコープ内だが、まだ代入済みではない。')],
    explanation: [
      { type: 'text', content: [term('localVariable', 'ローカル変数'), text('の'), term('scope', 'スコープ'), text('は宣言自身の初期化式を含む。したがって、右辺の'), code('x'), text('は新しく宣言しているローカル変数'), code('x'), text('を参照する。スコープ外だから失敗するわけではない。')] },
      { type: 'text', content: [text('初期化は右辺を評価してからその値を代入する。右辺で値を読み出す時点では、'), code('x'), text('はまだ'), term('definiteAssignment', '確実に代入済み'), text('ではないためコンパイルエラーになる。')] },
      { type: 'text', content: [text('スコープ内で名前を参照できること、使用前の代入が保証されること、型が代入可能であることは、それぞれ別の条件。ここでは型は同じ'), code('int'), text('でも、代入保証を満たさない。')] },
    ],
  },
  {
    id: 'primitive-copy',
    category: 'B',
    topic: 'プリミティブ値の代入',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内で実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `int a = 10;
int b = a;

b = 20;

System.out.println(a + ":" + b);` },
    ],
    answer: [code('10:20')],
    explanation: [
      { type: 'steps', items: [
        [code('int a = 10;'), text('で'), code('a'), text('は'), code('10'), text('になる。')],
        [code('int b = a;'), text('で'), code('a'), text('のプリミティブ値'), code('10'), text('を'), code('b'), text('へコピーする。両方とも'), code('10'), text('になる。')],
        [code('b = 20;'), text('は'), code('b'), text('だけを変更する。'), code('a'), text('は'), code('10'), text('のまま。')],
        [text('最終状態は'), code('a = 10'), text('、'), code('b = 20'), text('。出力は'), code('10:20'), text('になる。')],
      ] },
      { type: 'text', content: [term('primitiveType', 'プリミティブ型'), text('の変数への代入は値のコピー。変数同士が結び付いて、後の変更が連動するわけではない。')] },
    ],
  },
  {
    id: 'final-local-variable',
    category: 'C',
    topic: 'final変数',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くとコンパイルできる？')] },
      { type: 'code', language: 'java', code: 'final int x = 10;\nx = 20;' },
    ],
    answer: [text('2行目でコンパイルエラー。')],
    explanation: [
      { type: 'text', content: [code('final'), text('を付けた変数は、一度値を代入した後は再代入できない。1行目で'), code('x'), text('には'), code('10'), text('が代入されているため、2行目の'), code('x = 20;'), text('は認められない。')] },
      { type: 'text', content: [text('この制約はコンパイル時に検査される。実行中の例外ではなく、コンパイルエラーになる。')] },
    ],
  },
] satisfies Question[];
