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
          text('による自動初期化はされない。値を読み出す前に、確実に代入されている必要がある。'),
        ],
      },
    ],
    related: ['defaultValue'],
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
} satisfies GlossaryDictionary;
