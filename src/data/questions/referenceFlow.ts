import { code, term, text } from '../helpers';
import type { Question } from '../types';

export const additionalReferenceFlowQuestions = [
  {
    id: 'reference-alias-field-update',
    category: 'B',
    topic: '参照先の共有',
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `class Box {
    int value;
}

class Main {
    public static void main(String[] args) {
        Box a = new Box();
        Box b = a;
        b.value = 4;
        System.out.println(a.value + ":" + b.value);
    }
}` },
    ],
    answer: [code('4:4')],
    explanation: [
      { type: 'steps', items: [
        [code('new Box()'), text('でオブジェクトを1つ生成する。説明用にBox Aと呼ぶ。a → Box A (value=0)。')],
        [code('Box b = a;'), text('で'), term('reference', '参照値'), text('をコピーする。a → Box A (value=0)、b → Box A (value=0)。変数は2つだが参照先は1つ。')],
        [code('b.value = 4;'), text('はBox Aのフィールドを変更する。a → Box A (value=4)、b → Box A (value=4)。')],
        [text('同じオブジェクトの状態を両方の変数から読むため、'), code('4:4'), text('を出力する。')],
      ] },
      { type: 'text', content: [text('変わったのは参照先のフィールドで、aやbの参照値ではない。Box Aは参照関係を説明するための識別名で、Javaの識別子や実際のメモリアドレスではない。')] },
    ],
  },
  {
    id: 'reference-reassignment',
    category: 'B',
    topic: '参照の再代入',
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `class Box {
    int value;
}

class Main {
    public static void main(String[] args) {
        Box a = new Box();
        a.value = 1;
        Box b = a;
        b = new Box();
        b.value = 5;
        System.out.println(a.value + ":" + b.value);
    }
}` },
    ],
    answer: [code('1:5')],
    explanation: [
      { type: 'steps', items: [
        [text('最初のオブジェクトをBox Aと呼ぶ。valueに1を代入し、bへ'), term('reference', '参照値'), text('をコピーすると、a → Box A (value=1)、b → Box A (value=1)。')],
        [code('b = new Box();'), text('で別のBox Bを生成し、bだけにその参照値を再代入する。a → Box A (value=1)、b → Box B (value=0)。')],
        [code('b.value = 5;'), text('はBox Bだけを変更する。a → Box A (value=1)、b → Box B (value=5)。')],
        [text('aは元のBox Aを参照し続けるため、'), code('1:5'), text('を出力する。')],
      ] },
      { type: 'text', content: [text('同じオブジェクトを共有したままフィールドを変更する場合は、その変更が両方から見える。今回は先にbの参照値を変更したので、その後のフィールド変更はaの参照先に影響しない。Box A・Box Bは説明用の識別名で、Javaの識別子やメモリアドレスではない。')] },
    ],
  },
  {
    id: 'primitive-parameter-copy',
    category: 'B',
    topic: 'プリミティブ値の引数渡し',
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `class Main {
    static void inc(int n) {
        n++;
    }

    public static void main(String[] args) {
        int value = 5;
        inc(value);
        System.out.println(value);
    }
}` },
    ],
    answer: [code('5')],
    explanation: [
      { type: 'steps', items: [
        [text('呼び出し元のvalueは5を保持する。'), code('inc(value)'), text('では、そのプリミティブ値5を仮引数nへコピーする。')],
        [code('n++'), text('でnは6になる。nとvalueは別の変数なので、valueは5のまま。')],
        [text('incから戻ってvalueを読むため、'), code('5'), text('を出力する。')],
      ] },
      { type: 'text', content: [text('Javaの引数渡しは値渡し。'), term('primitiveType', 'プリミティブ型'), text('の場合はプリミティブ値がコピーされ、呼び出し元の変数自体を渡すわけではない。メソッド内の仮引数への変更は呼び出し元へ連動しない。')] },
    ],
  },
  {
    id: 'reference-parameter-mutation',
    category: 'B',
    topic: '参照型引数の状態遷移',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `class Box {
    int value;
}

class Main {
    static void change(Box box) {
        box.value = 7;
        box = new Box();
        box.value = 9;
    }

    public static void main(String[] args) {
        Box original = new Box();
        original.value = 2;
        change(original);
        System.out.println(original.value);
    }
}` },
    ],
    answer: [code('7')],
    explanation: [
      { type: 'text', content: [text('Javaの引数渡しは値渡し。参照型では'), term('reference', '参照値'), text('がコピーされる。Box A・Box Bは説明用の識別名で、Javaの識別子や実際のメモリアドレスではない。')] },
      { type: 'steps', items: [
        [text('開始時：original → Box A (value=2)。')],
        [text('change呼び出し直後：original → Box A (value=2)、box → Box A (value=2)。コピーされた参照値で同じオブジェクトを指す。')],
        [code('box.value = 7;'), text('の後：original → Box A (value=7)、box → Box A (value=7)。共有するオブジェクトの状態が変わる。')],
        [code('box = new Box();'), text('の後：original → Box A (value=7)、box → Box B (value=0)。変わったのは仮引数boxの参照値だけ。')],
        [code('box.value = 9;'), text('の後：original → Box A (value=7)、box → Box B (value=9)。変更する対象は新しいBox B。')],
        [text('呼び出し元のoriginalはBox Aを参照したままなので、'), code('7'), text('を出力する。')],
      ] },
      { type: 'text', content: [text('仮引数への再代入は呼び出し元の変数を変更しない。オブジェクトの状態変更と、参照値を保持する変数への再代入を区別する。')] },
    ],
  },
  {
    id: 'array-alias-mutation',
    category: 'B',
    topic: '配列の参照共有',
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `class Main {
    public static void main(String[] args) {
        int[] a = {1, 2};
        int[] b = a;
        b[0] = b[1];
        a[1] = 5;
        System.out.println(a[0] + ":" + b[1]);
    }
}` },
    ],
    answer: [code('2:5')],
    explanation: [
      { type: 'steps', items: [
        [text('配列はオブジェクト。bへ'), term('reference', '参照値'), text('をコピーすると、aとbは同じ配列[1, 2]を参照する。配列自体はコピーされない。')],
        [code('b[0] = b[1];'), text('で2番目の要素のint値2を最初の要素へ代入する。共有する配列は[2, 2]になる。')],
        [code('a[1] = 5;'), text('で同じ配列の2番目の要素を変更する。配列は[2, 5]になる。')],
        [text('a[0]は2、b[1]は5なので、'), code('2:5'), text('を出力する。')],
      ] },
      { type: 'text', content: [text('変わるのは配列の要素の値。aとbの参照値は変わらず、どちらから参照しても同じ要素の状態が見える。')] },
    ],
  },
  {
    id: 'enhanced-for-object-mutation',
    category: 'B',
    topic: '拡張forとオブジェクト',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `class Box {
    int value;

    Box(int value) {
        this.value = value;
    }
}

class Main {
    public static void main(String[] args) {
        Box[] boxes = {new Box(1), new Box(2)};
        for (Box b : boxes) {
            b.value++;
            b = new Box(99);
        }
        System.out.println(boxes[0].value + ":" + boxes[1].value);
    }
}` },
    ],
    answer: [code('2:3')],
    explanation: [
      { type: 'text', content: [term('enhancedFor', '拡張for'), text('のループ変数bには、反復ごとに配列要素の'), term('reference', '参照値'), text('がコピーされる。Box A・Box Bは説明用の識別名で、Javaの識別子やメモリアドレスではない。')] },
      { type: 'steps', items: [
        [text('開始時：boxes[0] → Box A (value=1)、boxes[1] → Box B (value=2)。')],
        [text('1回目の反復でbもBox Aを参照する。b.value++によりBox Aのvalueは2になる。')],
        [code('b = new Box(99);'), text('はbの参照値だけを変更する。boxes[0]はBox Aを参照したまま。')],
        [text('2回目の反復でbにboxes[1]の参照値が代入される。Box Bのvalueが3になり、続くbへの再代入もboxes[1]には影響しない。')],
        [text('元の配列要素の参照先はBox A (value=2)、Box B (value=3)なので、'), code('2:3'), text('を出力する。')],
      ] },
      { type: 'text', content: [text('プリミティブ型のループ変数では、その値を変えても元の配列要素は変わらない。参照型でもループ変数への再代入は配列要素を置き換えないが、コピーされた参照値を通じて元のオブジェクトの状態は変更できる。')] },
    ],
  },
  {
    id: 'string-concat-reassignment',
    category: 'B',
    topic: 'Stringと再代入',
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `class Main {
    public static void main(String[] args) {
        String a = "A";
        String b = a;
        a.concat("B");
        a = a.concat("C");
        System.out.println(a + ":" + b);
    }
}` },
    ],
    answer: [code('AC:A')],
    explanation: [
      { type: 'steps', items: [
        [text('bにaの参照値をコピーし、最初は両方が同じString "A"を参照する。')],
        [code('a.concat("B")'), text('は結果の"AB"を返すが、戻り値を使わないためaもbも"A"を参照したまま。')],
        [code('a = a.concat("C")'), text('で結果の"AC"への参照をaへ再代入する。bの参照値は変わらず、元の"A"を参照し続ける。')],
        [text('aは"AC"、bは"A"を参照するので、'), code('AC:A'), text('を出力する。')],
      ] },
      { type: 'text', content: [text('Stringは'), term('immutable', '不変オブジェクト'), text('。concatは元のStringを書き換えない。今回は変数aの参照値が変わったのであり、bが参照している元のオブジェクトは変更されていない。')] },
    ],
  },
  {
    id: 'arraylist-alias-mutation',
    category: 'B',
    topic: 'ArrayListの参照共有',
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `import java.util.ArrayList;
import java.util.List;

class Main {
    public static void main(String[] args) {
        List<String> a = new ArrayList<>();
        a.add("A");
        List<String> b = a;
        b.add("B");
        System.out.println(a.size() + ":" + a.get(1));
    }
}` },
    ],
    answer: [code('2:B')],
    explanation: [
      { type: 'steps', items: [
        [text('ArrayListを1つ生成し、a経由で"A"を追加する。要素は["A"]、要素数は1。')],
        [code('List<String> b = a;'), text('で'), term('reference', '参照値'), text('をコピーする。aとbは同じArrayListオブジェクトを参照する。')],
        [code('b.add("B");'), text('で共有するリストの状態を変更する。要素は["A", "B"]になり、aから見ても要素数は2。')],
        [text('添字は0から始まるのでa.get(1)は"B"を返し、'), code('2:B'), text('を出力する。')],
      ] },
      { type: 'text', content: [text('addは参照先オブジェクトの変更で、変数への再代入ではない。aとbの参照値はそのまま。もしbだけに別のリストへの参照を再代入すれば、その後bから行う変更は元のリストに影響しない。')] },
    ],
  },
] satisfies Question[];
