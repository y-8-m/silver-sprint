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
          term('definiteAssignment', 'definitely assigned（確実に代入済み）'),
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
    short: [text('整数・浮動小数点数・真偽値を表す8種類の基本型。変数はプリミティブ値を保持する。')],
    detail: [
      { type: 'text', content: [code('byte'), text('、'), code('short'), text('、'), code('int'), text('、'), code('long'), text('、'), code('char'), text('、'), code('float'), text('、'), code('double'), text('、'), code('boolean'), text('の8種類。')] },
      { type: 'text', content: [code('String'), text('は含まれず、クラス型（参照型）に分類される。参照型の変数が保持するのはオブジェクトへの'), term('reference', '参照'), text('、または'), code('null'), text('であり、プリミティブ値とは区別する。')] },
    ],
    related: ['reference'],
  },
  scope: {
    term: 'スコープ',
    category: '変数',
    short: [text('宣言した名前を単純名で参照できるプログラム上の範囲。代入済みかどうかとは別の条件。')],
    detail: [
      { type: 'text', content: [text('ブロック内で宣言した'), term('localVariable', 'ローカル変数'), text('では、宣言自身の初期化式から同じブロックの終わりまでがscopeになる。名前を単純名で参照するとは、'), code('x'), text('のように名前だけで参照すること。')] },
      { type: 'text', content: [code('int x = x;'), text('の右辺はscope内だが、まだ'), term('definiteAssignment', 'definitely assigned'), text('ではないのでコンパイルエラーになる。名前の有効範囲と、値を読み出せるかは分けて考える。')] },
    ],
    related: ['localVariable', 'definiteAssignment'],
  },
  definiteAssignment: {
    term: '確実な代入（definite assignment）',
    category: '変数',
    short: [text('変数の値を読む地点で、そこへ至る経路の代入がコンパイル時の規則により保証されていること。')],
    detail: [
      { type: 'text', content: [term('localVariable', 'ローカル変数'), text('は値を読み出す前にdefinitely assignedである必要がある。コンパイラは文・式の構造に沿って解析し、分岐後では各経路の代入状態を確認する。')] },
      { type: 'text', content: [text('boolean定数式などには特別な規則があるが、一般には実行時の値を予測して経路を除外しない。'), code('boolean flag = true;'), text('の'), code('flag'), text('を条件にしたifだけでの代入は、分岐後の代入保証にならない。')] },
    ],
    related: ['localVariable', 'scope'],
  },
} satisfies GlossaryDictionary;
