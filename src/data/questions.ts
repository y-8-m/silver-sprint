import { code, term, text } from './helpers';
import { additionalVariableQuestions } from './questions/variables';
import type { Question } from './types';

export const questions = [
  {
    id: 'local-variable-initialization',
    category: 'C',
    topic: 'ローカル変数の初期化',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くとコンパイルできる？')] },
      { type: 'code', language: 'java', code: 'int x;\nSystem.out.println(x);' },
    ],
    answer: [text('コンパイルエラー。読み出す前に代入が必要。')],
    explanation: [
      {
        type: 'text',
        content: [
          term('localVariable', 'ローカル変数'),
          text('には'),
          term('defaultValue', 'デフォルト値'),
          text('が設定されない。使用地点で'),
          term('definiteAssignment', 'definitely assigned（確実に代入済み）'),
          text('であることがコンパイル時に必要。このコードは宣言のみで、'),
          code('println(x)'),
          text('までに代入がないためコンパイルエラーになる。実行時に0や不定の値が出力されるわけではない。'),
        ],
      },
    ],
  },
  {
    id: 'post-increment-output',
    category: 'B',
    topic: '後置インクリメント',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内で実行すると何が出力される？')] },
      {
        type: 'code',
        language: 'java',
        code: `int x = 1;
int y = x++;

System.out.println(x + ":" + y);`,
      },
    ],
    answer: [code('2:1')],
    explanation: [
      {
        type: 'steps',
        items: [
          [code('x'), text('を'), code('1'), text('で初期化する。')],
          [
            term('postIncrement', '後置インクリメント'),
            text('の'),
            code('x++'),
            text('は、式の値として増やす前の'),
            code('1'),
            text('を使い、'),
            code('x'),
            text('を'),
            code('2'),
            text('に更新する。'),
          ],
          [code('y'), text('に式の値'), code('1'), text('が代入される。')],
          [code('x + ":" + y'), text('は文字列'), code('2:1'), text('になる。')],
        ],
      },
    ],
  },
  {
    id: 'inheritance-multiplicity',
    category: 'C',
    topic: '継承とインタフェース',
    prompt: [{ type: 'text', content: [text('1つのクラスが複数のクラスをextendsできる？')] }],
    answer: [text('できない。直接継承するクラスは1つだけ。')],
    explanation: [
      {
        type: 'comparison',
        columns: [
          { key: 'declaration', label: '宣言' },
          { key: 'target', label: '対象' },
          { key: 'multiple', label: '複数指定' },
        ],
        rows: [
          {
            id: 'class-extends',
            highlight: true,
            cells: {
              declaration: [code('class extends')],
              target: [text('クラス')],
              multiple: [text('不可：直接のスーパークラスは1つ')],
            },
          },
          {
            id: 'class-implements',
            cells: {
              declaration: [code('class implements')],
              target: [text('インタフェース')],
              multiple: [text('可：複数のインタフェースを実装できる')],
            },
          },
          {
            id: 'interface-extends',
            cells: {
              declaration: [code('interface extends')],
              target: [text('インタフェース')],
              multiple: [text('可：複数のインタフェースを継承できる')],
            },
          },
        ],
      },
    ],
  },
  {
    id: 'reference-variable-value',
    category: 'A',
    topic: '参照型変数',
    prompt: [{ type: 'text', content: [text('参照型変数にはオブジェクトそのものが格納される？')] }],
    answer: [text('オブジェクトへの'), term('reference', '参照'), text('、または'), code('null'), text('が格納される。')],
    explanation: [
      {
        type: 'text',
        content: [
          term('reference', '参照'),
          text('を別の変数へ代入しても、オブジェクト自体はコピーされない。2つの変数が同じオブジェクトを参照できる。'),
        ],
      },
    ],
  },
  {
    id: 'constructor-call-chain',
    category: 'B',
    topic: 'コンストラクタの呼び出し順序',
    timeWeight: 1.5,
    prompt: [
      {
        type: 'text',
        content: [
          code('new Child()'),
          text('を実行すると何が出力される？'),
          term('constructor', 'コンストラクタ'),
          text('と'),
          term('explicitConstructorInvocation', '明示的コンストラクタ呼び出し'),
          text('の順序を考えよう。'),
        ],
      },
      {
        type: 'code',
        language: 'java',
        code: `class Parent {
    Parent(int value) {
        System.out.print("P");
    }
}

class Child extends Parent {
    Child() {
        this(1);
        System.out.print("D");
    }

    Child(int value) {
        super(value);
        System.out.print("C");
    }
}

class Main {
    public static void main(String[] args) {
        new Child();
    }
}`,
      },
    ],
    answer: [code('PCD')],
    explanation: [
      {
        type: 'text',
        content: [
          code('Child()'),
          text('の'),
          code('this(1)'),
          text('が同じクラスの'),
          code('Child(int)'),
          text('へ委譲し、その'),
          code('super(value)'),
          text('が'),
          code('Parent(int)'),
          text('を呼び出す。戻りながら'),
          code('P'),
          text('、'),
          code('C'),
          text('、'),
          code('D'),
          text('の順に出力される。'),
        ],
      },
      {
        type: 'comparison',
        columns: [
          { key: 'call', label: '呼び出し' },
          { key: 'target', label: '呼び出し先' },
          { key: 'rule', label: 'Java SE 17の配置ルール' },
        ],
        rows: [
          {
            id: 'this-call',
            cells: {
              call: [code('this(...)')],
              target: [text('同じクラスの別の'), term('constructor', 'コンストラクタ')],
              rule: [text('本体の先頭に書く。'), code('super(...)'), text('と同じ本体には書けない。')],
            },
          },
          {
            id: 'super-call',
            cells: {
              call: [code('super(...)')],
              target: [text('直接のスーパークラスの'), term('constructor', 'コンストラクタ')],
              rule: [text('本体の先頭に書く。'), code('this(...)'), text('と同じ本体には書けない。')],
            },
          },
        ],
      },
      {
        type: 'text',
        content: [
          term('explicitConstructorInvocation', '明示的コンストラクタ呼び出し'),
          text('を省略した場合は、'),
          code('Object'),
          text('以外では'),
          code('super()'),
          text('が暗黙に呼ばれる。この例の'),
          code('Parent'),
          text('には引数なしのコンストラクタがないので、'),
          code('Child(int)'),
          text('の'),
          code('super(value)'),
          text('を省略するとコンパイルエラーになる。'),
        ],
      },
    ],
  },
  ...additionalVariableQuestions,
] satisfies Question[];
