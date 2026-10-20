import { code, term, text } from '../helpers';
import type { Question } from '../types';

// Java SE 17, without preview features. All snippets are method bodies.
export const additionalControlFlowQuestions = [
  {
    id: 'if-dangling-else',
    category: 'B',
    topic: 'if / elseの対応関係',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内で実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `int x = 0;

if (true)
    if (false)
        x = 1;
    else
        x = 2;

System.out.println(x);` },
    ],
    answer: [code('2')],
    explanation: [
      { type: 'text', content: [term('danglingElse', 'elseの対応関係'), text('は、対応するelseを持たない最も近いifで決まる。ここでは内側の'), code('if (false)'), text('に対応し、'), code('x = 2'), text('を実行して'), code('2'), text('を出力する。')] },
      { type: 'text', content: [text('外側の'), code('if (true)'), text('にelseが対応するわけではない。字下げではなく、文の構造で判断する。')] },
    ],
  },
  {
    id: 'if-int-condition',
    category: 'C',
    topic: 'ifの条件式',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くとコンパイルできる？')] },
      { type: 'code', language: 'java', code: `int n = 1;

if (n) {
    System.out.println("YES");
}` },
    ],
    answer: [text('コンパイルエラー。')],
    explanation: [
      { type: 'text', content: [code('if'), text('の条件式には'), code('boolean'), text('型または'), code('Boolean'), text('型が必要。'), term('primitiveType', 'プリミティブ型'), text('の'), code('int'), text('を自動的にtrueとして扱うことはできず、コンパイルエラーになる。')] },
      { type: 'text', content: [text('実行時のエラーではなく、実行前の型チェックで拒否される。'), code('if (n == 1)'), text('のように真偽値を返す式にすればよい。')] },
    ],
  },
  {
    id: 'switch-colon-fall-through',
    category: 'B',
    topic: 'switch文のフォールスルー',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `int n = 2;

switch (n) {
    case 1: System.out.print("A"); break;
    case 2: System.out.print("B");
    case 3: System.out.print("C");
    default: System.out.print("D");
}` },
    ],
    answer: [code('BCD')],
    explanation: [
      { type: 'text', content: [code('n'), text('は'), code('2'), text('なのでcase 2から実行する。breakがなく、'), term('switchFallThrough', 'フォールスルー'), text('でcase 3とdefaultの処理にも進むため、'), code('BCD'), text('を出力する。')] },
      { type: 'text', content: [code('default'), text('もフォールスルーで実行される。一致するcaseがないときだけ実行される、とは限らない。')] },
    ],
  },
  {
    id: 'switch-arrow-no-fall-through',
    category: 'B',
    topic: 'switchルール',
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `int n = 2;

switch (n) {
    case 1 -> System.out.print("A");
    case 2 -> System.out.print("B");
    default -> System.out.print("D");
}

System.out.print("X");` },
    ],
    answer: [code('BX')],
    explanation: [
      { type: 'text', content: [code('case 2'), text('でBを出力し、switch文の終了後にXを出力する。'), term('switchRule', 'switchルール'), text('（'), code('->'), text('形式）では、次のルールへ'), term('switchFallThrough', 'フォールスルー'), text('しない。')] },
      { type: 'text', content: [code('case :'), text('形式と違い、後続のdefaultへ進まない。'), code('->'), text('はswitch文でも使え、この例は値を生成するswitch式ではない。')] },
    ],
  },
  {
    id: 'switch-expression-yield-value',
    category: 'B',
    topic: 'switch式とyield',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `int n = 2;

int result = switch (n) {
    case 1 -> 10;
    case 2 -> {
        int temp = n * 10;
        yield temp + 1;
    }
    default -> 0;
};

System.out.println(result);` },
    ],
    answer: [code('21')],
    explanation: [
      { type: 'text', content: [text('case 2が選ばれ、tempに20を代入する。'), term('yieldStatement', 'yield文'), code('yield temp + 1;'), text('が'), term('switchExpression', 'switch式'), text('の値21を生成し、resultに代入するため、'), code('21'), text('を出力する。')] },
      { type: 'text', content: [code('yield'), text('はメソッドからのreturnではない。switch式に値を渡し、その後もメソッド内の処理が続く。breakは結果の値を渡すためには使えない。')] },
    ],
  },
  {
    id: 'switch-expression-non-exhaustive',
    category: 'C',
    topic: 'switch式の網羅性',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くとコンパイルできる？')] },
      { type: 'code', language: 'java', code: `int n = 1;

int result = switch (n) {
    case 1 -> 10;
    case 2 -> 20;
};

System.out.println(result);` },
    ],
    answer: [text('コンパイルエラー。')],
    explanation: [
      { type: 'text', content: [term('switchExhaustiveness', 'switch式の網羅性'), text('はコンパイル時に必要。int型には1と2以外の値もあり、このコードにはdefaultがないため、すべての値を扱えない。')] },
      { type: 'text', content: [text('nの初期値が1でもコンパイルエラーになる。ただしenumの全定数を列挙する場合は、defaultなしでも網羅性を満たせる。')] },
    ],
  },
  {
    id: 'switch-long-selector',
    category: 'C',
    topic: 'switchのセレクタ型',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くとコンパイルできる？')] },
      { type: 'code', language: 'java', code: `long n = 2L;

switch (n) {
    case 2 -> System.out.print("A");
    default -> System.out.print("B");
}` },
    ],
    answer: [text('コンパイルエラー。')],
    explanation: [
      { type: 'text', content: [text('Java SE 17の標準仕様では、switchのセレクタ型に'), code('long'), text('は使えない。値が2でも式の型はlongなので、コンパイル時の型チェックで拒否される。')] },
      { type: 'text', content: [text('使える型は'), code('byte'), text('、'), code('short'), text('、'), code('char'), text('、'), code('int'), text('と対応するラッパー型（Byte・Short・Character・Integer）、String、enum。'), term('switchRule', 'switchルール'), text('の形式でも型の制約は同じ。')] },
    ],
  },
  {
    id: 'switch-duplicate-constant',
    category: 'C',
    topic: 'caseラベルの定数',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くとコンパイルできる？')] },
      { type: 'code', language: 'java', code: `int n = 2;

switch (n) {
    case 1 + 1 -> System.out.print("A");
    case 2 -> System.out.print("B");
    default -> System.out.print("C");
}` },
    ],
    answer: [text('コンパイルエラー。')],
    explanation: [
      { type: 'text', content: [code('1 + 1'), text('はコンパイル時定数式で値は2。case 2と同じ値になり、同じswitchブロック内でcase定数の値は重複できないため、コンパイルエラーになる。')] },
      { type: 'text', content: [term('switchRule', 'switchルール'), text('のcaseに書かれた式の見た目ではなく、定数式の値で重複を判定する。')] },
    ],
  },
  {
    id: 'for-condition-update-order',
    category: 'B',
    topic: 'for文の実行順',
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `int i = 0;

for (; i < 3; i++) {
    System.out.print(i);
}

System.out.println(":" + i);` },
    ],
    answer: [code('012:3')],
    explanation: [
      { type: 'text', content: [text('条件判定→本体→更新式の順で繰り返し、本体で0・1・2を出力する。最後の更新でiが3になり、次の条件判定で終了するため、出力は'), code('012:3'), text('。')] },
      { type: 'text', content: [text('iはforの外で宣言されていて、ループ後も'), term('scope', 'スコープ'), text('内にある。終了後に参照する値は3。')] },
    ],
  },
  {
    id: 'for-continue-update',
    category: 'B',
    topic: 'for文のcontinue',
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `int sum = 0;

for (int i = 0; i < 4; i++) {
    if (i == 2) continue;
    sum += i;
}

System.out.println(sum);` },
    ],
    answer: [code('4')],
    explanation: [
      { type: 'text', content: [text('iが2の回だけcontinueで'), term('compoundAssignment', '複合代入'), code('sum += i'), text('を飛ばす。加算する値は0・1・3なので、'), code('4'), text('を出力する。')] },
      { type: 'text', content: [code('continue'), text('後もforの更新式'), code('i++'), text('は実行される。breakのようにループを終了するわけでも、更新式まで飛ばすわけでもない。')] },
    ],
  },
  {
    id: 'while-do-while-first-check',
    category: 'B',
    topic: 'whileとdo-while',
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `int n = 3;

while (n < 3) {
    System.out.print("W");
}

do {
    System.out.print("D");
} while (n < 3);` },
    ],
    answer: [code('D')],
    explanation: [
      { type: 'text', content: [text('whileは本体より先に条件を判定する。'), term('localVariable', 'ローカル変数'), text('nは3で条件がfalseなのでWは出力しない。do-whileは本体を先に実行し、Dを1回出力してから条件を判定して終了する。')] },
      { type: 'text', content: [text('最初から条件がfalseでも、do-whileでは本体を1回実行する。違いは条件判定のタイミング。')] },
    ],
  },
  {
    id: 'enhanced-for-primitive-copy',
    category: 'B',
    topic: '拡張for文の変数',
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `int[] nums = {1, 2, 3};

for (int n : nums) {
    n += 10;
}

System.out.println(nums[0] + ":" + nums[2]);` },
    ],
    answer: [code('1:3')],
    explanation: [
      { type: 'text', content: [term('enhancedFor', '拡張for文'), text('では各要素の値をnに代入する。intは'), term('primitiveType', 'プリミティブ型'), text('なので値がコピーされ、nを書き換えても元の配列要素は変わらず、'), code('1:3'), text('を出力する。')] },
      { type: 'text', content: [text('参照型配列ならコピーされるのは'), term('reference', '参照'), text('。ループ変数への再代入は要素を置き換えないが、参照先のオブジェクトの状態は変更できる場合がある。')] },
    ],
  },
  {
    id: 'switch-expression-block-missing-yield',
    category: 'C',
    topic: 'switch式の結果生成',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くとコンパイルできる？')] },
      { type: 'code', language: 'java', code: `int n = 1;

int result = switch (n) {
    case 1 -> {
        System.out.print("A");
    }
    default -> 0;
};

System.out.println(result);` },
    ],
    answer: [text('コンパイルエラー。')],
    explanation: [
      { type: 'text', content: [term('switchExpression', 'switch式'), text('のcase 1のブロックが、値を生成せず正常終了するためコンパイルエラーになる。この例では'), term('yieldStatement', 'yield文'), text('で結果を渡すなどの修正が必要。コンパイルできないのでAも出力されない。')] },
      { type: 'text', content: [text('ブロックに必ずyieldが必要とは限らない。throwなどで正常終了しない経路は許されるが、値を生成せず正常終了する経路は許されない。')] },
    ],
  },
  {
    id: 'labeled-break-nested-loop',
    category: 'B',
    topic: 'ラベル付きbreak',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `int count = 0;

outer:
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (i == 1 && j == 1) break outer;
        count++;
    }
}

System.out.println(count);` },
    ],
    answer: [code('4')],
    explanation: [
      { type: 'text', content: [text('i=0で3回加算し、i=1, j=0でcountは4になる。i=1, j=1で'), term('labeledJump', 'ラベル付きbreak'), code('break outer'), text('を実行し、外側のforごと終了して'), code('4'), text('を出力する。')] },
      { type: 'text', content: [text('この例の通常のbreakは最も内側のループだけを終了する。ラベル付きbreakは指定したラベルの文の外へ移動する。')] },
    ],
  },
  {
    id: 'labeled-continue-nested-loop',
    category: 'B',
    topic: 'ラベル付きcontinue',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードを実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: `int count = 0;

outer:
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (j == 1) continue outer;
        count++;
    }
}

System.out.println(count);` },
    ],
    answer: [code('3')],
    explanation: [
      { type: 'text', content: [text('各iでj=0のとき1回加算し、j=1で'), term('labeledJump', 'ラベル付きcontinue'), code('continue outer'), text('を実行する。外側のforの更新式i++へ進むため、加算は3回で出力は'), code('3'), text('。')] },
      { type: 'text', content: [code('break outer'), text('と違い、外側のループ自体は終了しない。通常のcontinueなら内側のループの次の反復へ進む。')] },
    ],
  },
] satisfies Question[];
