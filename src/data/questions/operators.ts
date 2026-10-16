import { code, term, text } from '../helpers';
import type { Question } from '../types';

// 「var・演算子・型変換」の14問。コード例はすべてメソッド本体を想定する。
// Java SE 17の根拠:
// https://docs.oracle.com/javase/specs/jls/se17/html/jls-14.html#jls-14.4.1
// https://docs.oracle.com/javase/specs/jls/se17/html/jls-5.html#jls-5.6
// https://docs.oracle.com/javase/specs/jls/se17/html/jls-5.html#jls-5.1.3
// https://docs.oracle.com/javase/specs/jls/se17/html/jls-15.html
// https://docs.oracle.com/javase/specs/jls/se17/html/jls-15.html#jls-15.26.2
export const additionalOperatorQuestions = [
  {
    id: 'var-type-inference',
    category: 'A',
    topic: 'ローカル変数の型推論',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くと、'), code('value'), text('の型は何になる？ また、その型はいつ決まる？')] },
      { type: 'code', language: 'java', code: 'var value = 10;' },
    ],
    answer: [code('int'), text('型。初期化式'), code('10'), text('の型を基に、コンパイル時に決まる。')],
    explanation: [
      { type: 'text', content: [code('10'), text('は'), code('int'), text('型の整数リテラル。'), term('localVariableTypeInference', 'ローカル変数の型推論'), text('により、初期化式の型から'), code('value'), text('は'), code('int'), text('型のローカル変数になる。')] },
      { type: 'text', content: [text('型はコンパイル時に決まり、実行時に別の型へ変化する仕組みではない。'), code('var'), text('自体が変数の型になるわけでもない。')] },
    ],
  },
  {
    id: 'var-requires-initializer',
    category: 'C',
    topic: 'varの宣言ルール',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くとコンパイルできる？')] },
      { type: 'code', language: 'java', code: 'var value;' },
    ],
    answer: [text('コンパイルエラー。')],
    explanation: [
      { type: 'text', content: [code('var'), text('による'), term('localVariableTypeInference', 'ローカル変数の型推論'), text('には初期化式が必要。この宣言には初期化式がなく、推論する型を決定できない。')] },
      { type: 'text', content: [code('int value;'), text('のように型を明示した宣言は可能だが、'), code('var value;'), text('は初期化式がないため宣言自体が認められない。値を読む前の代入チェックとは別の、宣言そのもののエラーで、実行には進まない。')] },
    ],
  },
  {
    id: 'var-reassignment-type',
    category: 'C',
    topic: '型推論後の再代入',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くとコンパイルできる？')] },
      { type: 'code', language: 'java', code: 'var value = 10;\nvalue = "Java";' },
    ],
    answer: [text('2行目でコンパイルエラー。')],
    explanation: [
      { type: 'text', content: [term('localVariableTypeInference', 'ローカル変数の型推論'), text('により、初期化式'), code('10'), text('から'), code('value'), text('の型はコンパイル時に'), code('int'), text('と決まる。2行目の'), code('"Java"'), text('は'), code('String'), text('型の値なので、'), code('int'), text('型変数へ代入できない。')] },
      { type: 'text', content: [code('var'), text('で宣言しても型が動的に切り替わるわけではない。コード全体がコンパイルに失敗するため、実行には進まない。')] },
    ],
  },
  {
    id: 'integer-division-before-assignment',
    category: 'B',
    topic: '整数除算と代入',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内で実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: 'double result = 5 / 2;\n\nSystem.out.println(result);' },
    ],
    answer: [code('2.0')],
    explanation: [
      { type: 'steps', items: [
        [code('5'), text('と'), code('2'), text('は、どちらも'), code('int'), text('型の整数リテラル。')],
        [code('5 / 2'), text('は整数除算になり、小数部分を0方向に切り詰める。式の結果は'), code('int'), text('型の'), code('2'), text('。')],
        [code('double'), text('型変数への代入時に拡大変換され、'), code('result'), text('には'), code('2.0'), text('が格納される。')],
        [code('println'), text('で'), code('2.0'), text('が出力される。')],
      ] },
      { type: 'text', content: [text('左辺の変数が'), code('double'), text('型でも、右辺の整数除算が浮動小数点除算に変わるわけではない。式の型と、代入先の変数の型を分けて考える。')] },
    ],
  },
  {
    id: 'remainder-negative-dividend',
    category: 'B',
    topic: '剰余演算',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内で実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: 'int a = 7 % 3;\nint b = -7 % 3;\n\nSystem.out.println(a + ":" + b);' },
    ],
    answer: [code('1:-1')],
    explanation: [
      { type: 'text', content: [code('%'), text('は'), term('remainderOperator', '剰余演算子'), text('。整数除算では'), code('7 / 3'), text('が'), code('2'), text('なので'), code('7 % 3'), text('は'), code('1'), text('。'), code('-7 / 3'), text('は0方向に切り詰めて'), code('-2'), text('となり、'), code('-7 % 3'), text('は'), code('-1'), text('になる。')] },
      { type: 'text', content: [text('整数の剰余は'), code('(a / b) * b + (a % b) == a'), text('を満たす。結果が0でない場合、その符号は左辺（被除数）の符号に従い、常に0以上になるわけではない。出力は'), code('1:-1'), text('。')] },
    ],
  },
  {
    id: 'operator-precedence-multiplication',
    category: 'B',
    topic: '演算子の優先順位',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内で実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: 'System.out.println(2 + 3 * 4);' },
    ],
    answer: [code('14')],
    explanation: [
      { type: 'text', content: [code('*'), text('は'), code('+'), text('より優先順位が高いため、式は'), code('2 + (3 * 4)'), text('と解釈され、結果は'), code('14'), text('になる。'), code('(2 + 3) * 4'), text('と括弧でまとめた場合は'), code('20'), text('になる。')] },
      { type: 'text', content: [text('優先順位は式をどうまとめて解釈するかの規則で、オペランドの評価順序とは別の概念。Javaはオペランドを左から右へ評価する。この例はコンパイル時に値が決まる定数式なので、実行時に必ず乗算命令が先に動くという意味ではない。')] },
    ],
  },
  {
    id: 'prefix-postfix-increment-comparison',
    category: 'B',
    topic: '前置・後置インクリメント',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内で実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: 'int x = 2;\n\nint a = ++x;\nint b = x++;\n\nSystem.out.println(x + ":" + a + ":" + b);' },
    ],
    answer: [code('4:3:3')],
    explanation: [
      { type: 'steps', items: [
        [code('x = 2'), text('から開始。'), term('prefixIncrement', '前置インクリメント'), code('++x'), text('は先に'), code('x'), text('を'), code('3'), text('に更新し、'), code('a'), text('に'), code('3'), text('を代入する。')],
        [term('postIncrement', '後置インクリメント'), code('x++'), text('は更新前の'), code('3'), text('を'), code('b'), text('に代入し、'), code('x'), text('を'), code('4'), text('に更新する。')],
        [text('最終状態は'), code('x=4, a=3, b=3'), text('。したがって'), code('4:3:3'), text('を出力する。')],
      ] },
      { type: 'text', content: [text('前置と後置の違いは、式の値として更新前・更新後のどちらを使うか。後置でも変数の更新を次の文まで待つわけではない。')] },
    ],
  },
  {
    id: 'short-addition-promotion',
    category: 'C',
    topic: '二項数値昇格',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くとコンパイルできる？')] },
      { type: 'code', language: 'java', code: 'short a = 10;\nshort b = 20;\n\nshort c = a + b;' },
    ],
    answer: [code('c'), text('の宣言でコンパイルエラー。')],
    explanation: [
      { type: 'text', content: [code('a'), text('と'), code('b'), text('は'), code('short'), text('型だが、'), code('a + b'), text('には'), term('binaryNumericPromotion', '二項数値昇格'), text('が適用される。両オペランドが'), code('int'), text('へ昇格するため、演算結果の型は'), code('int'), text('になる。')] },
      { type: 'text', content: [code('a'), text('と'), code('b'), text('は定数変数ではなく、'), code('a + b'), text('はコンパイル時定数式ではない。値が'), code('short'), text('の範囲に収まっても、'), code('int'), text('型の式をそのまま'), code('short'), text('型変数へ代入できない。コード全体がコンパイルに失敗し、実行には進まない。')] },
      { type: 'text', content: [text('代入先を演算結果と同じ'), code('int'), text('型にすればコンパイルできる。')] },
      { type: 'code', language: 'java', code: 'int c = a + b;' },
    ],
  },
  {
    id: 'short-compound-assignment',
    category: 'C',
    topic: '複合代入演算子',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内に書くとコンパイルできる？ できる場合、何が出力される？')] },
      { type: 'code', language: 'java', code: 'short a = 10;\n\na += 20;\n\nSystem.out.println(a);' },
    ],
    answer: [text('コンパイルでき、'), code('30'), text('が出力される。')],
    explanation: [
      { type: 'text', content: [code('a + 20'), text('には'), term('binaryNumericPromotion', '二項数値昇格'), text('が適用され、結果は'), code('int'), text('型。通常の'), code('a = a + 20;'), text('では、その結果を'), code('short'), text('型へそのまま代入できずコンパイルエラーになる。')] },
      { type: 'text', content: [term('compoundAssignment', '複合代入演算子'), code('+='), text('では、演算結果を左辺の型へ暗黙に変換する。この例は概念的に次のように説明でき、結果の'), code('30'), text('は'), code('short'), text('の範囲内なので、そのまま格納・出力される。')] },
      { type: 'code', language: 'java', code: 'a = (short) (a + 20);' },
      { type: 'text', content: [text('ただし複合代入は左辺を1回だけ評価する。左辺に配列アクセスなどの式がある場合まで、単純に書き換えた式と完全に同じとは限らない。')] },
    ],
  },
  {
    id: 'double-to-int-cast',
    category: 'C',
    topic: '明示的な型変換',
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内で実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: 'double value = 3.9;\n\nint result = (int) value;\n\nSystem.out.println(result);' },
    ],
    answer: [code('3')],
    explanation: [
      { type: 'text', content: [code('value'), text('は'), code('double'), text('型。'), code('(int)'), text('という'), term('explicitCast', 'キャスト'), text('で明示的に'), code('int'), text('型へ縮小変換する。この値では小数部分を切り捨てて'), code('3'), text('となり、'), code('result'), text('に代入して出力する。')] },
      { type: 'text', content: [text('四捨五入ではない。浮動小数点型から整数型への変換では、有限かつ変換先の表現範囲内の値について小数部分を0方向に切り詰める。たとえば'), code('-3.9'), text('を'), code('int'), text('へ変換すると'), code('-3'), text('になる。')] },
    ],
  },
  {
    id: 'short-circuit-and',
    category: 'B',
    topic: '&&の短絡評価',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内で実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: 'int n = 0;\n\nboolean result = false && (++n > 0);\n\nSystem.out.println(n + ":" + result);' },
    ],
    answer: [code('0:false')],
    explanation: [
      { type: 'steps', items: [
        [code('&&'), text('の左辺'), code('false'), text('を評価する。')],
        [text('両辺がtrueの場合だけtrueになるため、この時点で全体の結果は'), code('false'), text('に確定する。')],
        [term('shortCircuitEvaluation', '短絡評価'), text('により右辺'), code('(++n > 0)'), text('は評価されず、'), code('++n'), text('による更新も起きない。')],
        [code('n'), text('は'), code('0'), text('のまま、'), code('result'), text('は'), code('false'), text('。出力は'), code('0:false'), text('になる。')],
      ] },
      { type: 'text', content: [code('&&'), text('では左辺がfalseのとき右辺を省略する。booleanオペランドに対する'), code('&'), text('に置き換えると右辺も評価され、'), code('n'), text('は'), code('1'), text('になる。全体の真偽値が同じでも、変数の更新という副作用が異なる。')] },
    ],
  },
  {
    id: 'boolean-and-non-short-circuit',
    category: 'B',
    topic: '&と右辺の評価',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内で実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: 'int n = 0;\n\nboolean result = false & (++n > 0);\n\nSystem.out.println(n + ":" + result);' },
    ],
    answer: [code('1:false')],
    explanation: [
      { type: 'steps', items: [
        [code('&'), text('はboolean同士の論理ANDとして働き、左辺が'), code('false'), text('でも右辺を評価する。')],
        [code('++n'), text('によって'), code('n=1'), text('となり、右辺'), code('1 > 0'), text('は'), code('true'), text('。')],
        [code('false & true'), text('は'), code('false'), text('。したがって'), code('1:false'), text('を出力する。')],
      ] },
      { type: 'text', content: [code('&&'), text('なら'), term('shortCircuitEvaluation', '短絡評価'), text('により、左辺が'), code('false'), text('の時点で右辺を省略するため、出力は'), code('0:false'), text('になる。')] },
    ],
  },
  {
    id: 'short-circuit-or',
    category: 'B',
    topic: '||の短絡評価',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内で実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: 'int n = 0;\n\nboolean result = true || (++n > 0);\n\nSystem.out.println(n + ":" + result);' },
    ],
    answer: [code('0:true')],
    explanation: [
      { type: 'steps', items: [
        [code('||'), text('の左辺'), code('true'), text('を評価する。')],
        [text('どちらか一方がtrueなら全体もtrueになるので、この時点で結果が'), code('true'), text('に確定する。')],
        [term('shortCircuitEvaluation', '短絡評価'), text('により右辺は評価されず、'), code('++n'), text('も実行されない。')],
        [code('n'), text('は'), code('0'), text('のまま、'), code('result'), text('は'), code('true'), text('。出力は'), code('0:true'), text('になる。')],
      ] },
      { type: 'text', content: [code('&&'), text('は左辺が'), code('false'), text('のとき、'), code('||'), text('は左辺が'), code('true'), text('のときに右辺の評価を省略する。左辺の値から右辺を評価する必要があるか判断する。')] },
    ],
  },
  {
    id: 'conditional-operator-evaluation',
    category: 'B',
    topic: '条件演算子',
    timeWeight: 1.5,
    prompt: [
      { type: 'text', content: [text('次のコードをメソッド内で実行すると何が出力される？')] },
      { type: 'code', language: 'java', code: 'int n = 0;\n\nint result = n == 0 ? 10 : ++n;\n\nSystem.out.println(n + ":" + result);' },
    ],
    answer: [code('0:10')],
    explanation: [
      { type: 'steps', items: [
        [term('conditionalOperator', '条件演算子'), text('の第1オペランド（条件式）'), code('n == 0'), text('を先に評価する。'), code('n'), text('は'), code('0'), text('なので'), code('true'), text('。')],
        [code('?'), text('の直後の第2オペランド'), code('10'), text('が選ばれ、評価される。')],
        [code(':'), text('の後ろの第3オペランド'), code('++n'), text('は評価されないので、'), code('n'), text('は'), code('0'), text('のまま。')],
        [text('選ばれた式の値'), code('10'), text('を'), code('result'), text('に代入し、'), code('0:10'), text('を出力する。')],
      ] },
      { type: 'text', content: [text('条件がtrueなら第2オペランド、falseなら第3オペランドを評価する。第2・第3オペランドは両方ではなく、選択された片方だけが評価される。')] },
    ],
  },
] satisfies Question[];
