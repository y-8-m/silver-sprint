import { code, term, text } from '../helpers';
import type { Question } from '../types';

export const additionalObjectQuestions = [
  {
    id: 'constructor-method-purpose',
    category: 'A',
    topic: 'コンストラクタとメソッド',
    prompt: [
      { type: 'text', content: [text('new Box()で実行される初期化処理と、reset()はどう違う？')] },
      { type: 'code', language: 'java', code: `class Box {
    int value;

    Box() {
        value = 1;
    }

    void reset() {
        value = 0;
    }
}` },
    ],
    answer: [text('コンストラクタは生成時の初期化、resetは呼び出して実行するメソッド。')],
    explanation: [
      { type: 'text', content: [code('new Box()'), text('ではオブジェクトの生成・初期化が行われ、'), term('constructor', 'コンストラクタ'), code('Box()'), text('が初期化処理としてvalueに1を設定する。コンストラクタはクラスと同じ名前で、戻り値型を書かない。')] },
      { type: 'text', content: [code('reset()'), text('は通常のインスタンスメソッドで、'), code('box.reset()'), text('のような呼び出しにより既存オブジェクトのvalueを0にする。コンストラクタは生成時の初期化に関わる特別な宣言で、通常のメソッドと同じ扱いではない。')] },
    ],
  },
  {
    id: 'instance-static-state',
    category: 'A',
    topic: 'インスタンスとstatic',
    prompt: [
      { type: 'text', content: [text('valueとtotalは、それぞれ何に属する状態？')] },
      { type: 'code', language: 'java', code: `class Counter {
    int value;
    static int total;
}` },
    ],
    answer: [text('valueはインスタンスごと、totalはクラスに属する共有状態。')],
    explanation: [
      { type: 'text', content: [text('インスタンスフィールド'), code('value'), text('は'), term('instance', 'インスタンス'), text('ごとに存在する。Counterを2つ生成すれば、それぞれが独立したvalueを持つ。')] },
      { type: 'text', content: [term('staticMember', 'staticメンバー'), text('であるtotalはクラスに属し、基本的にはクラスにつき1つ。同じクラスのインスタンス間で共有され、'), code('Counter.total'), text('で参照できる。インスタンスがなくてもクラスに属するフィールドとして存在する。')] },
      { type: 'text', content: [code('static'), text('は所属を表し、'), code('final'), text('は変数の再代入を制限する。staticだから変更できないわけではなく、このtotalには再代入できる。')] },
    ],
  },
  {
    id: 'this-current-instance',
    category: 'A',
    topic: 'this参照',
    prompt: [
      { type: 'text', content: [text('this.valueと右辺のvalueは、それぞれ何を指す？')] },
      { type: 'code', language: 'java', code: `class Box {
    int value;

    Box(int value) {
        this.value = value;
    }
}` },
    ],
    answer: [text('this.valueは現在のインスタンスのフィールド、valueは引数。')],
    explanation: [
      { type: 'text', content: [term('thisReference', 'this参照'), text('は現在の対象オブジェクトへの参照。このコンストラクタでは、初期化しているBoxインスタンスを指す。'), code('this.value'), text('でそのオブジェクトのインスタンスフィールドを指定する。')] },
      { type: 'text', content: [text('右辺の'), code('value'), text('は仮引数。同名のフィールドより仮引数が優先されるが、'), code('this.value'), text('と書けばフィールドを区別できる。引数として受け取った値をフィールドへ代入し、オブジェクトの状態を更新している。')] },
      { type: 'text', content: [code('this()'), text('による別のコンストラクタの呼び出しとは用途が異なる。ここでのthisはオブジェクトを参照する式。')] },
    ],
  },
  {
    id: 'reference-argument-passing',
    category: 'A',
    topic: '参照値の引数渡し',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('changeへBoxを渡すとき、呼び出し先には何がコピーされる？')] },
      { type: 'code', language: 'java', code: `class Box {
    int value;
}

class Main {
    static void change(Box box) {
        box.value = 20;
        box = new Box();
    }

    public static void main(String[] args) {
        Box original = new Box();
        change(original);
    }
}` },
    ],
    answer: [text('オブジェクトではなく、参照値がコピーされる。')],
    explanation: [
      { type: 'text', content: [text('Javaの引数渡しは値渡し。参照型の場合、コピーされる値は'), term('reference', '参照値'), text('で、オブジェクト自体や呼び出し元の変数ではない。呼び出し直後はoriginalと仮引数boxが同じオブジェクトを参照する。')] },
      { type: 'comparison', columns: [
        { key: 'operation', label: '操作' }, { key: 'effect', label: '変更される対象' },
      ], rows: [
        { id: 'mutation', cells: { operation: [code('box.value = 20')], effect: [text('共有して参照しているオブジェクトの状態。originalからもvalueは20に見える')] } },
        { id: 'reassignment', cells: { operation: [code('box = new Box()')], effect: [text('仮引数boxの参照値だけ。originalは元のオブジェクトを参照したまま')] } },
      ] },
      { type: 'text', content: [text('仮引数への再代入は、呼び出し元の変数の参照値を変更しない。'), term('primitiveType', 'プリミティブ型'), text('を渡す場合も値渡しで、その場合は整数などのプリミティブ値がコピーされる。参照値のコピーとオブジェクトのコピーを区別する。')] },
    ],
  },
  {
    id: 'overload-override-distinction',
    category: 'A',
    topic: 'オーバーロードとオーバーライド',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('Childの2つのworkは、親クラスのworkとそれぞれどのような関係？')] },
      { type: 'code', language: 'java', code: `class Parent {
    void work(int n) {}
}

class Child extends Parent {
    @Override
    void work(int n) {}

    void work(String s) {}
}` },
    ],
    answer: [text('work(int)はオーバーライド、work(String)はオーバーロード。')],
    explanation: [
      { type: 'text', content: [term('override', 'オーバーライド'), text('は継承したインスタンスメソッドの実装を子クラスで置き換えること。Childの'), code('work(int)'), text('はParentの同じシグネチャのメソッドをオーバーライドする。名前だけでなく、シグネチャ、戻り値型の互換性、アクセス範囲などの適合条件が必要。')] },
      { type: 'text', content: [term('overload', 'オーバーロード'), text('は同名で引数の型・数・順序などの構成が異なるメソッドを扱うこと。'), code('work(String)'), text('は'), code('work(int)'), text('と引数の型が違う。同じクラス内だけでなく、継承されたメソッドとの間でも成立する。戻り値型の違いだけではオーバーロードできない。')] },
      { type: 'text', content: [text('オーバーロードではコンパイル時に引数などを基に呼び出すメソッドを選ぶ。オーバーライドされたインスタンスメソッドでは、実行時に実際のオブジェクト型に応じた実装を選ぶ。この2つは別の仕組み。')] },
    ],
  },
  {
    id: 'declared-runtime-type-dispatch',
    category: 'A',
    topic: '宣言型と実行時型',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('animalを使ってメソッドを呼べるかの判定と、実際に動くspeakの実装は、それぞれ何によって決まる？')] },
      { type: 'code', language: 'java', code: `class Animal {
    void speak() {}
}

class Dog extends Animal {
    @Override
    void speak() {}

    void fetch() {}
}

class Main {
    public static void main(String[] args) {
        Animal animal = new Dog();
        animal.speak();
        // animal.fetch(); // コメントを外すとコンパイルエラー
    }
}` },
    ],
    answer: [text('呼び出し可能かは宣言型、実行される実装は実際のオブジェクト型で決まる。')],
    explanation: [
      { type: 'text', content: [text('この参照変数の'), term('compileTimeType', 'コンパイル時の型'), text('は宣言型のAnimal。コンパイラはAnimal型から利用可能なメソッドを調べるので、'), code('animal.speak()'), text('は呼び出せると判定する。引数やアクセス範囲などの条件もコンパイル時に確認する。')] },
      { type: 'text', content: [term('runtimeType', '実行時のオブジェクト型'), text('はDog。実行時にはDogで'), term('override', 'オーバーライド'), text('されたspeakの実装が選ばれる。これをインスタンスメソッドの動的ディスパッチと呼び、'), term('polymorphism', 'ポリモーフィズム'), text('を支える。')] },
      { type: 'text', content: [code('fetch()'), text('はDogにあってもAnimal型から利用可能とは判定できないため、'), code('animal.fetch()'), text('のコメントを外すとコンパイルエラーになる。実際の参照先がDogでも、この判定は変わらない。')] },
      { type: 'text', content: [text('ここで実行時に選ばれるのは、オーバーライドされたインスタンスメソッドの実装。フィールドやstaticメソッドには、この動的ディスパッチの説明を適用しない。')] },
    ],
  },
  {
    id: 'interface-implementation-reference',
    category: 'A',
    topic: 'インタフェースと実装',
    prompt: [
      { type: 'text', content: [text('なぜArrayListのインスタンスをList型の変数へ代入できる？')] },
      { type: 'code', language: 'java', code: `import java.util.ArrayList;
import java.util.List;

class Main {
    public static void main(String[] args) {
        List<String> list = new ArrayList<>();
    }
}` },
    ],
    answer: [text('ArrayListがListインタフェースを実装しているため。')],
    explanation: [
      { type: 'text', content: [code('List'), text('は'), term('interface', 'インタフェース'), text('で、ArrayListはそれを実装する'), term('class', 'クラス'), text('。インタフェース型の変数で、その実装クラスの'), term('instance', 'インスタンス'), text('を参照できる。Listはリストとしての操作の契約を表し、ArrayListは内部の格納方法や処理を具体化する。')] },
      { type: 'text', content: [text('変数listを使った呼び出しが可能かは、'), term('compileTimeType', '宣言型'), text('のList<String>から利用可能と判定できるメソッドかどうかを基にコンパイル時に決まる。ArrayList独自の操作がすべて使えるわけではない。オーバーライドされたインスタンスメソッドの実装は、実際のオブジェクトに応じて実行時に選ばれる。')] },
      { type: 'text', content: [text('必要な共通操作をList型から利用できるなら、別のList実装へ差し替えても呼び出し側のコードを保てる場合がある。これも'), term('polymorphism', 'ポリモーフィズム'), text('の利用例。インタフェースの契約と実装クラスの具体的な処理を分けて考える。')] },
    ],
  },
] satisfies Question[];
