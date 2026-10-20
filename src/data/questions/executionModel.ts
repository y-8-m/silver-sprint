import { code, term, text } from '../helpers';
import type { Question } from '../types';

export const additionalExecutionModelQuestions = [
  {
    id: 'java-compilation-execution',
    category: 'A',
    topic: 'Javaの実行モデル',
    prompt: [
      { type: 'text', content: [code('Hello.java'), text(' → javac → '), code('Hello.class'), text(' → JVM → 実行、という流れで、javacは何を作り、JVMは何をする？')] },
    ],
    answer: [text('javacがバイトコードにコンパイルし、JVMがそれを実行する。')],
    explanation: [
      { type: 'steps', items: [
        [code('Hello.java'), text('はJavaのソースファイル。プログラマが書いたソースコードを格納する。')],
        [code('javac Hello.java'), text('でコンパイラがソースコードを変換する。生成される'), code('Hello.class'), text('には'), term('bytecode', 'Javaバイトコード'), text('が格納される。')],
        [code('java Hello'), text('で'), term('jvm', 'JVM'), text('を起動し、Helloクラスのmainメソッドからプログラムを実行する。指定するのはクラス名であり、'), code('Hello.class'), text('というファイル名ではない。')],
      ] },
      { type: 'text', content: [text('コンパイルは実行に必要な形式へ変換する工程で、プログラムそのものの実行とは別。JVMはバイトコードの実行環境を提供する。')] },
    ],
  },
  {
    id: 'class-instance-distinction',
    category: 'A',
    topic: 'クラスとインスタンス',
    prompt: [
      { type: 'text', content: [text('mainを1回実行したとき、Dogクラスの定義と、生成されるDogインスタンスはそれぞれいくつ？')] },
      { type: 'code', language: 'java', code: `class Dog {}

class Main {
    public static void main(String[] args) {
        Dog a = new Dog();
        Dog b = new Dog();
    }
}` },
    ],
    answer: [text('クラス定義は1つ、生成されるインスタンスは2つ。')],
    explanation: [
      { type: 'text', content: [term('class', 'クラス'), text('はオブジェクトの型を定義する。このコードの'), code('class Dog {}'), text('は1つの定義で、それを基に'), code('new Dog()'), text('が評価されるたびに新しい'), term('instance', 'インスタンス'), text('が生成される。今回は2回なので2つ。')] },
      { type: 'text', content: [code('a'), text('と'), code('b'), text('はそれぞれのオブジェクトへの'), term('reference', '参照'), text('を保持する変数。変数とオブジェクトは別で、一般に変数の数だけではオブジェクトの数は決まらない。同じオブジェクトを複数の変数で参照することもできる。')] },
    ],
  },
  {
    id: 'default-initialization-distinction',
    category: 'A',
    topic: 'デフォルト値とローカル変数',
    prompt: [
      { type: 'text', content: [text('field・values[0]・localのうち、明示的な値の代入なしで、宣言・生成直後にデフォルト値を持つものはどれ？')] },
      { type: 'code', language: 'java', code: `class Sample {
    int field;

    void run() {
        int[] values = new int[1];
        int local;
    }
}` },
    ],
    answer: [text('フィールドと配列要素。ローカル変数には自動代入されない。')],
    explanation: [
      { type: 'comparison', columns: [
        { key: 'target', label: '対象' },
        { key: 'kind', label: '種類' },
        { key: 'initial', label: '初期状態' },
      ], rows: [
        { id: 'field', cells: { target: [code('field')], kind: [text('インスタンスフィールド')], initial: [term('defaultValue', 'デフォルト値'), code('0')] } },
        { id: 'element', cells: { target: [code('values[0]')], kind: [text('配列要素')], initial: [term('defaultValue', 'デフォルト値'), code('0')] } },
        { id: 'local', cells: { target: [code('local')], kind: [term('localVariable', 'ローカル変数')], initial: [text('未代入。自動初期化されない')] } },
      ] },
      { type: 'text', content: [text('フィールドはオブジェクト生成時、配列要素は配列生成時に実行時の初期化が行われる。一方、'), code('int local;'), text('は宣言だけで、値の代入ではない。'), code('local'), text('の値を読み出すなら、その地点で'), term('definiteAssignment', '確実に代入済み'), text('であることをコンパイル時に保証する必要がある。')] },
      { type: 'text', content: [code('values'), text('自身もローカル変数だが、このコードでは初期化式によって配列への参照が明示的に代入される。配列要素への自動初期化とは分けて考える。'), code('local'), text('を読み出していないので、このクラスはコンパイルできる。')] },
    ],
  },
  {
    id: 'object-identity-aliasing',
    category: 'A',
    topic: 'オブジェクトの同一性',
    prompt: [
      { type: 'text', content: [text('同じオブジェクトを参照している変数はどれ？')] },
      { type: 'code', language: 'java', code: `class Box {}

class Main {
    public static void main(String[] args) {
        Box a = new Box();
        Box b = a;
        Box c = new Box();
    }
}` },
    ],
    answer: [text('aとb。同じ参照値を持ち、cは別のオブジェクトを指す。')],
    explanation: [
      { type: 'text', content: [code('b = a'), text('では'), term('reference', '参照値'), text('をコピーする。新しいオブジェクトは生成されず、'), code('a'), text('と'), code('b'), text('から同じオブジェクトを参照できる。')] },
      { type: 'text', content: [code('new Box()'), text('は評価のたびに新しいオブジェクトを生成する。'), code('c'), text('の参照先は'), code('a'), text('や'), code('b'), text('の参照先とは別。'), term('objectIdentity', 'オブジェクトの同一性'), text('は、同じ型かどうかではなく、まさに同じ1つのオブジェクトかどうかを表す。')] },
    ],
  },
  {
    id: 'null-empty-string-distinction',
    category: 'A',
    topic: 'nullと空文字列',
    prompt: [
      { type: 'text', content: [text('次はメソッド内のコード。aとbでは、参照しているものがどう違う？')] },
      { type: 'code', language: 'java', code: 'String a = null;\nString b = "";' },
    ],
    answer: [text('aは参照先がなく、bは長さ0のStringを参照する。')],
    explanation: [
      { type: 'text', content: [code('null'), text('はオブジェクトを参照していないことを表す参照値。'), code('""'), text('は文字を含まない空のStringオブジェクトを表す。どちらも文字が見えなくても、'), term('reference', '参照'), text('先の有無が異なる。')] },
      { type: 'text', content: [code('b.length()'), text('はオブジェクトに対して呼び出せて、'), code('0'), text('を返す。'), code('a.length()'), text('は呼び出し先のオブジェクトがないので、実行時に'), code('NullPointerException'), text('となる。空文字列とnullは同じではない。')] },
    ],
  },
  {
    id: 'array-reference-element-value',
    category: 'A',
    topic: '配列と参照',
    prompt: [
      { type: 'text', content: [text('次はメソッド内のコード。valuesという変数とvalues[0]は、それぞれ何を保持している？')] },
      { type: 'code', language: 'java', code: 'int[] values = new int[3];' },
    ],
    answer: [text('valuesは配列への参照、values[0]はint値。')],
    explanation: [
      { type: 'text', content: [text('配列はオブジェクトなので、配列型'), code('int[]'), text('の変数'), code('values'), text('は配列への'), term('reference', '参照値'), text('を保持する。配列そのものを変数の中に格納しているわけではない。')] },
      { type: 'text', content: [code('int[]'), text('の各要素は'), term('primitiveType', 'プリミティブ型'), code('int'), text('の値を保持する。生成直後の'), code('values[0]'), text('には'), term('defaultValue', 'デフォルト値'), code('0'), text('が設定される。配列を参照する変数の型と、配列要素の型を区別する。')] },
    ],
  },
  {
    id: 'string-immutability',
    category: 'A',
    topic: 'Stringの不変性',
    prompt: [
      { type: 'text', content: [text('次はメソッド内のコード。concatで元のStringオブジェクトは変更される？')] },
      { type: 'code', language: 'java', code: `String s = "A";

s.concat("B");
s = s.concat("C");` },
    ],
    answer: [text('変更されない。結果のStringをsで使うには再代入が必要。')],
    explanation: [
      { type: 'text', content: [text('Stringは'), term('immutable', '不変オブジェクト'), text('で、生成後に文字列の内容が変わらない。'), code('concat'), text('は元のStringを変更せず、連結結果のStringへの参照を返す。')] },
      { type: 'comparison', columns: [
        { key: 'operation', label: '操作' }, { key: 'effect', label: '変数とオブジェクト' },
      ], rows: [
        { id: 'discard', cells: { operation: [code('s.concat("B")')], effect: [text('戻り値を使わないので、sは元の"A"を参照したまま')] } },
        { id: 'assign', cells: { operation: [code('s = s.concat("C")')], effect: [text('sの参照値が変わり、結果の"AC"を参照する')] } },
      ] },
      { type: 'text', content: [text('再代入で変わるのは変数'), code('s'), text('の参照値。元のオブジェクトの文字列が書き換わるわけではない。戻り値は別の変数で受け取ることもできる。')] },
    ],
  },
  {
    id: 'array-arraylist-distinction',
    category: 'A',
    topic: '配列とArrayList',
    prompt: [
      { type: 'text', content: [text('配列とArrayListでは、要素数の扱いがどう違う？')] },
      { type: 'code', language: 'java', code: `import java.util.ArrayList;

class Main {
    public static void main(String[] args) {
        String[] array = new String[2];

        ArrayList<String> list = new ArrayList<>();
        list.add("A");
    }
}` },
    ],
    answer: [text('配列の長さは固定、ArrayListの要素数は増減できる。')],
    explanation: [
      { type: 'text', content: [text('配列の'), code('length'), text('は生成後に変更できない。この配列は長さ2で、まだStringを代入していない要素も含む。一方、ArrayListは'), code('add'), text('や'), code('remove'), text('で要素を追加・削除でき、現在の要素数は'), code('size()'), text('で取得する。')] },
      { type: 'text', content: [text('ArrayListの内部容量は、要素を格納するために確保した領域の大きさで、現在の要素数とは異なる。配列の固定長とArrayListの内部容量を同じものとして捉えない。')] },
      { type: 'text', content: [text('配列もArrayListも参照型のオブジェクト。'), code('array'), text('と'), code('list'), text('はそれぞれのオブジェクトへの'), term('reference', '参照'), text('を保持する。')] },
    ],
  },
] satisfies Question[];
