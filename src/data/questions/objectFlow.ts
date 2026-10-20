import { code, term, text } from '../helpers';
import type { Question } from '../types';

export const additionalObjectFlowQuestions = [
  {
    id: 'constructor-this-field-update',
    category: 'B',
    topic: 'thisとフィールドの更新',
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `class Box {
    int value;

    Box(int value) {
        value = value;
        value++;
        this.value = value;
        value++;
    }
}

class Main {
    public static void main(String[] args) {
        Box box = new Box(2);
        System.out.println(box.value);
    }
}` },
    ],
    answer: [code('3')],
    explanation: [
      { type: 'text', content: [text('仮引数とフィールドは別の変数。同名の仮引数があるため、単純名valueは仮引数を指す。'), term('thisReference', 'this参照'), text('を使うthis.valueは、初期化中のBoxのフィールドを指す。')] },
      { type: 'steps', items: [
        [text('コンストラクタ呼び出し直後は、仮引数valueが2、フィールドthis.valueがデフォルト値0。')],
        [code('value = value;'), text('は仮引数自身への代入なので、仮引数は2、フィールドは0のまま。')],
        [text('最初のvalue++で仮引数が3になる。フィールドはまだ0。')],
        [code('this.value = value;'), text('で仮引数の値3をフィールドへコピーする。仮引数は3、フィールドも3。')],
        [text('最後のvalue++で仮引数は4になるが、フィールドは3のまま。仮引数の変更はフィールドへ自動的に反映されない。')],
        [text('生成後のbox.valueを読むので、'), code('3'), text('を出力する。')],
      ] },
    ],
  },
  {
    id: 'static-shared-counter',
    category: 'B',
    topic: 'staticとインスタンスの状態',
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `class Counter {
    static int count;
    int id = ++count;
}

class Main {
    public static void main(String[] args) {
        Counter a = new Counter();
        Counter b = new Counter();
        System.out.println(a.id + ":" + b.id + ":" + Counter.count);
    }
}` },
    ],
    answer: [code('1:2:2')],
    explanation: [
      { type: 'text', content: [text('countはクラスに属する'), term('staticMember', 'staticフィールド'), text('で、初期値は0。idは各インスタンスが独立して持つフィールド。')] },
      { type: 'steps', items: [
        [text('1個目の生成時、idの初期化式++countが共有するcountを1にし、その値1をaの参照先のidへ代入する。')],
        [text('2個目の生成時、同じcountを2にし、その値2をbの参照先のidへ代入する。aの参照先のidは1のまま。')],
        [text('a.idは1、b.idは2、Counter.countは2なので、'), code('1:2:2'), text('を出力する。')],
      ] },
      { type: 'text', content: [text('インスタンス生成のたびにcountが0へ戻るわけではない。共有するcountと、各オブジェクトの状態であるidは別。idは生成時の値をコピーして保持し、その後のcountの変更に連動しない。')] },
    ],
  },
  {
    id: 'inheritance-initialization-order',
    category: 'B',
    topic: '継承と初期化順',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `class Parent {
    {
        System.out.print("A");
    }

    int value = init();

    int init() {
        System.out.print("B");
        return 1;
    }

    Parent() {
        System.out.print("C");
    }
}

class Child extends Parent {
    int childValue = childInit();

    int childInit() {
        System.out.print("D");
        return 2;
    }

    {
        System.out.print("E");
    }

    Child() {
        System.out.print("F");
    }
}

class Main {
    public static void main(String[] args) {
        new Child();
    }
}` },
    ],
    answer: [code('ABCDEF')],
    explanation: [
      { type: 'text', content: [code('new Child()'), text('では、まず全インスタンスフィールドに'), term('defaultValue', 'デフォルト値'), text('が設定される。親側のインスタンス初期化とコンストラクタ本体を終えてから、子側へ進む。同じクラス内のフィールド初期化子とインスタンス初期化ブロックは、ソースコードの記述順に実行する。')] },
      { type: 'steps', items: [
        [text('親のインスタンス初期化ブロックが先に書かれているため、Aを出力する。この時点ではvalueもchildValueも0。')],
        [text('親のフィールド初期化子がinit()を呼び、Bを出力する。戻り値1をvalueへ代入する。')],
        [text('親の'), term('constructor', 'コンストラクタ'), text('本体がCを出力する。親側の処理が終わる。')],
        [text('子のフィールド初期化子がchildInit()を呼び、Dを出力する。戻り値2をchildValueへ代入する。')],
        [text('子のインスタンス初期化ブロックがEを出力する。子ではフィールド初期化子より後に書かれている。')],
        [text('子のコンストラクタ本体がFを出力する。全体の出力は'), code('ABCDEF'), text('になる。')],
      ] },
      { type: 'text', content: [text('フィールド初期化子が常にブロックより先なのではない。この例では親はブロック→フィールド、子はフィールド→ブロック。メソッドの宣言位置ではなく、初期化子から呼び出す時点でメソッド本体を実行する。staticなクラス初期化ではなく、今回生成するインスタンスの初期化順を扱っている。')] },
    ],
  },
  {
    id: 'overload-declared-argument-type',
    category: 'B',
    topic: 'オーバーロードの選択',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `class Animal {}
class Dog extends Animal {}

class Main {
    static void show(Animal a) {
        System.out.print("A");
    }

    static void show(Dog d) {
        System.out.print("D");
    }

    public static void main(String[] args) {
        Animal animal = new Dog();
        show(animal);
    }
}` },
    ],
    answer: [code('A')],
    explanation: [
      { type: 'steps', items: [
        [text('animalの宣言型はAnimal。実際に参照しているオブジェクトのクラスはDog。')],
        [term('overload', 'オーバーロード'), text('解決はコンパイル時に行う。引数式animalの'), term('compileTimeType', 'コンパイル時の型'), text('がAnimalなので、show(Animal)を選ぶ。')],
        [text('選ばれたshow(Animal)の本体を実行し、'), code('A'), text('を出力する。参照先がDogであることを理由にshow(Dog)へ選び直すことはない。')],
      ] },
      { type: 'text', content: [text('この呼び出しを'), code('show((Dog) animal)'), text('へ置き換えると、キャストによって引数式のコンパイル時の型がDogになるためshow(Dog)を選び、Dを出力する。参照先はもともとDogなので、このキャストは実行時にも成功する。')] },
      { type: 'text', content: [text('引数の型などを基に呼び出すメソッドを選ぶオーバーロード解決と、'), term('override', 'オーバーライド'), text('されたインスタンスメソッドの実装を実行時に選ぶ動的ディスパッチは別の仕組み。ここでのshowはstaticメソッド。')] },
    ],
  },
  {
    id: 'override-runtime-dispatch',
    category: 'B',
    topic: 'オーバーライドの実行',
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `class Parent {
    void show() {
        System.out.print("P");
    }
}

class Child extends Parent {
    @Override
    void show() {
        System.out.print("C");
        super.show();
    }
}

class Main {
    public static void main(String[] args) {
        Parent obj = new Child();
        obj.show();
    }
}` },
    ],
    answer: [code('CP')],
    explanation: [
      { type: 'steps', items: [
        [text('objの宣言型はParent。Parentからshow()を利用できるため、obj.show()はコンパイル時に呼び出し可能と判定される。')],
        [term('runtimeType', '実行時のオブジェクト型'), text('はChildなので、'), term('override', 'オーバーライド'), text('したChild.show()を実行する。まずCを出力する。')],
        [code('super.show()'), text('は親クラスの実装Parent.show()を呼び、Pを出力する。全体は'), code('CP'), text('になる。')],
      ] },
      { type: 'text', content: [text('コンパイル時の呼び出し可能性の判定と、実行時の実装選択は別。引数構成からメソッドを選ぶオーバーロードとは異なり、今回は同じshow()のオーバーライド実装を選ぶ。super.show()は親の実装を明示的に呼ぶので、Child.show()を再び呼び出すわけではない。')] },
    ],
  },
  {
    id: 'field-hiding-vs-override',
    category: 'B',
    topic: 'フィールドとメソッドの選択',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `class Parent {
    int value = 1;

    void show() {
        System.out.print("P");
    }
}

class Child extends Parent {
    int value = 2;

    @Override
    void show() {
        System.out.print("C");
    }
}

class Main {
    public static void main(String[] args) {
        Parent obj = new Child();
        System.out.print(obj.value);
        obj.show();
    }
}` },
    ],
    answer: [code('1C')],
    explanation: [
      { type: 'text', content: [text('Childのインスタンス内には、Parent側のvalueとChild側のvalueが別々に存在する。子の同名フィールドが親のフィールドを置き換えるわけではない。これを'), term('fieldHiding', 'フィールドの隠蔽'), text('として区別する。')] },
      { type: 'steps', items: [
        [text('Childを生成すると、Parent側のvalueは1、Child側のvalueは2に初期化される。objの宣言型はParent。')],
        [code('obj.value'), text('は式objの'), term('compileTimeType', 'コンパイル時の型'), text('がParentなので、Parent側のフィールドを参照して1を出力する。')],
        [code('obj.show()'), text('では実際のオブジェクトがChildなので、'), term('override', 'オーバーライド'), text('されたChild.show()を実行し、Cを出力する。全体は'), code('1C'), text('。')],
      ] },
      { type: 'text', content: [text('フィールドアクセスには、インスタンスメソッドと同じ動的ディスパッチは適用されない。'), code('((Child) obj).value'), text('ならキャストした式のコンパイル時の型がChildとなり、子のフィールドの値2を得る。キャストによってオブジェクトや各フィールドの値が変化するわけではない。')] },
    ],
  },
  {
    id: 'interface-runtime-dispatch',
    category: 'B',
    topic: 'インタフェースと多態性',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `interface Greeter {
    void greet();
}

class A implements Greeter {
    public void greet() {
        System.out.print("A");
    }
}

class B implements Greeter {
    public void greet() {
        System.out.print("B");
    }
}

class Main {
    public static void main(String[] args) {
        Greeter g = new A();
        g.greet();
        g = new B();
        g.greet();
    }
}` },
    ],
    answer: [code('AB')],
    explanation: [
      { type: 'text', content: [text('Greeterは'), term('interface', 'インタフェース'), text('で、AとBはそれぞれの実装クラス。どちらのインスタンスもGreeter型の変数で参照できる。')] },
      { type: 'steps', items: [
        [code('Greeter g = new A();'), text('でgはAのインスタンスを参照する。g.greet()ではAの実装が動き、Aを出力する。')],
        [code('g = new B();'), text('でgの参照値を再代入し、Bのインスタンスを参照するようになる。AのオブジェクトをBへ変形したわけではない。')],
        [text('次のg.greet()ではBの実装が動き、Bを出力する。全体は'), code('AB'), text('になる。')],
      ] },
      { type: 'text', content: [text('gの宣言型は一貫してGreeter。呼び出し可能かはGreeter型から判定し、実際の実装は参照先に応じて実行時に選ぶ。これは'), term('polymorphism', 'ポリモーフィズム'), text('の利用例で、再代入により変わったのはgの参照値であり、宣言型ではない。')] },
    ],
  },
] satisfies Question[];
